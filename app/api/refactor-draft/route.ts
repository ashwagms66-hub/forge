import { NextResponse } from 'next/server';
import { AnalysisEngine } from '@/src/engine/analyzer';
import { ReportGenerator } from '@/src/engine/reporter';
import type { ParserInput } from '@/src/types';

export async function POST(request: Request) {
  let input: ParserInput;

  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  if (!input || typeof input.fileName !== 'string' || typeof input.fileContent !== 'string') {
    return NextResponse.json(
      { error: 'Request body must include fileName and fileContent strings' },
      { status: 400 }
    );
  }

  try {
    const result = AnalysisEngine.analyze(input);

    if (result.status === 'error') {
      return NextResponse.json(
        { error: result.message ?? 'Analysis failed' },
        { status: 422 }
      );
    }

    const refactorDraft = ReportGenerator.generateRefactorDraft(result.metrics, result.suggestions ?? []);

    return NextResponse.json(refactorDraft);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error generating refactor draft' },
      { status: 500 }
    );
  }
}
