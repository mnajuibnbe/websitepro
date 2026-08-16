import { GoogleGenAI, Type } from '@google/genai';

/**
 * Server-only wrapper around the Gemini API for the blog editor's Topic Coverage and
 * "Questions Readers May Have" panels (Phase 3 content-depth tooling). The API key is
 * read from process.env here and never sent to the browser — the client only ever
 * talks to POST /api/blog/topic-insights (see blog-insights.routes.ts). Prompt building
 * and response parsing are pure functions so they're testable without a live API call,
 * matching this project's existing convention for external-API wrappers (email.service.ts's
 * sendEmail has no direct test either — only the routes that inject it do).
 */

const MODEL = 'gemini-2.5-flash';
const MAX_CONTENT_CHARS = 6000;

export interface TopicSubtopic { topic: string; covered: boolean }
export interface TopicInsights { subtopics: TopicSubtopic[]; questions: string[] }

export type GeminiFailureReason = 'missing_key' | 'invalid_response' | 'api_error';

/**
 * Flat shape (not a discriminated union) matching this codebase's existing convention
 * for external-API results -- see email.service.ts's EmailSendResult. This project's
 * tsconfig does not set "strict"/"strictNullChecks", and under that configuration this
 * TypeScript version (5.8.3, confirmed by isolated repro) does not reliably narrow a
 * two-branch `{ ok: true; ... } | { ok: false; ... }` union via `if (!result.ok)` --
 * `result.reason`/`result.message` end up flagged as not existing on the type even
 * though the code is correct. A flat interface with optional fields sidesteps that
 * entirely: reading `result.reason` when `ok` is true is just `undefined`, harmless.
 */
export interface GeminiInsightsResult {
  ok: boolean;
  insights?: TopicInsights;
  reason?: GeminiFailureReason;
  message?: string;
}

export function buildTopicInsightsPrompt(topic: string, contentText: string): string {
  const trimmedContent = contentText.slice(0, MAX_CONTENT_CHARS).trim();
  return [
    'You are a content-depth assistant for an evidence-based medical/skincare education blog.',
    `The target topic/search query is: "${topic}".`,
    'Below is the current article\'s plain-text content (it may be empty or only partially written):',
    '---',
    trimmedContent || '(no content written yet)',
    '---',
    `Task 1 - Topic Coverage: list 5 to 8 subtopics a thorough, expert article on "${topic}" would commonly be expected to cover. For each one, set "covered" to true only if the article content above clearly addresses it already, otherwise false.`,
    `Task 2 - Reader Questions: list 5 to 8 specific, plausible questions a reader researching "${topic}" would likely have, regardless of whether the article above already answers them.`,
    'Be specific to this exact topic — no generic placeholders like "overview" or "conclusion".',
  ].join('\n');
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    subtopics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          covered: { type: Type.BOOLEAN },
        },
        required: ['topic', 'covered'],
      },
    },
    questions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['subtopics', 'questions'],
};

export function parseTopicInsightsResponse(raw: unknown): TopicInsights | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.subtopics) || !Array.isArray(obj.questions)) return null;

  const subtopics: TopicSubtopic[] = [];
  for (const item of obj.subtopics) {
    if (!item || typeof item !== 'object') continue;
    const { topic, covered } = item as Record<string, unknown>;
    if (typeof topic === 'string' && topic.trim() && typeof covered === 'boolean') {
      subtopics.push({ topic: topic.trim(), covered });
    }
  }

  const questions = obj.questions
    .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
    .map((q) => q.trim());

  if (subtopics.length === 0 && questions.length === 0) return null;
  return { subtopics, questions };
}

let cachedClient: { apiKey: string; client: GoogleGenAI } | null = null;

function getClient(apiKey: string): GoogleGenAI {
  if (cachedClient && cachedClient.apiKey === apiKey) return cachedClient.client;
  const client = new GoogleGenAI({ apiKey });
  cachedClient = { apiKey, client };
  return client;
}

function failure(reason: GeminiFailureReason, message: string): GeminiInsightsResult {
  return { ok: false, reason, message };
}

export async function generateTopicInsights(topic: string, contentText: string, apiKey: string | undefined): Promise<GeminiInsightsResult> {
  if (!apiKey) return failure('missing_key', 'GEMINI_API_KEY is not configured.');

  try {
    const ai = getClient(apiKey);
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildTopicInsightsPrompt(topic, contentText),
      config: { responseMimeType: 'application/json', responseSchema: RESPONSE_SCHEMA },
    });

    const text = response.text;
    if (!text) return failure('invalid_response', 'The AI returned an empty response.');

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(text);
    } catch {
      return failure('invalid_response', 'The AI response was not valid JSON.');
    }

    const insights = parseTopicInsightsResponse(parsedJson);
    if (!insights) return failure('invalid_response', 'The AI response did not match the expected shape.');
    return { ok: true, insights };
  } catch (err) {
    return failure('api_error', err instanceof Error ? err.message : 'Unknown Gemini API error.');
  }
}
