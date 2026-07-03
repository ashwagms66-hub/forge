'use client';

import type { ProjectAnalysis } from '@/src/types';

interface ProjectResultsDisplayProps {
  analysis: ProjectAnalysis;
}

export function ProjectResultsDisplay({ analysis }: ProjectResultsDisplayProps) {
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
    </div>
  );
}
