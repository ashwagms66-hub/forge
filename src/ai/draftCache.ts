/**
 * Refactor Draft Cache
 * Caches generated RefactorDrafts by SHA256(file contents), so re-requesting
 * a draft for a file that hasn't changed returns instantly instead of
 * re-calling the AI provider. Server-only, in-memory, bounded (oldest
 * entries are evicted once the cache is full).
 */

import { createHash } from 'crypto';
import type { RefactorDraft } from '@/src/types';

const MAX_CACHE_ENTRIES = 100;

const cache = new Map<string, RefactorDraft>();

export function hashFileContents(fileContent: string): string {
  return createHash('sha256').update(fileContent).digest('hex');
}

export function getCachedDraft(hash: string): RefactorDraft | undefined {
  return cache.get(hash);
}

export function setCachedDraft(hash: string, draft: RefactorDraft): void {
  if (cache.size >= MAX_CACHE_ENTRIES && !cache.has(hash)) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) {
      cache.delete(oldestKey);
    }
  }
  cache.set(hash, draft);
}
