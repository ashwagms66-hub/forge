/**
 * AI Provider Abstraction
 * Resolves which RefactorAI implementation backs refactor draft generation.
 * Currently always resolves to the local, rule-based provider - no AI
 * calls or API keys are required yet. Callers should depend on this
 * abstraction rather than the concrete generator, so a real AI provider
 * can be swapped in later without touching call sites.
 */

import { ReportGenerator } from '@/src/engine/reporter';
import type { ComponentMetrics, RefactorDraft, Suggestion } from '@/src/types';
import type { RefactorAI } from './types';

class LocalRefactorProvider implements RefactorAI {
  async generateRefactorDraft(
    _fileName: string,
    _fileContent: string,
    metrics: ComponentMetrics,
    suggestions: Suggestion[]
  ): Promise<RefactorDraft> {
    return ReportGenerator.generateRefactorDraft(metrics, suggestions);
  }
}

const localProvider: RefactorAI = new LocalRefactorProvider();

export function getRefactorProvider(): RefactorAI {
  return localProvider;
}
