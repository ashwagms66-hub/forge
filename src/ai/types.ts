/**
 * AI Provider Types
 */

import type { ComponentMetrics, RefactorDraft, Suggestion } from '@/src/types';

/**
 * RefactorAI - implemented by any backend capable of producing a refactor
 * draft (rule-based today, AI-powered once a real provider is wired up)
 */
export interface RefactorAI {
  generateRefactorDraft(
    fileName: string,
    fileContent: string,
    metrics: ComponentMetrics,
    suggestions: Suggestion[]
  ): Promise<RefactorDraft>;
}
