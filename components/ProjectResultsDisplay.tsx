'use client';

import { useState } from 'react';
import type {
  ProjectAnalysis,
  ProjectHealthStatus,
  RecommendationSeverity,
  RefactorDraft,
  RefactorQueueItem,
} from '@/src/types';

interface ProjectResultsDisplayProps {
  analysis: ProjectAnalysis;
}

type QueueDraftState = 'idle' | 'loading' | 'success' | 'error';

const healthStatusClasses: Record<
  ProjectHealthStatus,
  { border: string; bg: string; text: string; badge: string }
> = {
  excellent: {
    border: 'border-green-500/30',
    bg: 'bg-green-950/20',
    text: 'text-green-400',
    badge: 'bg-green-500/20 text-green-300 border-green-500/30',
  },
  good: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-950/20',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  warning: {
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-950/20',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  critical: {
    border: 'border-red-500/30',
    bg: 'bg-red-950/20',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
};

const recommendationSeverityClasses: Record<
  RecommendationSeverity,
  { border: string; bg: string; badge: string }
> = {
  low: {
    border: 'border-blue-500/20',
    bg: 'bg-blue-950/10',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  medium: {
    border: 'border-yellow-500/20',
    bg: 'bg-yellow-950/10',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  high: {
    border: 'border-orange-500/20',
    bg: 'bg-orange-950/10',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  critical: {
    border: 'border-red-500/20',
    bg: 'bg-red-950/10',
    badge: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
};

export function ProjectResultsDisplay({ analysis }: ProjectResultsDisplayProps) {
  const [queueDraftState, setQueueDraftState] = useState<Record<string, QueueDraftState>>({});
  const [queueDrafts, setQueueDrafts] = useState<Record<string, RefactorDraft>>({});
  const [queueErrors, setQueueErrors] = useState<Record<string, string>>({});

  const handleGenerateQueueDraft = async (item: RefactorQueueItem) => {
    setQueueDraftState((prev) => ({ ...prev, [item.fileName]: 'loading' }));
    setQueueErrors((prev) => ({ ...prev, [item.fileName]: '' }));

    try {
      const response = await fetch('/api/refactor-queue-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: item.fileName,
          reasons: item.reasons,
          currentScoreEstimate: item.currentScoreEstimate,
          estimatedProjectImpact: item.estimatedProjectImpact,
          estimatedTime: item.estimatedTime,
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error || 'Failed to generate refactor draft');
      }

      setQueueDrafts((prev) => ({ ...prev, [item.fileName]: body as RefactorDraft }));
      setQueueDraftState((prev) => ({ ...prev, [item.fileName]: 'success' }));
    } catch (error) {
      setQueueErrors((prev) => ({
        ...prev,
        [item.fileName]: error instanceof Error ? error.message : 'Failed to generate refactor draft',
      }));
      setQueueDraftState((prev) => ({ ...prev, [item.fileName]: 'error' }));
    }
  };

  const metricItems = [
    { label: 'Total Files', value: analysis.totalFiles.toString(), icon: '📁' },
    { label: 'React Components', value: analysis.totalComponents.toString(), icon: '📦' },
    { label: 'Total Hooks', value: analysis.totalHooks.toString(), icon: '🪝' },
    { label: 'useEffect Calls', value: analysis.totalUseEffects.toString(), icon: '⚡' },
    { label: 'Total Lines of Code', value: analysis.totalLinesOfCode.toString(), icon: '📝' },
    { label: 'Average Component Size', value: `${analysis.averageComponentSize} LOC`, icon: '📊' },
  ];

  return (
    <div className="space-y-6 rounded-2xl border border-blue-500/30 bg-blue-950/20 p-8">
      {/* Header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-white">Project Scan Results</h2>
        <p className="mt-2 text-sm text-gray-400">
          Scanned {analysis.totalFiles} file{analysis.totalFiles === 1 ? '' : 's'}
        </p>
      </div>

      {/* Project Health */}
      <div
        className={`rounded-2xl border p-6 ${healthStatusClasses[analysis.projectHealth.status].border} ${
          healthStatusClasses[analysis.projectHealth.status].bg
        }`}
      >
        <div className="flex items-center gap-6">
          <p className={`text-5xl font-bold ${healthStatusClasses[analysis.projectHealth.status].text}`}>
            {analysis.projectHealth.overallScore}
          </p>
          <div>
            <span
              className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold capitalize ${
                healthStatusClasses[analysis.projectHealth.status].badge
              }`}
            >
              Grade {analysis.projectHealth.grade} · {analysis.projectHealth.status}
            </span>
            <p className="mt-2 text-sm text-gray-300">{analysis.projectHealth.summary}</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metricItems.map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 transition-all hover:border-blue-500/50 hover:bg-gray-900/80"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{item.value}</p>
              </div>
              <span className="text-xl">{item.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Largest Component */}
      {analysis.largestComponent && (
        <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-300">Largest Component</p>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-white">{analysis.largestComponent.componentName}</p>
              <p className="mt-1 font-mono text-xs text-gray-500">{analysis.largestComponent.fileName}</p>
            </div>
            <p className="shrink-0 text-2xl font-bold text-blue-400">
              {analysis.largestComponent.linesOfCode} LOC
            </p>
          </div>
        </div>
      )}

      {/* Architecture Insights */}
      <div className="border-t border-gray-700 pt-6">
        <h3 className="mb-4 text-xl font-bold text-white">Architecture Insights</h3>

        <div className="space-y-4">
          {/* Largest Folder */}
          {analysis.largestFolder && (
            <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-300">Largest Folder</p>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-lg font-bold text-white">{analysis.largestFolder.name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {analysis.largestFolder.totalFiles} file
                    {analysis.largestFolder.totalFiles === 1 ? '' : 's'} ·{' '}
                    {analysis.largestFolder.components} component
                    {analysis.largestFolder.components === 1 ? '' : 's'}
                  </p>
                </div>
                <p className="shrink-0 text-2xl font-bold text-blue-400">
                  {analysis.largestFolder.totalLOC} LOC
                </p>
              </div>
            </div>
          )}

          {/* Folder Breakdown */}
          {analysis.folders.length > 0 && (
            <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-300">Folder Breakdown</p>
              <div className="space-y-2">
                {analysis.folders.map((folder, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 rounded-lg border border-gray-700 bg-gray-900/70 px-3 py-2"
                  >
                    <p className="truncate font-mono text-sm text-gray-300">{folder.name}</p>
                    <p className="shrink-0 text-xs text-gray-500">
                      {folder.totalFiles} file{folder.totalFiles === 1 ? '' : 's'} · {folder.components}{' '}
                      component{folder.components === 1 ? '' : 's'} · {folder.totalLOC} LOC
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Large Components */}
          {analysis.largeComponents.length > 0 && (
            <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-300">Large Components (&gt;150 LOC)</p>
              <div className="space-y-2">
                {analysis.largeComponents.map((component, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 rounded-lg border border-orange-500/20 bg-orange-950/10 px-3 py-2"
                  >
                    <p className="truncate font-mono text-sm text-gray-300">{component.name}</p>
                    <span className="shrink-0 rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-300">
                      {component.loc} LOC
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hook Heavy Components */}
          {analysis.hookHeavyComponents.length > 0 && (
            <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-300">Hook Heavy Components (&gt;5 hooks)</p>
              <div className="space-y-2">
                {analysis.hookHeavyComponents.map((component, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 rounded-lg border border-yellow-500/20 bg-yellow-950/10 px-3 py-2"
                  >
                    <p className="truncate font-mono text-sm text-gray-300">{component.name}</p>
                    <span className="shrink-0 rounded-full border border-yellow-500/30 bg-yellow-500/20 px-2 py-0.5 text-xs font-medium text-yellow-300">
                      {component.hooks} hooks
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deep JSX Components */}
          {analysis.deepJsxComponents.length > 0 && (
            <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-300">Deep JSX Components (&gt;4 depth)</p>
              <div className="space-y-2">
                {analysis.deepJsxComponents.map((component, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 rounded-lg border border-red-500/20 bg-red-950/10 px-3 py-2"
                  >
                    <p className="truncate font-mono text-sm text-gray-300">{component.name}</p>
                    <span className="shrink-0 rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-300">
                      depth {component.jsxDepth}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="border-t border-gray-700 pt-6">
          <h3 className="mb-4 text-xl font-bold text-white">Top Recommendations</h3>
          <div className="space-y-3">
            {analysis.recommendations.slice(0, 5).map((recommendation, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-3 ${recommendationSeverityClasses[recommendation.severity].border} ${
                  recommendationSeverityClasses[recommendation.severity].bg
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{recommendation.title}</p>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                      recommendationSeverityClasses[recommendation.severity].badge
                    }`}
                  >
                    {recommendation.severity}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">{recommendation.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  {recommendation.fileName && (
                    <span className="font-mono">{recommendation.fileName}</span>
                  )}
                  <span>
                    Impact: <span className="capitalize">{recommendation.estimatedImpact}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refactor Queue */}
      {analysis.refactorQueue.length > 0 && (
        <div className="border-t border-gray-700 pt-6">
          <h3 className="mb-4 text-xl font-bold text-white">Refactor Queue</h3>
          <div className="space-y-3">
            {analysis.refactorQueue.map((item) => (
              <div
                key={item.fileName}
                className={`rounded-lg border p-4 ${recommendationSeverityClasses[item.severity].border} ${
                  recommendationSeverityClasses[item.severity].bg
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-gray-300">
                      {item.rank}
                    </span>
                    <div>
                      <p className="font-mono text-sm font-semibold text-white">{item.fileName}</p>
                      <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-gray-400">
                        {item.reasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${
                      recommendationSeverityClasses[item.severity].badge
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>
                    Est. Score: <span className="font-semibold text-gray-300">{item.currentScoreEstimate}</span>
                  </span>
                  <span>
                    Est. Time: <span className="font-semibold text-gray-300">{item.estimatedTime}</span>
                  </span>
                  <span>
                    Impact:{' '}
                    <span className="font-semibold capitalize text-gray-300">
                      {item.estimatedProjectImpact}
                    </span>
                  </span>
                </div>

                <button
                  onClick={() => handleGenerateQueueDraft(item)}
                  disabled={queueDraftState[item.fileName] === 'loading'}
                  className="mt-3 w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                >
                  {queueDraftState[item.fileName] === 'loading'
                    ? 'Generating...'
                    : 'Generate AI Refactor Draft'}
                </button>

                {queueDraftState[item.fileName] === 'error' && (
                  <p className="mt-2 text-xs text-red-400">{queueErrors[item.fileName]}</p>
                )}

                {queueDrafts[item.fileName] && (
                  <div className="mt-3 rounded-lg border border-purple-500/30 bg-purple-950/20 p-3">
                    <p className="text-xs font-semibold text-purple-300">Refactor Draft</p>
                    <p className="mt-1 text-xs text-gray-300">{queueDrafts[item.fileName].summary}</p>
                    {queueDrafts[item.fileName].steps.length > 0 && (
                      <ol className="mt-2 list-inside list-decimal space-y-1 text-xs text-gray-300">
                        {queueDrafts[item.fileName].steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    )}
                    <p className="mt-2 text-xs italic text-purple-400">{queueDrafts[item.fileName].note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
