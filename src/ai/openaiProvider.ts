/**
 * OpenAI Refactor Provider
 * Calls the OpenAI Chat Completions API to generate a structured refactor
 * draft derived from the real source of a file. Server-only: the API key
 * is passed in by the caller (src/ai/provider.ts) and is never sent to
 * the client. Any failure (network, bad key, bad response shape) throws
 * so the caller can fall back safely to the local generator.
 */

import type { ComponentMetrics, RefactorDraft, Suggestion } from '@/src/types';
import type { RefactorAI } from './types';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

const RESPONSE_SHAPE =
  '{"summary": string, ' +
  '"problemsFound": string[], ' +
  '"refactoringStrategy": string[], ' +
  '"improvedCode": string, ' +
  '"expectedBenefits": string[], ' +
  '"confidenceScore": number (0-100), ' +
  '"confidenceReasoning": string, ' +
  '"riskLevel": "safe" | "low" | "medium" | "high", ' +
  '"riskReasoning": string, ' +
  '"explanations": Array<{"change": string, "why": string, "problemSolved": string, ' +
  '"complexityImprovement": string, "readabilityImprovement": string, "performanceImpact": string}>, ' +
  '"note": string}';

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
          temperature: 0.2,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You are a senior React/TypeScript engineer producing a refactor draft, not a final PR - ' +
                'this is a preview only, no files will be changed. ' +
                'You are given the real, complete source of one file. Base "improvedCode" strictly on that ' +
                'source: preserve its behavior and public API, only change what is needed to address the ' +
                'listed problems. Never invent code, imports, or components that are not derived from the ' +
                'provided source. If you cannot confidently improve the file, say so honestly in "summary" ' +
                'and lower "confidenceScore" rather than fabricating a rewrite. ' +
                `Respond with a JSON object with exactly these keys: ${RESPONSE_SHAPE}`,
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
      fileContent
        ? `Full source (this is the real, complete file content - the only code you may build on):\n${fileContent}`
        : 'Source: not provided. You cannot produce a real improvedCode rewrite without it - say so in ' +
          'summary, return an empty improvedCode, and set confidenceScore to 0.',
    ].join('\n\n');
  }

  private isRefactorDraft(value: unknown): value is RefactorDraft {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const draft = value as Record<string, unknown>;
    const isStringArray = (v: unknown): v is string[] =>
      Array.isArray(v) && v.every((item) => typeof item === 'string');

    const isExplanationArray = (v: unknown): v is RefactorDraft['explanations'] =>
      Array.isArray(v) &&
      v.every((item) => {
        if (!item || typeof item !== 'object') return false;
        const e = item as Record<string, unknown>;
        return (
          typeof e.change === 'string' &&
          typeof e.why === 'string' &&
          typeof e.problemSolved === 'string' &&
          typeof e.complexityImprovement === 'string' &&
          typeof e.readabilityImprovement === 'string' &&
          typeof e.performanceImpact === 'string'
        );
      });

    return (
      typeof draft.summary === 'string' &&
      isStringArray(draft.problemsFound) &&
      isStringArray(draft.refactoringStrategy) &&
      typeof draft.improvedCode === 'string' &&
      isStringArray(draft.expectedBenefits) &&
      typeof draft.confidenceScore === 'number' &&
      typeof draft.confidenceReasoning === 'string' &&
      typeof draft.riskLevel === 'string' &&
      ['safe', 'low', 'medium', 'high'].includes(draft.riskLevel) &&
      typeof draft.riskReasoning === 'string' &&
      isExplanationArray(draft.explanations) &&
      typeof draft.note === 'string'
    );
  }
}
