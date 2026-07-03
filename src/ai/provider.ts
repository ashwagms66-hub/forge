/**
 * AI Provider Abstraction
 * Resolves which RefactorAI implementation backs refactor draft generation.
 *
 * - No OPENAI_API_KEY -> local, rule-based provider only.
 * - OPENAI_API_KEY present -> OpenAI provider, wrapped with a safe fallback
 *   to the local provider if the OpenAI call fails for any reason.
 *
 * OPENAI_API_KEY is read from process.env, which only exists on the
 * server for a plain (non NEXT_PUBLIC_) env var - it is never bundled
 * into client code and this module is only ever imported from server
 * route handlers.
 */

import { ReportGenerator } from '@/src/engine/reporter';
import { OpenAIRefactorProvider } from './openaiProvider';
import type { ComponentMetrics, RefactorDraft, Suggestion } from '@/src/types';
import type { RefactorAI } from './types';

class LocalRefactorProvider implements RefactorAI {
  async generateRefactorDraft(
    _fileName: string,
    _fileContent: string,
    metrics: ComponentMetrics,
    suggestions: Suggestion[]
  ): Promise<RefactorDraft> {
    return ReportGenerator.generateRefactorDraft(metrics, suggestions);
  }
}

/**
 * Wraps a primary provider with a safe fallback: if the primary throws
 * (missing/invalid key, network error, malformed response, etc.), the
 * error is logged server-side and the fallback provider's draft is
 * returned instead so the request never fails outright.
 */
class FallbackRefactorProvider implements RefactorAI {
  constructor(
    private readonly primary: RefactorAI,
    private readonly fallback: RefactorAI
  ) {}

  async generateRefactorDraft(
    fileName: string,
    fileContent: string,
    metrics: ComponentMetrics,
    suggestions: Suggestion[]
  ): Promise<RefactorDraft> {
    try {
      return await this.primary.generateRefactorDraft(fileName, fileContent, metrics, suggestions);
    } catch (error) {
      console.error(
        '[ai/provider] Primary refactor provider failed, falling back to local provider:',
        error instanceof Error ? error.message : error
      );
      return this.fallback.generateRefactorDraft(fileName, fileContent, metrics, suggestions);
    }
  }
}

const localProvider: RefactorAI = new LocalRefactorProvider();

export function getRefactorProvider(): RefactorAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return localProvider;
  }

  return new FallbackRefactorProvider(new OpenAIRefactorProvider(apiKey), localProvider);
}
