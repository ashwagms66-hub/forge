import { NextResponse } from 'next/server';
import { ReactParser } from '@/src/engine/parser';
import { SuggestionsGenerator } from '@/src/engine/suggestions';
import { getRefactorProvider } from '@/src/ai/provider';
import { getScanFileContent } from '@/src/engine/scanner/sourceCache';
import type { RefactorResult } from '@/src/types';

interface RefactorQueueItemRequest {
  scanId: string;
  fileName: string;
}

function isValidRequest(body: unknown): body is RefactorQueueItemRequest {
  if (!body || typeof body !== 'object') {
    return false;
  }
  const candidate = body as Record<string, unknown>;

  return (
    typeof candidate.scanId === 'string' &&
    candidate.scanId.trim() !== '' &&
    typeof candidate.fileName === 'string' &&
    candidate.fileName.trim() !== ''
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (!isValidRequest(body)) {
    return NextResponse.json(
      { error: 'Request must include scanId (string) and fileName (string)' },
      { status: 400 }
    );
  }

  // Real source, never file path or statistics alone: looked up from the
  // scan's server-side source cache (see src/engine/scanner/sourceCache.ts).
  const fileContent = getScanFileContent(body.scanId, body.fileName);

  if (fileContent === undefined) {
    return NextResponse.json(
      {
        error:
          'Original source for this file was not found (the scan may have expired). Please re-scan the project and try again.',
      },
      { status: 404 }
    );
  }

  try {
    // Real metrics and suggestions from the actual file, not synthetic
    // placeholders - the parser and suggestions engine are unchanged.
    const metrics = ReactParser.parse(body.fileName, fileContent);
    const suggestions = SuggestionsGenerator.generate(metrics);

    const provider = getRefactorProvider();
    const draft = await provider.generateRefactorDraft(body.fileName, fileContent, metrics, suggestions);

    const result: RefactorResult = {
      ...draft,
      fileName: body.fileName,
      originalCode: fileContent,
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate refactor draft' },
      { status: 500 }
    );
  }
}
