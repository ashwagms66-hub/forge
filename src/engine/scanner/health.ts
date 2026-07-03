/**
 * Project Health & Recommendations
 * Derives a project-wide health score and prioritized, actionable
 * recommendations purely from the metrics ProjectScanner already
 * computes (folders, largest component, large/hook-heavy/deep-JSX
 * component lists). No new parsing, no AI, and no reuse or duplication
 * of the per-component scorer/suggestions logic - this is a separate,
 * project-level concern.
 */

import type {
  DeepJsxComponentSummary,
  FolderSummary,
  HookHeavyComponentSummary,
  LargeComponentSummary,
  LargestComponent,
  ProjectHealth,
  ProjectHealthGrade,
  ProjectHealthStatus,
  Recommendation,
  RecommendationImpact,
  RecommendationSeverity,
} from '@/src/types';

const clamp = (value: number, min = 0, max = 100): number =>
  Math.round(Math.min(max, Math.max(min, value)));

// Health score penalty weights
const LARGE_COMPONENT_PENALTY = 6;
const HOOK_HEAVY_PENALTY = 5;
const DEEP_JSX_PENALTY = 5;
const VERY_LARGE_LARGEST_COMPONENT_LOC = 300;
const VERY_LARGE_LARGEST_COMPONENT_RATE = 0.15;
const FOLDER_HIGH_LOC = 500;
const FOLDER_HIGH_LOC_PENALTY = 8;

const SEVERITY_RANK: Record<RecommendationSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const IMPACT_RANK: Record<RecommendationImpact, number> = { high: 3, medium: 2, low: 1 };

export interface ProjectHealthInput {
  largestComponent: LargestComponent | null;
  folders: FolderSummary[];
  largeComponents: LargeComponentSummary[];
  hookHeavyComponents: HookHeavyComponentSummary[];
  deepJsxComponents: DeepJsxComponentSummary[];
}

export class ProjectHealthAnalyzer {
  static calculateHealth(input: ProjectHealthInput): ProjectHealth {
    let penalty = 0;

    // Penalize many large components
    penalty += input.largeComponents.length * LARGE_COMPONENT_PENALTY;
    // Penalize hook-heavy components
    penalty += input.hookHeavyComponents.length * HOOK_HEAVY_PENALTY;
    // Penalize deep JSX components
    penalty += input.deepJsxComponents.length * DEEP_JSX_PENALTY;

    // Penalize a very large largest component
    if (input.largestComponent && input.largestComponent.linesOfCode > VERY_LARGE_LARGEST_COMPONENT_LOC) {
      penalty +=
        (input.largestComponent.linesOfCode - VERY_LARGE_LARGEST_COMPONENT_LOC) *
        VERY_LARGE_LARGEST_COMPONENT_RATE;
    }

    // Penalize folders with very high LOC
    const highLocFolders = input.folders.filter((folder) => folder.totalLOC > FOLDER_HIGH_LOC);
    penalty += highLocFolders.length * FOLDER_HIGH_LOC_PENALTY;

    const overallScore = clamp(100 - penalty);

    return {
      overallScore,
      grade: this.getGrade(overallScore),
      status: this.getStatus(overallScore),
      summary: this.buildSummary(overallScore, {
        largeCount: input.largeComponents.length,
        hookHeavyCount: input.hookHeavyComponents.length,
        deepJsxCount: input.deepJsxComponents.length,
        highLocFolderCount: highLocFolders.length,
      }),
    };
  }

