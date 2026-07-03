/**
 * Suggestions Generator - Phase 4
 * Generates rule-based refactoring suggestions from the metrics produced by ReactParser
 */

import type {
  ComponentMetrics,
  Suggestion,
  SuggestionCategory,
  SuggestionSeverity,
} from '@/src/types';

interface Rule {
  id: string;
  category: SuggestionCategory;
  title: string;
  describe: (metrics: ComponentMetrics) => string;
  test: (metrics: ComponentMetrics) => boolean;
  severity: (metrics: ComponentMetrics) => SuggestionSeverity;
}

const RULES: Rule[] = [
  {
    id: 'loc-over-150',
    category: 'structure',
    title: 'Split this component into smaller components.',
    describe: (m) =>
      `This component has ${m.linesOfCode} lines of code, above the 150-line guideline for a single component. Consider extracting cohesive sections into their own components.`,
    test: (m) => m.linesOfCode > 150,
    severity: (m) => (m.linesOfCode > 300 ? 'critical' : 'high'),
  },
  {
    id: 'jsx-depth-over-4',
    category: 'complexity',
    title: 'Reduce JSX nesting by extracting nested UI sections.',
    describe: (m) =>
      `JSX nesting reaches a depth of ${m.jsxNestingDepth}, above the recommended maximum of 4. Extract deeply nested blocks into their own components.`,
    test: (m) => m.jsxNestingDepth > 4,
    severity: (m) => (m.jsxNestingDepth > 7 ? 'high' : 'medium'),
  },
  {
    id: 'hooks-over-5',
    category: 'hooks',
    title: 'Extract stateful logic into a custom hook.',
    describe: (m) =>
      `This component uses ${m.numberOfHooks} hooks, above the recommended 5. Group related state and effects into a custom hook to simplify the component.`,
    test: (m) => m.numberOfHooks > 5,
    severity: (m) => (m.numberOfHooks > 10 ? 'high' : 'medium'),
  },
  {
    id: 'functions-over-6',
    category: 'structure',
    title: 'Move handler functions into smaller utilities or hooks.',
    describe: (m) =>
      `This component defines ${m.numberOfFunctions} functions, above the recommended 6. Move pure helpers into utility modules and stateful handlers into hooks.`,
    test: (m) => m.numberOfFunctions > 6,
    severity: (m) => (m.numberOfFunctions > 12 ? 'high' : 'medium'),
  },
  {
    id: 'useeffect-over-2',
    category: 'effects',
    title: 'Review side effects and combine or isolate them.',
    describe: (m) =>
      `This component has ${m.numberOfUseEffects} useEffect calls, above the recommended 2. Combine related effects or isolate them into custom hooks so dependencies stay easy to reason about.`,
    test: (m) => m.numberOfUseEffects > 2,
    severity: (m) => (m.numberOfUseEffects > 5 ? 'critical' : 'high'),
  },
  {
    id: 'props-over-8',
    category: 'props',
    title: 'Group related props into objects or simplify the component API.',
    describe: (m) =>
      `This component accepts ${m.numberOfProps} props, above the recommended 8. Group related props into objects to simplify the component API.`,
    test: (m) => m.numberOfProps > 8,
    severity: (m) => (m.numberOfProps > 15 ? 'medium' : 'low'),
  },
];

export class SuggestionsGenerator {
  static generate(metrics: ComponentMetrics): Suggestion[] {
    return RULES.filter((rule) => rule.test(metrics)).map((rule) => ({
      id: rule.id,
      title: rule.title,
      description: rule.describe(metrics),
      severity: rule.severity(metrics),
      category: rule.category,
    }));
  }
}
