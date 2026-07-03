/**
 * Scoring Engine - Phase 3
 * Calculates quality scores from the metrics produced by ReactParser
 */

import type { ComponentMetrics, QualityColor, QualityGrade, QualityScore } from '@/src/types';

const clamp = (value: number, min = 0, max = 100): number =>
  Math.round(Math.min(max, Math.max(min, value)));

interface Penalties {
  locOver80: number;
  locOver150: number;
  hooks: number;
  useEffects: number;
  functions: number;
  depth: number;
  props: number;
}

export class ScoringEngine {
  static score(metrics: ComponentMetrics): QualityScore {
    const penalties = this.calculatePenalties(metrics);
    const totalPenalty = Object.values(penalties).reduce((sum, p) => sum + p, 0);

    // Overall is penalty-driven (100 minus every accumulated penalty) rather
    // than an average of independently-clamped sub-scores, which used to let
    // a single strong category mask weaknesses in the others and left most
    // real components sitting at 99-100.
    const overall = clamp(100 - totalPenalty);

    const complexity = clamp(100 - penalties.functions - penalties.depth - penalties.hooks);
    const maintainability = clamp(100 - penalties.locOver80 - penalties.locOver150 - penalties.props);
    const performance = clamp(100 - penalties.hooks - penalties.useEffects);
    // Not yet independently measured by the parser (no JSX attribute
    // analysis) - excluded from the overall penalty total until it is.
    const accessibility = 100;

    const grade = this.getGrade(overall);
    const color = this.getColor(overall);
    const explanation = this.getExplanation(overall);

    return { overall, complexity, maintainability, performance, accessibility, grade, color, explanation };
  }

  private static calculatePenalties(metrics: ComponentMetrics): Penalties {
    return {
      // Component size - two escalating tiers so files above 150 lines are
      // hit by both the base "over 80" penalty and the extra "over 150" one
      locOver80: Math.max(0, metrics.linesOfCode - 80) * 0.08,
      locOver150: Math.max(0, metrics.linesOfCode - 150) * 0.15,
      hooks: Math.max(0, metrics.numberOfHooks - 5) * 4,
      useEffects: Math.max(0, metrics.numberOfUseEffects - 2) * 7,
      functions: Math.max(0, metrics.numberOfFunctions - 6) * 2.5,
      depth: Math.max(0, metrics.jsxNestingDepth - 4) * 4,
      props: Math.max(0, metrics.numberOfProps - 8) * 2,
    };
  }

  private static getGrade(score: number): QualityGrade {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 75) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  private static getColor(score: number): QualityColor {
    if (score >= 90) return 'green';
    if (score >= 75) return 'blue';
    if (score >= 55) return 'yellow';
    if (score >= 40) return 'orange';
    return 'red';
  }

  private static getExplanation(score: number): string {
    if (score >= 90) {
      return 'Well structured component with low complexity.';
    }
    if (score >= 75) {
      return 'Solid component with minor complexity worth keeping an eye on.';
    }
    if (score >= 55) {
      return 'Growing complexity - consider simplifying nested JSX or extracting logic.';
    }
    if (score >= 40) {
      return 'Large, complex component - watch hook usage, function count, and JSX depth.';
    }
    return 'Very complex component - strongly consider splitting this into smaller pieces.';
  }
}
