/**
 * Forge Analysis Engine - Main Entry Point
 * Exports all engine components
 */

export { AnalysisEngine } from './analyzer';
export { ReactParser } from './parser';
export { ScoringEngine } from './scorer';
export { SuggestionsGenerator } from './suggestions';
export { ReportGenerator } from './reporter';

// Re-export types
export type { AnalysisResult, ComponentMetrics, QualityScore, Suggestion } from '@/src/types';
