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
    </div>
  );
}
