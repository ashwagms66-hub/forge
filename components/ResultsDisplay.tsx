'use client';

import { useState } from 'react';
import type { AnalysisResult, QualityColor, RefactorDraft, SuggestionSeverity } from '@/src/types';

interface ResultsDisplayProps {
  analysis: AnalysisResult;
  fileContent: string;
}

const scoreColorClasses: Record<QualityColor, { border: string; bg: string; text: string; badge: string }> = {
  green: {
    border: 'border-green-500/30',
    bg: 'bg-green-950/20',
    text: 'text-green-400',
    badge: 'bg-green-500/20 text-green-300 border-green-500/30',
  },
  blue: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-950/20',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  yellow: {
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-950/20',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  orange: {
    border: 'border-orange-500/30',
    bg: 'bg-orange-950/20',
    text: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  red: {
    border: 'border-red-500/30',
    bg: 'bg-red-950/20',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
};

const severityColorClasses: Record<SuggestionSeverity, { border: string; bg: string; badge: string }> = {
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

export function ResultsDisplay({ analysis, fileContent }: ResultsDisplayProps) {
  const { metrics, score, suggestions } = analysis;
  const [refactorDraft, setRefactorDraft] = useState<RefactorDraft | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const handleGenerateDraft = async () => {
    setIsGeneratingDraft(true);
    setDraftError(null);

    try {
      const response = await fetch('/api/refactor-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: metrics.fileName,
          fileContent,
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error || 'Failed to generate refactor draft');
      }

      setRefactorDraft(body as RefactorDraft);
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : 'Failed to generate refactor draft');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const metricItems = [
    {
      label: 'Component Name',
      value: metrics.componentName,
      icon: '📦',
    },
    {
      label: 'Lines of Code',
      value: metrics.linesOfCode.toString(),
      icon: '📝',
    },
    {
      label: 'Total Lines',
      value: metrics.totalLines.toString(),
      icon: '📄',
    },
    {
      label: 'Number of Props',
      value: metrics.numberOfProps.toString(),
      icon: '🎛️',
    },
    {
      label: 'Number of Hooks',
      value: metrics.numberOfHooks.toString(),
      icon: '🪝',
    },
    {
      label: 'useEffect Calls',
      value: metrics.numberOfUseEffects.toString(),
      icon: '⚡',
    },
    {
      label: 'Functions',
      value: metrics.numberOfFunctions.toString(),
      icon: '⚙️',
    },
    {
      label: 'JSX Nesting Depth',
      value: metrics.jsxNestingDepth.toString(),
      icon: '🎯',
    },
  ];

  return (
    <div className="space-y-6 rounded-2xl border border-blue-500/30 bg-blue-950/20 p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
        <p className="mt-2 text-sm text-gray-400">
          Analyzed on {metrics.analyzedAt.toLocaleString()}
        </p>
      </div>

      {/* Quality Score */}
      {score && (
        <div
          className={`rounded-2xl border p-6 ${scoreColorClasses[score.color].border} ${scoreColorClasses[score.color].bg}`}
        >
          <div className="flex items-center gap-6">
            <p className={`text-5xl font-bold ${scoreColorClasses[score.color].text}`}>
              {score.overall}
            </p>
            <div>
              <span
                className={`inline-block rounded-full border px-3 py-1 text-sm font-semibold ${scoreColorClasses[score.color].badge}`}
              >
                Grade {score.grade}
              </span>
              <p className="mt-2 text-sm text-gray-300">{score.explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="mt-8 rounded-xl border border-gray-700 bg-gray-900/50 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-300">Suggestions</p>
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`rounded-lg border p-3 ${severityColorClasses[suggestion.severity].border} ${severityColorClasses[suggestion.severity].bg}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{suggestion.title}</p>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${severityColorClasses[suggestion.severity].badge}`}
                  >
                    {suggestion.severity}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">{suggestion.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Refactor Draft */}
      {suggestions && suggestions.length > 0 && (
        <div className="mt-6">
          <button
            onClick={handleGenerateDraft}
            disabled={isGeneratingDraft}
            className="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            {isGeneratingDraft ? 'Generating...' : 'Generate Refactor Draft'}
          </button>
        </div>
      )}

      {/* Refactor Draft Error */}
      {draftError && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/20 p-4">
          <p className="text-sm font-semibold text-red-400">Failed to generate refactor draft</p>
          <p className="mt-1 text-sm text-gray-300">{draftError}</p>
        </div>
      )}

      {/* Refactor Draft Panel */}
      {refactorDraft && (
        <div className="mt-6 rounded-2xl border border-purple-500/30 bg-purple-950/20 p-6">
          <h3 className="text-lg font-bold text-purple-300">Refactor Draft</h3>
          <p className="mt-2 text-sm text-gray-300">{refactorDraft.summary}</p>

          {refactorDraft.steps.length > 0 && (
            <ol className="mt-4 list-inside list-decimal space-y-2 text-sm text-gray-300">
              {refactorDraft.steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          )}

          <p className="mt-4 text-xs italic text-purple-400">{refactorDraft.note}</p>
        </div>
      )}

      {/* Hooks List */}
      {metrics.hookNames.length > 0 && (
        <div className="mt-8 rounded-xl border border-gray-700 bg-gray-900/50 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-300">Hooks Used</p>
          <div className="flex flex-wrap gap-2">
            {metrics.hookNames.map((hook, idx) => (
              <span
                key={idx}
                className="inline-block rounded-full bg-blue-600/20 px-3 py-1 text-sm text-blue-300 border border-blue-500/30"
              >
                {hook}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* File Info */}
      <div className="mt-6 border-t border-gray-700 pt-4">
        <p className="text-xs text-gray-500">
          Analysis ID: <span className="font-mono">{analysis.id}</span>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Duration: <span className="font-mono">{analysis.duration}ms</span>
        </p>
      </div>
    </div>
  );
}
