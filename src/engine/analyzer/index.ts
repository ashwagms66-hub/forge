/**
 * Main Analyzer Engine
 * Orchestrates parsing and analysis workflow
 */

import { ReactParser } from '@/src/engine/parser';
import { ScoringEngine } from '@/src/engine/scorer';
import { SuggestionsGenerator } from '@/src/engine/suggestions';
import type { AnalysisResult, ParserInput } from '@/src/types';

export class AnalysisEngine {
  /**
   * Generate a simple unique ID
   */
  private static generateId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Analyze a React component file
   * Returns raw metrics without scoring
   */
  static analyze(input: ParserInput): AnalysisResult {
    const analysisId = this.generateId();
    const startTime = new Date();

    try {
      // Parse the component
      const metrics = ReactParser.parse(input.fileName, input.fileContent);

      // Score the component
      const score = ScoringEngine.score(metrics);

      // Generate refactoring suggestions
      const suggestions = SuggestionsGenerator.generate(metrics);

      // Create analysis result
      const result: AnalysisResult = {
        id: analysisId,
        status: 'success',
        metrics,
        score,
        suggestions,
        startedAt: startTime,
        completedAt: new Date(),
      };

      // Calculate duration
      if (result.completedAt) {
        result.duration = result.completedAt.getTime() - startTime.getTime();
      }

      return result;
    } catch (error) {
      return {
        id: analysisId,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          componentName: 'Unknown',
          fileName: input.fileName,
          linesOfCode: 0,
          totalLines: 0,
          numberOfProps: 0,
          numberOfHooks: 0,
          numberOfUseEffects: 0,
          numberOfFunctions: 0,
          jsxNestingDepth: 0,
          hookNames: [],
          analyzedAt: new Date(),
        },
        startedAt: startTime,
        completedAt: new Date(),
      };
    }
  }
}
