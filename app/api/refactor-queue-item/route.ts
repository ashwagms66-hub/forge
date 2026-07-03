import { NextResponse } from 'next/server';
import { getRefactorProvider } from '@/src/ai/provider';
import type { ComponentMetrics, RecommendationImpact, Suggestion, SuggestionCategory } from '@/src/types';

interface RefactorQueueItemRequest {
  fileName: string;
  reasons: string[];
  currentScoreEstimate: number;
  estimatedProjectImpact: RecommendationImpact;
  estimatedTime: string;
}

const VALID_IMPACTS: RecommendationImpact[] = ['low', 'medium', 'high'];

function isValidRequest(body: unknown): body is RefactorQueueItemRequest {
  if (!body || typeof body !== 'object') {
    return false;
  }
  const candidate = body as Record<string, unknown>;

  return (
    typeof candidate.fileName === 'string' &&
    candidate.fileName.trim() !== '' &&
    Array.isArray(candidate.reasons) &&
    candidate.reasons.every((reason) => typeof reason === 'string') &&
    typeof candidate.currentScoreEstimate === 'number' &&
    typeof candidate.estimatedProjectImpact === 'string' &&
    VALID_IMPACTS.includes(candidate.estimatedProjectImpact as RecommendationImpact) &&
    typeof candidate.estimatedTime === 'string'
  );
}

function deriveComponentName(fileName: string): string {
  const base = fileName.split('/').pop() ?? fileName;
  return base.replace(/\.tsx?$/, '') || 'Unknown';
}

function guessCategory(reason: string): SuggestionCategory {
  const lower = reason.toLowerCase();
  if (lower.includes('hook')) return 'hooks';
  if (lower.includes('effect')) return 'effects';
  if (lower.includes('prop')) return 'props';
  if (lower.includes('jsx') || lower.includes('nest')) return 'complexity';
  return 'structure';
}

/**
 * The refactor queue only carries lightweight per-file metadata (no
 * source, no full ComponentMetrics) - this adapts that metadata into the
 * shape the existing RefactorAI interface expects, without changing the
 * interface, the provider abstraction, or the parser.
 */
function buildProviderInput(body: RefactorQueueItemRequest): {
  metrics: ComponentMetrics;
  suggestions: Suggestion[];
} {
  const metrics: ComponentMetrics = {
    componentName: deriveComponentName(body.fileName),
    fileName: body.fileName,
    linesOfCode: 0,
    totalLines: 0,
    numberOfProps: 0,
    numberOfHooks: 0,
    numberOfUseEffects: 0,
    numberOfFunctions: 0,
    jsxNestingDepth: 0,
    hookNames: [],
    analyzedAt: new Date(),
  };

  const suggestions: Suggestion[] = body.reasons.map((reason, idx) => ({
    id: `refactor-queue-${idx}`,
    title: reason,
    description: `${reason} (estimated current score: ${body.currentScoreEstimate}, estimated time: ${body.estimatedTime})`,
    severity: body.estimatedProjectImpact,
    category: guessCategory(reason),
  }));

  return { metrics, suggestions };
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
      {
        error:
          'Request must include fileName (string), reasons (string[]), currentScoreEstimate (number), estimatedProjectImpact ("low"|"medium"|"high"), and estimatedTime (string)',
      },
      { status: 400 }
    );
  }

  try {
    const { metrics, suggestions } = buildProviderInput(body);
    const provider = getRefactorProvider();
    const draft = await provider.generateRefactorDraft(body.fileName, '', metrics, suggestions);

    return NextResponse.json(draft);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate refactor draft' },
      { status: 500 }
    );
  }
}
