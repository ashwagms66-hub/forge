/**
 * Report Generator - Phase 5
 * Builds a local, non-AI refactor draft from existing suggestions. Used
 * directly when no OPENAI_API_KEY is configured, and as the safe fallback
 * when the AI provider fails (see src/ai/provider.ts). Never fabricates
 * code - "improvedCode" is left empty with an honest explanation instead.
 */

import type { ComponentMetrics, RefactorDraft, Suggestion, SuggestionCategory } from '@/src/types';

const CATEGORY_BENEFITS: Record<SuggestionCategory, string> = {
  structure: 'Easier to navigate and maintain as the codebase grows',
  complexity: 'Simpler JSX that is easier to read, test, and extend',
  hooks: 'Reusable, testable logic separated from rendering',
  effects: 'More predictable side effects with clearer dependencies',
  props: 'A smaller, more focused component API',
};

const NO_AI_NOTE = 'This is a placeholder plan generated from local rules, not real code. Configure OPENAI_API_KEY for AI-generated refactors.';

export class ReportGenerator {
  static generateRefactorDraft(metrics: ComponentMetrics, suggestions: Suggestion[]): RefactorDraft {
    if (suggestions.length === 0) {
      return {
        summary: `${metrics.componentName} has no flagged suggestions, so there's no refactor plan to draft yet.`,
        problemsFound: [],
        refactoringStrategy: [],
        improvedCode: '',
        expectedBenefits: [],
        confidenceScore: 0,
        confidenceReasoning: 'No issues were flagged, so there is nothing to have a confidence opinion about.',
        riskLevel: 'safe',
        riskReasoning: 'No changes are being proposed.',
        explanations: [],
        note: 'Configure OPENAI_API_KEY to enable AI-generated refactor drafts.',
      };
    }

    const summary = `${metrics.componentName} has ${suggestions.length} flagged suggestion${
      suggestions.length === 1 ? '' : 's'
    }. Here is a draft plan grouping them into rough steps.`;

    const problemsFound = suggestions.map((suggestion) => suggestion.description);
    const refactoringStrategy = suggestions.map(
      (suggestion) => `[${suggestion.category}] ${suggestion.title}`
    );

    const expectedBenefits = Array.from(
      new Set(suggestions.map((suggestion) => CATEGORY_BENEFITS[suggestion.category]))
    );

    const explanations = suggestions.map((suggestion) => ({
      change: suggestion.title,
      why: suggestion.description,
      problemSolved: suggestion.description,
      complexityImprovement: 'Not evaluated without AI - configure OPENAI_API_KEY for a real assessment.',
      readabilityImprovement: 'Not evaluated without AI - configure OPENAI_API_KEY for a real assessment.',
      performanceImpact: 'Not evaluated without AI - configure OPENAI_API_KEY for a real assessment.',
    }));

    return {
      summary,
      problemsFound,
      refactoringStrategy,
      improvedCode:
        '// Improved code preview is not available from local rules alone.\n' +
        `// Configure OPENAI_API_KEY to generate a real code example for ${metrics.componentName}.`,
      expectedBenefits,
      confidenceScore: 0,
      confidenceReasoning:
        'This plan was generated from local rules only, not a real code analysis, so there is no meaningful confidence score.',
      riskLevel: 'medium',
      riskReasoning:
        'No AI review of the actual code has happened - treat this as a starting point, not a vetted change.',
      explanations,
      note: NO_AI_NOTE,
    };
  }
}
