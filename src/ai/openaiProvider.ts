/**
 * OpenAI Refactor Provider - stub
 * No API key is required and no network calls are made yet. This exists
 * so the provider abstraction has a real second implementation ready to
 * swap in once OpenAI integration is wired up.
 */

import type { ComponentMetrics, RefactorDraft, Suggestion } from '@/src/types';
import type { RefactorAI } from './types';

export class OpenAIRefactorProvider implements RefactorAI {
  async generateRefactorDraft(
    fileName: string,
    _fileContent: string,
    _metrics: ComponentMetrics,
    _suggestions: Suggestion[]
  ): Promise<RefactorDraft> {
    return {
      summary: `AI-generated refactor drafts for ${fileName} aren't available yet.`,
      steps: [],
      note: 'OpenAI integration coming next - no API key configured.',
    };
  }
}
