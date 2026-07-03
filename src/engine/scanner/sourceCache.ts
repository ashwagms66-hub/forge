/**
 * Scan Source Cache
 * Retains the real file contents extracted during a project/GitHub scan,
 * keyed by a per-scan id, so the Refactor Queue can later request an AI
 * draft derived from a file's actual source rather than metadata alone.
 * Server-only, in-memory, bounded (oldest scans are evicted once full).
 */

import { randomUUID } from 'crypto';
import type { ProjectFile } from './index';

const MAX_SCANS = 25;

const scans = new Map<string, Map<string, string>>();

export function createScanId(): string {
  return randomUUID();
}

export function storeScanFiles(scanId: string, files: ProjectFile[]): void {
  if (scans.size >= MAX_SCANS && !scans.has(scanId)) {
    const oldestKey = scans.keys().next().value;
    if (oldestKey !== undefined) {
      scans.delete(oldestKey);
    }
  }

  const byFileName = new Map<string, string>();
  for (const file of files) {
    byFileName.set(file.fileName, file.fileContent);
  }
  scans.set(scanId, byFileName);
}

export function getScanFileContent(scanId: string, fileName: string): string | undefined {
  return scans.get(scanId)?.get(fileName);
}
