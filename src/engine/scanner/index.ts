/**
 * Project Scanner
 * Extracts .ts/.tsx files from an uploaded project ZIP and aggregates raw
 * metrics and architecture insights across the whole project. No quality
 * scoring yet.
 */

import JSZip from 'jszip';
import { ReactParser } from '@/src/engine/parser';
import { ProjectHealthAnalyzer } from '@/src/engine/scanner/health';
import { RefactorQueueBuilder } from '@/src/engine/scanner/refactorQueue';
import type {
  ComponentMetrics,
  DeepJsxComponentSummary,
  FolderSummary,
  HookHeavyComponentSummary,
  LargeComponentSummary,
  LargestComponent,
  ProjectAnalysis,
} from '@/src/types';

const IGNORED_DIRECTORIES = ['node_modules', 'dist', 'build', '.next', 'coverage'];
const SOURCE_FILE_PATTERN = /\.tsx?$/;

// Architecture insight thresholds - mirrors the suggestion engine's rules
const LARGE_COMPONENT_LOC_THRESHOLD = 150;
const HOOK_HEAVY_THRESHOLD = 5;
const DEEP_JSX_THRESHOLD = 4;

export interface ProjectFile {
  fileName: string;
  fileContent: string;
}

export class ProjectScanner {
  /**
   * Extract .ts/.tsx files from a project ZIP, skipping node_modules,
   * dist, build, .next, and coverage at any depth in the archive.
   */
  static async extractProjectFiles(zipData: ArrayBuffer | Uint8Array): Promise<ProjectFile[]> {
    const zip = await JSZip.loadAsync(zipData);
    const files: ProjectFile[] = [];

    for (const entry of Object.values(zip.files)) {
      if (entry.dir) {
        continue;
      }
      if (!SOURCE_FILE_PATTERN.test(entry.name)) {
        continue;
      }
      if (this.isIgnored(entry.name)) {
        continue;
      }

      const fileContent = await entry.async('string');
      files.push({ fileName: entry.name, fileContent });
    }

    return files;
  }

  private static isIgnored(path: string): boolean {
    const segments = path.split('/');
    return segments.some((segment) => IGNORED_DIRECTORIES.includes(segment));
  }

  private static folderOf(fileName: string): string {
    const lastSlash = fileName.lastIndexOf('/');
    return lastSlash === -1 ? '.' : fileName.slice(0, lastSlash);
  }

  /**
   * Parse every file and aggregate project-wide metrics and architecture
   * insights. A file counts as a "component" when it's a .tsx file (the
   * only extension that can legally contain JSX) with a resolvable
   * exported component name.
   */
  static analyzeProject(files: ProjectFile[]): ProjectAnalysis {
    let totalHooks = 0;
    let totalUseEffects = 0;
    let totalLinesOfCode = 0;
    let totalComponents = 0;
    let componentLinesOfCodeSum = 0;
    let largestComponent: LargestComponent | null = null;

    const folderMap = new Map<string, FolderSummary>();
    const largeComponents: LargeComponentSummary[] = [];
    const hookHeavyComponents: HookHeavyComponentSummary[] = [];
    const deepJsxComponents: DeepJsxComponentSummary[] = [];
    const componentMetricsByFile = new Map<string, ComponentMetrics>();

    for (const file of files) {
      let metrics;
      try {
        metrics = ReactParser.parse(file.fileName, file.fileContent);
      } catch {
        // Skip files that fail to parse rather than failing the whole scan
        continue;
      }

      totalHooks += metrics.numberOfHooks;
      totalUseEffects += metrics.numberOfUseEffects;
      totalLinesOfCode += metrics.linesOfCode;

      const folderName = this.folderOf(file.fileName);
      const folder = folderMap.get(folderName) ?? {
        name: folderName,
        totalFiles: 0,
        components: 0,
        totalLOC: 0,
      };
      folder.totalFiles++;
      folder.totalLOC += metrics.linesOfCode;
      folderMap.set(folderName, folder);

      const isComponent = file.fileName.endsWith('.tsx') && metrics.componentName !== 'Unknown';
      if (!isComponent) {
        continue;
      }

      totalComponents++;
      componentLinesOfCodeSum += metrics.linesOfCode;
      folder.components++;
      componentMetricsByFile.set(file.fileName, metrics);

      if (!largestComponent || metrics.linesOfCode > largestComponent.linesOfCode) {
        largestComponent = {
          fileName: file.fileName,
          componentName: metrics.componentName,
          linesOfCode: metrics.linesOfCode,
        };
      }

      if (metrics.linesOfCode > LARGE_COMPONENT_LOC_THRESHOLD) {
        largeComponents.push({ name: file.fileName, loc: metrics.linesOfCode });
      }
      if (metrics.numberOfHooks > HOOK_HEAVY_THRESHOLD) {
        hookHeavyComponents.push({ name: file.fileName, hooks: metrics.numberOfHooks });
      }
      if (metrics.jsxNestingDepth > DEEP_JSX_THRESHOLD) {
        deepJsxComponents.push({ name: file.fileName, jsxDepth: metrics.jsxNestingDepth });
      }
    }

    const averageComponentSize =
      totalComponents > 0 ? Math.round(componentLinesOfCodeSum / totalComponents) : 0;

    const folders = Array.from(folderMap.values()).sort((a, b) => b.totalLOC - a.totalLOC);
    const largestFolder = folders.length > 0 ? folders[0] : null;

    largeComponents.sort((a, b) => b.loc - a.loc);
    hookHeavyComponents.sort((a, b) => b.hooks - a.hooks);
    deepJsxComponents.sort((a, b) => b.jsxDepth - a.jsxDepth);

    const healthInput = { largestComponent, folders, largeComponents, hookHeavyComponents, deepJsxComponents };
    const projectHealth = ProjectHealthAnalyzer.calculateHealth(healthInput);
    const recommendations = ProjectHealthAnalyzer.generateRecommendations(healthInput);

    const refactorQueue = RefactorQueueBuilder.build({
      largeComponents,
      hookHeavyComponents,
      deepJsxComponents,
      componentMetricsByFile,
    });

    return {
      totalFiles: files.length,
      totalComponents,
      totalHooks,
      totalUseEffects,
      totalLinesOfCode,
      largestComponent,
      averageComponentSize,
      folders,
      largestFolder,
      largeComponents,
      hookHeavyComponents,
      deepJsxComponents,
      projectHealth,
      recommendations,
      refactorQueue,
    };
  }
}
