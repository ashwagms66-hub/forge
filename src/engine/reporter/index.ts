/**
 * Report Generator - Phase 5
 * Builds a local, non-AI refactor draft from existing suggestions.
 * No external calls and no real code generation - that's a future phase.
 */

import type { ComponentMetrics, RefactorDraft, Suggestion } from '@/src/types';

export class ReportGenerator {
  static generateRefactorDraft(metrics: ComponentMetrics, suggestions: Suggestion[]): RefactorDraft {
    if (suggestions.length === 0) {
      return {
        summary: `${metrics.componentName} has no flagged suggestions, so there's no refactor plan to draft yet.`,
        steps: [],
        note: 'AI integration coming next.',
      };
    }

    const summary = `${metrics.componentName} has ${suggestions.length} flagged suggestion${
      suggestions.length === 1 ? '' : 's'
    }. Here is a draft plan grouping them into rough steps.`;

    const steps = suggestions.map((suggestion) => `[${suggestion.category}] ${suggestion.title}`);

    return {
      summary,
      steps,
      note: 'This is a placeholder plan generated from local rules, not real code. AI integration coming next.',
    };
  }
}
