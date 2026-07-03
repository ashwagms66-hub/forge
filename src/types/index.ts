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
 * Refactor Risk Level - How risky it would be to apply a refactor draft
 */
export type RefactorRiskLevel = 'safe' | 'low' | 'medium' | 'high';

/**
 * Refactor Explanation - Why one part of a refactor draft was made
 */
export interface RefactorExplanation {
  change: string;
  why: string;
  problemSolved: string;
  complexityImprovement: string;
  readabilityImprovement: string;
  performanceImpact: string;
}

/**
 * Refactor Draft - A structured refactor plan for a file, generated either
 * by the local rule-based reporter or by the OpenAI-backed provider, always
 * derived from the file's real source code (see RefactorResult.originalCode).
 *
 * `improvedCode` and everything else here is a preview only - Forge never
 * writes files or applies diffs on its own.
 */
export interface RefactorDraft {
  summary: string;
  problemsFound: string[];
  refactoringStrategy: string[];
  improvedCode: string;
  expectedBenefits: string[];
  confidenceScore: number; // 0-100
  confidenceReasoning: string;
  riskLevel: RefactorRiskLevel;
  riskReasoning: string;
  explanations: RefactorExplanation[];
  note: string;
}

/**
 * Refactor Result - A RefactorDraft plus the original source it was derived
 * from, as returned by the refactor-queue-item API (enough to render a
 * side-by-side comparison, a diff, and a downloadable patch).
 */
export interface RefactorResult extends RefactorDraft {
  fileName: string;
  originalCode: string;
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
 * Refactor Queue Item - A single prioritized file in the project's refactor queue.
 * Ranking/estimates are rule-based; each item can trigger AI refactor draft
 * generation (see RefactorDraft) via the "Generate AI Refactor Draft" action.
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
  // Identifies this scan's server-side source cache, so the Refactor Queue
  // can request AI drafts derived from the real scanned file contents.
  // Added by the scan API routes, not by ProjectScanner itself.
  scanId?: string;

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
