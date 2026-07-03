/**
 * Core Type Definitions for Forge Analysis Engine
 */

/**
 * Component Metrics - Raw metrics extracted from the component
 */
export interface ComponentMetrics {
  // Identifiers
  componentName: string;
  fileName: string;

  // Size metrics
  linesOfCode: number;
  totalLines: number;

  // Component structure
  numberOfProps: number;
  numberOfHooks: number;
  numberOfUseEffects: number;
  numberOfFunctions: number;
  jsxNestingDepth: number;

  // Hook names extracted
  hookNames: string[];

  // Timestamps
  analyzedAt: Date;
}

/**
 * Quality Grade - Letter grade derived from the overall quality score
 */
export type QualityGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Quality Color - Visual severity indicator derived from the overall quality score
 */
export type QualityColor = 'green' | 'blue' | 'yellow' | 'orange' | 'red';

/**
 * Quality Score - Calculated scores for different aspects
 */
export interface QualityScore {
  overall: number; // 0-100
  complexity: number; // 0-100
  maintainability: number; // 0-100
  performance: number; // 0-100
  accessibility: number; // 0-100 (reserved - not yet independently measured by the parser)
  grade: QualityGrade;
  color: QualityColor;
  explanation: string;
}

/**
 * Suggestion Severity - How urgently a suggestion should be addressed
 */
export type SuggestionSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Suggestion Category - Which aspect of the component a suggestion targets
 */
export type SuggestionCategory = 'structure' | 'complexity' | 'hooks' | 'effects' | 'props';

/**
 * Suggestion - A single rule-based refactoring suggestion
 */
export interface Suggestion {
  id: string;
  title: string;
  description: string;
  severity: SuggestionSeverity;
  category: SuggestionCategory;
}

/**
 * Complete Analysis Result
 */
export interface AnalysisResult {
  // Metadata
  id: string;
  status: 'success' | 'error' | 'pending';
  message?: string;

  // Core data
  metrics: ComponentMetrics;

  // Future: Will be populated in Phase 3
  score?: QualityScore;

  // Rule-based refactoring suggestions
  suggestions?: Suggestion[];

  // Timing
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
}

/**
 * Refactor Draft - A locally generated plan summarizing suggested refactors
 * (Placeholder only - no code generation yet, AI integration comes next)
 */
export interface RefactorDraft {
  summary: string;
  steps: string[];
  note: string;
}

/**
 * Parser Input - What we pass to the parser
 */
export interface ParserInput {
  fileName: string;
  fileContent: string;
}

/**
 * Parser Output - Raw extraction without scoring
 */
export interface ParserOutput {
  metrics: ComponentMetrics;
  error?: string;
}