  static generateRecommendations(input: ProjectHealthInput): Recommendation[] {
    const recommendations: Recommendation[] = [];

    for (const component of input.largeComponents) {
      recommendations.push({
        title: 'Split large component',
        description: `${component.name} has ${component.loc} lines of code, well past the 150-line guideline for a single component.`,
        severity: component.loc > VERY_LARGE_LARGEST_COMPONENT_LOC ? 'critical' : 'high',
        fileName: component.name,
        reason: `${component.loc} lines of code exceeds the 150-line guideline`,
        estimatedImpact: component.loc > VERY_LARGE_LARGEST_COMPONENT_LOC ? 'high' : 'medium',
      });
    }

    for (const component of input.hookHeavyComponents) {
      recommendations.push({
        title: 'Extract stateful logic into a custom hook',
        description: `${component.name} uses ${component.hooks} hooks, above the recommended 5.`,
        severity: component.hooks > 10 ? 'high' : 'medium',
        fileName: component.name,
        reason: `${component.hooks} hooks exceeds the recommended 5`,
        estimatedImpact: component.hooks > 10 ? 'high' : 'medium',
      });
    }

    for (const component of input.deepJsxComponents) {
      recommendations.push({
        title: 'Reduce JSX nesting',
        description: `${component.name} has a JSX nesting depth of ${component.jsxDepth}, above the recommended 4.`,
        severity: component.jsxDepth > 7 ? 'high' : 'medium',
        fileName: component.name,
        reason: `JSX nesting depth of ${component.jsxDepth} exceeds the recommended 4`,
        estimatedImpact: 'medium',
      });
    }

    if (input.largestComponent && input.largestComponent.linesOfCode > VERY_LARGE_LARGEST_COMPONENT_LOC) {
      recommendations.push({
        title: 'Refactor the largest component in the project',
        description: `${input.largestComponent.componentName} is the largest component in the project at ${input.largestComponent.linesOfCode} lines of code.`,
        severity: 'critical',
        fileName: input.largestComponent.fileName,
        reason: `At ${input.largestComponent.linesOfCode} lines, this component is well beyond the ${VERY_LARGE_LARGEST_COMPONENT_LOC}-line threshold for a single component`,
        estimatedImpact: 'high',
      });
    }

    for (const folder of input.folders) {
      if (folder.totalLOC > FOLDER_HIGH_LOC) {
        recommendations.push({
          title: 'Break up an oversized folder',
          description: `The "${folder.name}" folder contains ${folder.totalLOC} lines of code across ${folder.totalFiles} file${folder.totalFiles === 1 ? '' : 's'}.`,
          severity: folder.totalLOC > FOLDER_HIGH_LOC * 2 ? 'high' : 'medium',
          reason: `${folder.totalLOC} lines of code in one folder exceeds the ${FOLDER_HIGH_LOC}-line guideline`,
          estimatedImpact: 'medium',
        });
      }
    }

    return recommendations.sort((a, b) => {
      const severityDiff = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return IMPACT_RANK[b.estimatedImpact] - IMPACT_RANK[a.estimatedImpact];
    });
  }

  private static getGrade(score: number): ProjectHealthGrade {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 75) return 'B';
    if (score >= 55) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  private static getStatus(score: number): ProjectHealthStatus {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'warning';
    return 'critical';
  }

  private static buildSummary(
    score: number,
    counts: { largeCount: number; hookHeavyCount: number; deepJsxCount: number; highLocFolderCount: number }
  ): string {
    if (score >= 90) {
      return 'Excellent project health with few structural concerns.';
    }

    const issues: string[] = [];
    if (counts.largeCount > 0) {
      issues.push(`${counts.largeCount} large component${counts.largeCount === 1 ? '' : 's'}`);
    }
    if (counts.hookHeavyCount > 0) {
      issues.push(`${counts.hookHeavyCount} hook-heavy component${counts.hookHeavyCount === 1 ? '' : 's'}`);
    }
    if (counts.deepJsxCount > 0) {
      issues.push(`${counts.deepJsxCount} deeply nested component${counts.deepJsxCount === 1 ? '' : 's'}`);
    }
    if (counts.highLocFolderCount > 0) {
      issues.push(`${counts.highLocFolderCount} oversized folder${counts.highLocFolderCount === 1 ? '' : 's'}`);
    }

    if (issues.length === 0) {
      return 'Good project health with minor concerns.';
    }

    return `Found ${issues.join(', ')} that may need attention.`;
  }
}
