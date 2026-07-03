/**
 * OpenAI Refactor Provider
 * Calls the OpenAI Chat Completions API to generate a refactor draft.
 * Server-only: the API key is passed in by the caller (src/ai/provider.ts)
 * and is never sent to the client. Any failure (network, bad key, bad
 * response shape) throws so the caller can fall back safely.
 */

import type { ComponentMetrics, RefactorDraft, Suggestion } from '@/src/types';
import type { RefactorAI } from './types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

export class OpenAIRefactorProvider implements RefactorAI {
  constructor(private readonly apiKey: string) {}

  async generateRefactorDraft(
    fileName: string,
    fileContent: string,
    metrics: ComponentMetrics,
    suggestions: Suggestion[]
  ): Promise<RefactorDraft> {
    let response: Response;

    try {
      response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          temperature: 0.3,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are a senior React engineer writing a refactor draft, not final code. ' +
                'Respond with a JSON object with exactly these keys: ' +
                '"summary" (string), "steps" (array of short strings), "note" (string).',
            },
            { role: 'user', content: this.buildPrompt(fileName, fileContent, metrics, suggestions) },
          ],
        }),
      });
    } catch (error) {
      throw new Error(
        `OpenAI request failed: ${error instanceof Error ? error.message : 'network error'}`
      );
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`OpenAI request failed with status ${response.status}: ${errorBody.slice(0, 300)}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== 'string') {
      throw new Error('OpenAI response did not include message content');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error('OpenAI response was not valid JSON');
    }

    if (!this.isRefactorDraft(parsed)) {
      throw new Error('OpenAI response did not match the expected refactor draft shape');
    }

    return parsed;
  }

  private buildPrompt(
    fileName: string,
    fileContent: string,
    metrics: ComponentMetrics,
    suggestions: Suggestion[]
  ): string {
    return [
      `File: ${fileName}`,
      `Metrics: ${JSON.stringify(metrics)}`,
      `Suggestions: ${JSON.stringify(suggestions)}`,
      `Source:\n${fileContent}`,
    ].join('\n\n');
  }

  private isRefactorDraft(value: unknown): value is RefactorDraft {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const draft = value as Record<string, unknown>;
    return (
      typeof draft.summary === 'string' &&
      Array.isArray(draft.steps) &&
      draft.steps.every((step) => typeof step === 'string') &&
      typeof draft.note === 'string'
    );
  }
}
