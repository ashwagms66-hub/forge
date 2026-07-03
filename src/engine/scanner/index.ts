/**
 * Project Scanner - Sprint 11 foundation
 * Extracts .ts/.tsx files from an uploaded project ZIP and aggregates raw
 * metrics across the whole project. No quality scoring yet.
 */

import JSZip from 'jszip';
import { ReactParser } from '@/src/engine/parser';
import type { LargestComponent, ProjectAnalysis } from '@/src/types';

const IGNORED_DIRECTORIES = ['node_modules', 'dist', 'build', '.next', 'coverage'];
const SOURCE_FILE_PATTERN = /\.tsx?$/;

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

  /**
   * Parse every file and aggregate project-wide metrics. A file counts as
   * a "component" when it's a .tsx file (the only extension that can
   * legally contain JSX) with a resolvable exported component name.
   */
  static analyzeProject(files: ProjectFile[]): ProjectAnalysis {
    let totalHooks = 0;
    let totalUseEffects = 0;
    let totalLinesOfCode = 0;
    let totalComponents = 0;
    let componentLinesOfCodeSum = 0;
    let largestComponent: LargestComponent | null = null;

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

      const isComponent = file.fileName.endsWith('.tsx') && metrics.componentName !== 'Unknown';
      if (!isComponent) {
        continue;
      }

      totalComponents++;
      componentLinesOfCodeSum += metrics.linesOfCode;

      if (!largestComponent || metrics.linesOfCode > largestComponent.linesOfCode) {
        largestComponent = {
          fileName: file.fileName,
          componentName: metrics.componentName,
          linesOfCode: metrics.linesOfCode,
        };
      }
    }

    const averageComponentSize =
      totalComponents > 0 ? Math.round(componentLinesOfCodeSum / totalComponents) : 0;

    return {
      totalFiles: files.length,
      totalComponents,
      totalHooks,
      totalUseEffects,
      totalLinesOfCode,
      largestComponent,
      averageComponentSize,
    };
  }
}
