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
 * Largest Component - The single biggest component found in a project scan
 */
export interface LargestComponent {
  fileName: string;
  componentName: string;
  linesOfCode: number;
}

/**
 * Folder Summary - Aggregate metrics for a single folder in a project scan
 */
export interface FolderSummary {
  name: string;
  totalFiles: number;
  components: number;
  totalLOC: number;
}

/**
 * Large Component - A component flagged for exceeding the LOC guideline
 */
export interface LargeComponentSummary {
  name: string;
  loc: number;
}

/**
 * Hook Heavy Component - A component flagged for exceeding the hooks guideline
 */
export interface HookHeavyComponentSummary {
  name: string;
  hooks: number;
}

/**
 * Deep JSX Component - A component flagged for exceeding the JSX nesting guideline
 */
export interface DeepJsxComponentSummary {
  name: string;
  jsxDepth: number;
}

/**
 * Project Health Grade - Letter grade derived from the overall project health score
 */
export type ProjectHealthGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Project Health Status - Coarse severity bucket for the overall project health score
 */
export type ProjectHealthStatus = 'excellent' | 'good' | 'warning' | 'critical';

/**
 * Project Health - Aggregate health score derived purely from existing
 * project scan metrics (no AI, no new parsing)
 */
export interface ProjectHealth {
  overallScore: number; // 0-100
  grade: ProjectHealthGrade;
  status: ProjectHealthStatus;
  summary: string;
}

/**
 * Recommendation Severity - How urgently a project-level recommendation should be addressed
 */
export type RecommendationSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Recommendation Impact - Estimated payoff of acting on a recommendation
 */
export type RecommendationImpact = 'low' | 'medium' | 'high';

/**
 * Recommendation - A single prioritized, project-level recommendation
 */
export interface Recommendation {
  title: string;
  description: string;
  severity: RecommendationSeverity;
  fileName?: string;
  reason: string;
  estimatedImpact: RecommendationImpact;
}

/**
 * Refactor Queue Severity - How urgently a queued file should be refactored
 */
export type RefactorQueueSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Refactor Queue Impact - Estimated project-wide payoff of refactoring this file
 */
export type RefactorQueueImpact = 'low' | 'medium' | 'high';

/**
 * Refactor Queue Item - A single prioritized file in the project's refactor queue
 * (Placeholder ranking/estimates only - no AI, no code generation yet)
 */
export interface RefactorQueueItem {
  rank: number;
  fileName: string;
  currentScoreEstimate: number; // 0-100, from the existing per-component scorer
  estimatedProjectImpact: RefactorQueueImpact;
  estimatedTime: string;
  reasons: string[];
  severity: RefactorQueueSeverity;
}

/**
 * Project Analysis - Aggregate metrics, architecture insights, health
 * score, prioritized recommendations, and a refactor queue across an
 * entire scanned project.
 */
export interface ProjectAnalysis {
  totalFiles: number;
  totalComponents: number;
  totalHooks: number;
  totalUseEffects: number;
  totalLinesOfCode: number;
  largestComponent: LargestComponent | null;
  averageComponentSize: number;

  // Architecture insights (Sprint 13)
  folders: FolderSummary[];
  largestFolder: FolderSummary | null;
  largeComponents: LargeComponentSummary[];
  hookHeavyComponents: HookHeavyComponentSummary[];
  deepJsxComponents: DeepJsxComponentSummary[];

  // Project health & recommendations (Sprint 15)
  projectHealth: ProjectHealth;
  recommendations: Recommendation[];

  // Prioritized refactor queue (Sprint 16)
  refactorQueue: RefactorQueueItem[];
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
