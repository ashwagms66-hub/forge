'use client';

import { useMemo, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-tsx';
import { createTwoFilesPatch, diffLines } from 'diff';
import type { RefactorResult, RefactorRiskLevel } from '@/src/types';

interface RefactorDraftPreviewProps {
  fileName: string;
  result: RefactorResult;
}

const riskClasses: Record<
  RefactorRiskLevel,
  { border: string; bg: string; badge: string; label: string }
> = {
  safe: {
    border: 'border-green-500/30',
    bg: 'bg-green-950/20',
    badge: 'bg-green-500/20 text-green-300 border-green-500/30',
    label: 'Safe',
  },
  low: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-950/20',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    label: 'Low Risk',
  },
  medium: {
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-950/20',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    label: 'Medium Risk',
  },
  high: {
    border: 'border-red-500/30',
    bg: 'bg-red-950/20',
    badge: 'bg-red-500/20 text-red-300 border-red-500/30',
    label: 'High Risk',
  },
};

function highlight(code: string): string {
  if (!code) {
    return '';
  }
  try {
    return Prism.highlight(code, Prism.languages.tsx, 'tsx');
  } catch {
    return code;
  }
}

function triggerDownload(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function RefactorDraftPreview({ fileName, result }: RefactorDraftPreviewProps) {
  const [tab, setTab] = useState<'side-by-side' | 'diff'>('side-by-side');
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');

  const hasImprovedCode = result.improvedCode.trim().length > 0;

  const diffChunks = useMemo(
    () => diffLines(result.originalCode, hasImprovedCode ? result.improvedCode : result.originalCode),
    [result.originalCode, result.improvedCode, hasImprovedCode]
  );

  const { addedLines, removedLines } = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const chunk of diffChunks) {
      const lineCount = chunk.count ?? 0;
      if (chunk.added) added += lineCount;
      if (chunk.removed) removed += lineCount;
    }
    return { addedLines: added, removedLines: removed };
  }, [diffChunks]);

  const risk = riskClasses[result.riskLevel];
  const baseName = fileName.split('/').pop() ?? 'component.tsx';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.improvedCode);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      // Clipboard API may be unavailable (e.g. insecure context) - nothing to do.
    }
  };

  const handleDownloadCode = () => {
    triggerDownload(baseName, result.improvedCode, 'text/plain');
  };

  const handleDownloadPatch = () => {
    const patch = createTwoFilesPatch(
      fileName,
      fileName,
      result.originalCode,
      hasImprovedCode ? result.improvedCode : result.originalCode
    );
    triggerDownload(`${baseName}.patch`, patch, 'text/x-patch');
  };

  return (
    <div className="space-y-4 rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="truncate font-mono text-xs text-purple-300">{fileName}</p>
        <span className="shrink-0 rounded-full border border-purple-500/30 bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-300">
          Preview only — no files changed
        </span>
      </div>

      {/* Summary */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Summary</p>
        <p className="mt-1 text-sm text-gray-200">{result.summary}</p>
      </div>

      {/* Confidence + Risk */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Confidence</p>
          <p className="mt-1 text-2xl font-bold text-white">{result.confidenceScore}%</p>
          <p className="mt-1 text-xs text-gray-400">{result.confidenceReasoning}</p>
        </div>
        <div className={`rounded-lg border p-3 ${risk.border} ${risk.bg}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Risk</p>
          <span
            className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${risk.badge}`}
          >
            {risk.label}
          </span>
          <p className="mt-2 text-xs text-gray-400">{result.riskReasoning}</p>
        </div>
      </div>

      {/* Problems Found */}
      {result.problemsFound.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Problems Found</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-gray-200">
            {result.problemsFound.map((problem, idx) => (
              <li key={idx}>{problem}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Refactoring Strategy */}
      {result.refactoringStrategy.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Refactoring Strategy</p>
          <ol className="mt-1 list-inside list-decimal space-y-1 text-sm text-gray-200">
            {result.refactoringStrategy.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Side-by-side / Diff */}
      {hasImprovedCode && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Code Comparison</p>
            <div className="flex gap-1 rounded-lg border border-gray-700 bg-gray-900/50 p-0.5">
              <button
                onClick={() => setTab('side-by-side')}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  tab === 'side-by-side' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Side-by-Side
              </button>
              <button
                onClick={() => setTab('diff')}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  tab === 'diff' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Diff (+{addedLines} / -{removedLines})
              </button>
            </div>
          </div>

          {tab === 'side-by-side' ? (
            <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">Original Code</p>
                <pre className="forge-code max-h-96 overflow-auto rounded-lg border border-gray-700 bg-gray-950 p-3 text-xs leading-relaxed">
                  <code dangerouslySetInnerHTML={{ __html: highlight(result.originalCode) }} />
                </pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">AI Refactored Code</p>
                <pre className="forge-code max-h-96 overflow-auto rounded-lg border border-purple-500/30 bg-gray-950 p-3 text-xs leading-relaxed">
                  <code dangerouslySetInnerHTML={{ __html: highlight(result.improvedCode) }} />
                </pre>
              </div>
            </div>
          ) : (
            <pre className="forge-code mt-2 max-h-96 overflow-auto rounded-lg border border-gray-700 bg-gray-950 p-3 text-xs leading-relaxed">
              {diffChunks.map((chunk, chunkIdx) => {
                const lines = chunk.value.replace(/\n$/, '').split('\n');
                const prefix = chunk.added ? '+' : chunk.removed ? '-' : ' ';
                const colorClass = chunk.added
                  ? 'bg-green-500/10 text-green-300'
                  : chunk.removed
                    ? 'bg-red-500/10 text-red-300'
                    : 'text-gray-400';
                return lines.map((line, lineIdx) => (
                  <div key={`${chunkIdx}-${lineIdx}`} className={colorClass}>
                    {prefix} {line}
                  </div>
                ));
              })}
            </pre>
          )}
        </div>
      )}

      {/* Explanation Timeline */}
      {result.explanations.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Explanation Timeline</p>
          <div className="mt-3 space-y-4 border-l-2 border-purple-500/30 pl-4">
            {result.explanations.map((explanation, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-purple-950 bg-purple-400" />
                <p className="text-sm font-semibold text-white">{explanation.change}</p>
                <dl className="mt-1 space-y-0.5 text-xs text-gray-400">
                  <div>
                    <dt className="inline font-medium text-gray-500">Why: </dt>
                    <dd className="inline">{explanation.why}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-gray-500">Problem solved: </dt>
                    <dd className="inline">{explanation.problemSolved}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-gray-500">Complexity: </dt>
                    <dd className="inline">{explanation.complexityImprovement}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-gray-500">Readability: </dt>
                    <dd className="inline">{explanation.readabilityImprovement}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-gray-500">Performance: </dt>
                    <dd className="inline">{explanation.performanceImpact}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expected Benefits */}
      {result.expectedBenefits.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Expected Benefits</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-gray-200">
            {result.expectedBenefits.map((benefit, idx) => (
              <li key={idx}>{benefit}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Copy / Download */}
      {hasImprovedCode && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopy}
            className="rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-purple-500/50 hover:text-white"
          >
            {copyState === 'copied' ? 'Copied!' : 'Copy Refactored Code'}
          </button>
          <button
            onClick={handleDownloadCode}
            className="rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-purple-500/50 hover:text-white"
          >
            Download .tsx
          </button>
          <button
            onClick={handleDownloadPatch}
            className="rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-purple-500/50 hover:text-white"
          >
            Download Unified Patch (.patch)
          </button>
        </div>
      )}

      {/* Notes */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</p>
        <p className="mt-1 text-xs italic text-purple-300">{result.note}</p>
      </div>
    </div>
  );
}
