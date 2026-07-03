/**
 * Refactor Queue
 * Builds a prioritized, per-file refactor queue from the project's
 * already-flagged components (large / hook-heavy / deep-JSX) and their
 * full component metrics. Reuses the existing per-component ScoringEngine
 * (unmodified) to estimate each file's current quality score - no new
 * scoring formula, no AI, no code generation.
 */

import { ScoringEngine } from '@/src/engine/scorer';
import type {
  ComponentMetrics,
  DeepJsxComponentSummary,
  HookHeavyComponentSummary,
  LargeComponentSummary,
  RefactorQueueImpact,
  RefactorQueueItem,
  RefactorQueueSeverity,
} from '@/src/types';

const MAX_QUEUE_ITEMS = 10;

export interface RefactorQueueInput {
  largeComponents: LargeComponentSummary[];
  hookHeavyComponents: HookHeavyComponentSummary[];
  deepJsxComponents: DeepJsxComponentSummary[];
  componentMetricsByFile: Map<string, ComponentMetrics>;
}

interface Candidate {
  fileName: string;
  reasons: string[];
  categoryCount: number;
  priority: number;
  loc?: number;
  hooks?: number;
  jsxDepth?: number;
}

export class RefactorQueueBuilder {
  static build(input: RefactorQueueInput): RefactorQueueItem[] {
    const candidates = new Map<string, Candidate>();

    const getCandidate = (fileName: string): Candidate => {
      let candidate = candidates.get(fileName);
      if (!candidate) {
        candidate = { fileName, reasons: [], categoryCount: 0, priority: 0 };
        candidates.set(fileName, candidate);
      }
      return candidate;
    };

    // Priority 1: largest components - weighted heaviest since LOC values
    // dominate the other factors' magnitude
    for (const component of input.largeComponents) {
      const candidate = getCandidate(component.name);
      candidate.loc = component.loc;
      candidate.categoryCount++;
      candidate.priority += component.loc;
      candidate.reasons.push(`${component.loc} lines of code exceeds the 150-line guideline`);
    }

    // Priority 2: hook-heavy components
    for (const component of input.hookHeavyComponents) {
      const candidate = getCandidate(component.name);
      candidate.hooks = component.hooks;
      candidate.categoryCount++;
      candidate.priority += component.hooks * 8;
      candidate.reasons.push(`${component.hooks} hooks exceeds the recommended 5`);
    }

    // Priority 3: deep JSX components
    for (const component of input.deepJsxComponents) {
      const candidate = getCandidate(component.name);
      candidate.jsxDepth = component.jsxDepth;
      candidate.categoryCount++;
      candidate.priority += component.jsxDepth * 6;
      candidate.reasons.push(`JSX nesting depth of ${component.jsxDepth} exceeds the recommended 4`);
    }

    // Priority 4: files appearing in multiple recommendation categories
    for (const candidate of candidates.values()) {
      if (candidate.categoryCount > 1) {
        candidate.priority += candidate.categoryCount * 50;
      }
    }

    const ranked = Array.from(candidates.values()).sort((a, b) => b.priority - a.priority);

    return ranked.slice(0, MAX_QUEUE_ITEMS).map((candidate, idx) => {
      const severity = this.getSeverity(candidate);
      const metrics = input.componentMetricsByFile.get(candidate.fileName);
      const currentScoreEstimate = metrics ? ScoringEngine.score(metrics).overall : 0;

      return {
        rank: idx + 1,
        fileName: candidate.fileName,
        currentScoreEstimate,
        estimatedProjectImpact: this.getImpact(candidate, severity),
        estimatedTime: this.getEstimatedTime(candidate, severity),
        reasons: candidate.reasons,
        severity,
      };
    });
  }

  private static getSeverity(candidate: Candidate): RefactorQueueSeverity {
    if (candidate.categoryCount >= 3) return 'critical';
    if (candidate.categoryCount === 2) return 'high';
    if (candidate.loc !== undefined && candidate.loc > 300) return 'critical';
    if (candidate.hooks !== undefined && candidate.hooks > 10) return 'high';
    if (candidate.jsxDepth !== undefined && candidate.jsxDepth > 7) return 'high';
    return 'medium';
  }

  private static getImpact(candidate: Candidate, severity: RefactorQueueSeverity): RefactorQueueImpact {
    if (candidate.categoryCount >= 2 || severity === 'critical') return 'high';
    if (severity === 'high') return 'medium';
    return 'low';
  }

  private static getEstimatedTime(candidate: Candidate, severity: RefactorQueueSeverity): string {
    if (candidate.categoryCount >= 3 || severity === 'critical') return '4-6 hours';
    if (candidate.categoryCount === 2 || severity === 'high') return '2-3 hours';
    return '1-2 hours';
  }
}
