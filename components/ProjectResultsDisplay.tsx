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

/** A single dashboard section: a titled card wrapping its own content. */
function DashboardSection({
  title,
  icon,
  eyebrow,
  accent = 'default',
  children,
}: {
  title: string;
  icon?: string;
  eyebrow?: string;
  accent?: 'default' | 'purple';
  children: React.ReactNode;
}) {
  const accentClasses =
    accent === 'purple'
      ? 'border-purple-500/30 bg-purple-950/10'
      : 'border-gray-700 bg-gray-900/40';

  return (
    <section className={`rounded-2xl border p-6 md:p-7 ${accentClasses}`}>
      <div className="mb-5">
        {eyebrow && (
          <p
            className={`mb-1 text-xs font-semibold uppercase tracking-wide ${
              accent === 'purple' ? 'text-purple-400' : 'text-gray-500'
            }`}
          >
            {eyebrow}
          </p>
        )}
        <h3 className="flex items-center gap-2 text-xl font-bold text-white">
          {icon && <span className="text-lg">{icon}</span>}
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function MetricTile({
  label,
  value,
  subvalue,
  icon,
}: {
  label: string;
  value: string;
  subvalue?: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 transition-all hover:border-blue-500/50 hover:bg-gray-900/80">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-400">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold text-white">{value}</p>
          {subvalue && <p className="mt-1 truncate text-xs text-gray-500">{subvalue}</p>}
        </div>
        <span className="shrink-0 text-xl">{icon}</span>
      </div>
    </div>
  );
}

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

  const generatedDrafts = Object.entries(queueDrafts);
  const health = healthStatusClasses[analysis.projectHealth.status];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Project Dashboard</h2>
        <p className="mt-1 text-sm text-gray-400">
          Scanned {analysis.totalFiles} file{analysis.totalFiles === 1 ? '' : 's'}
        </p>
      </div>

      {/* 1. Project Health (hero card) — the visual focus of the dashboard */}
      <section className={`relative overflow-hidden rounded-3xl border p-8 md:p-10 ${health.border} ${health.bg}`}>
        <div
          className={`pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl ${health.bg} opacity-70`}
        />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Project Health</p>

          <div className="mt-3 flex flex-wrap items-center gap-6">
            <p className={`text-7xl font-bold tracking-tight md:text-8xl ${health.text}`}>
              {analysis.projectHealth.overallScore}
            </p>
            <div className="min-w-0 flex-1">
              <span
                className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold capitalize ${health.badge}`}
              >
                Grade {analysis.projectHealth.grade} · {analysis.projectHealth.status}
              </span>
              <p className="mt-3 max-w-xl text-base text-gray-300">{analysis.projectHealth.summary}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
            <div>
              <p className="text-xs text-gray-400">Components</p>
              <p className="mt-1 text-xl font-semibold text-white">{analysis.totalComponents}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Lines of Code</p>
              <p className="mt-1 text-xl font-semibold text-white">{analysis.totalLinesOfCode}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Hooks</p>
              <p className="mt-1 text-xl font-semibold text-white">{analysis.totalHooks}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Metrics */}
      <DashboardSection title="Key Metrics" icon="📊">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <MetricTile label="Components" value={analysis.totalComponents.toString()} icon="📦" />
          <MetricTile label="Lines of Code" value={analysis.totalLinesOfCode.toString()} icon="📝" />
          <MetricTile label="Hooks" value={analysis.totalHooks.toString()} icon="🪝" />
          <MetricTile
            label="Largest Component"
            value={analysis.largestComponent?.componentName ?? '—'}
            subvalue={analysis.largestComponent ? `${analysis.largestComponent.linesOfCode} LOC` : undefined}
            icon="🏆"
          />
          <MetricTile
            label="Largest Folder"
            value={analysis.largestFolder?.name ?? '—'}
            subvalue={analysis.largestFolder ? `${analysis.largestFolder.totalLOC} LOC` : undefined}
            icon="🗂️"
          />
        </div>
      </DashboardSection>

      {/* 3. Architecture Insights */}
      <DashboardSection title="Architecture Insights" icon="🏗️">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Largest Folder detail */}
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
      </DashboardSection>

      {/* 4. Top Recommendations */}
      {analysis.recommendations.length > 0 && (
        <DashboardSection title="Top Recommendations" icon="💡">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
                  {recommendation.fileName && <span className="font-mono">{recommendation.fileName}</span>}
                  <span>
                    Impact: <span className="capitalize">{recommendation.estimatedImpact}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>
      )}

      {/* 5. Refactor Queue — the main action area of the dashboard */}
      {analysis.refactorQueue.length > 0 && (
        <DashboardSection
          title="Refactor Queue"
          icon="🛠️"
          eyebrow="Take action"
          accent="purple"
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
                    : queueDrafts[item.fileName]
                      ? 'Regenerate AI Refactor Draft'
                      : 'Generate AI Refactor Draft'}
                </button>

                {queueDraftState[item.fileName] === 'error' && (
                  <p className="mt-2 text-xs text-red-400">{queueErrors[item.fileName]}</p>
                )}

                {queueDrafts[item.fileName] && (
                  <p className="mt-2 text-xs text-gray-500">
                    Draft ready — see it in the AI Draft Preview section below.
                  </p>
                )}
              </div>
            ))}
          </div>
        </DashboardSection>
      )}

      {/* 6. AI Draft Preview */}
      <DashboardSection title="AI Draft Preview" icon="✨" accent="purple">
        {generatedDrafts.length === 0 ? (
          <p className="text-sm text-gray-500">
            Generate a draft from the Refactor Queue above to see a preview here.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {generatedDrafts.map(([fileName, draft]) => (
              <div
                key={fileName}
                className="space-y-3 rounded-xl border border-purple-500/30 bg-purple-950/20 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="truncate font-mono text-xs text-purple-300">{fileName}</p>
                  <span className="shrink-0 rounded-full border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-300">
                    Preview only — no files changed
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Draft Summary</p>
                  <p className="mt-1 text-sm text-gray-200">{draft.summary}</p>
                </div>

                {draft.steps.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Numbered Steps
                    </p>
                    <ol className="mt-1 list-inside list-decimal space-y-1 text-sm text-gray-200">
                      {draft.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</p>
                  <p className="mt-1 text-xs italic text-purple-300">{draft.note}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
