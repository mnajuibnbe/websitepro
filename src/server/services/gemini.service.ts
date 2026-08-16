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

/**
 * Confirmed via live Vercel function logs (2026-08-16, POST /api/blog/topic-insights):
 * `gemini-2.5-flash` returns a 404 from Google — "This model ... is no longer available
 * to new users" — for the API key/project backing this app's `GEMINI_API_KEY`, even
 * though the key itself is valid and correctly configured. That 404 was being caught
 * as a generic `api_error` and surfaced to the admin as "temporarily unavailable",
 * which masked the real cause. `GEMINI_MODEL` lets the model be swapped via an env var
 * (no redeploy of code) the next time Google rotates which models a given key can use --
 * a demonstrated recurring failure mode for this API, not a hypothetical one.
 */
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
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

const MAX_META_INPUT_CHARS = 4000;
const META_DESCRIPTION_SAFETY_CAP = 400;

/**
 * Prompt encodes two independent constraints so a single Gemini call satisfies both:
 * (1) Google Search Central's actual meta-description guidance (developers.google.com/
 * search/docs/appearance/snippet) -- no fixed length limit but SERPs truncate around
 * device width, must be genuinely descriptive of *this* page (not boilerplate/keyword
 * stuffing), unique per page; (2) this project's established anti-AI-writing-trope rules
 * (same discipline as the homepage copy rewrite) so the output doesn't read as
 * machine-generated -- overused verbs/adjectives, "it's not just X it's Y", rhetorical
 * questions, "In today's...", em dashes, and setup-colon dramatics are all explicitly
 * banned below rather than left to the model's default style.
 */
export function buildMetaDescriptionPrompt(title: string, excerpt: string, contentText: string, primaryKeyword: string): string {
  const trimmedContent = contentText.slice(0, MAX_META_INPUT_CHARS).trim();
  return [
    'Write a meta description tag for this medical/skincare education blog article.',
    `Title: "${title}"`,
    excerpt ? `Excerpt: "${excerpt}"` : '',
    primaryKeyword ? `What a reader would search to find this article: "${primaryKeyword}"` : '',
    'Article content (may be partial):',
    '---',
    trimmedContent || '(no content written yet)',
    '---',
    'Requirements (Google Search Central guidance):',
    '- Accurately summarize what THIS specific article covers -- no generic filler, no boilerplate that could apply to any article.',
    '- Roughly 120-155 characters. Google truncates longer snippets, so do not pad to hit a minimum.',
    '- Plain, natural, human sentence(s). No keyword stuffing.',
    'Writing style -- avoid every one of these, no exceptions:',
    '- Overused verbs: dive into, leverage, harness, unlock, empower, revolutionize, streamline, optimize, elevate.',
    '- Overused adjectives: robust, seamless, cutting-edge, game-changing, holistic, innovative, dynamic, transformative.',
    '- Overused nouns: journey, landscape, paradigm, synergy, ecosystem.',
    '- Sentence patterns: "It\'s not just X, it\'s Y", "The result?", rhetorical questions, starting with "In today\'s...".',
    '- Em dashes, colons used as a dramatic setup ("Here\'s the thing:"), and exclamation points.',
    'Output ONLY the meta description text itself -- no quotation marks, no label, no explanation.',
  ].filter(Boolean).join('\n');
}

/** Strips wrapping quotes/labels a model might add despite instructions, collapses whitespace, and caps runaway length. */
export function sanitizeMetaDescriptionText(raw: string): string {
  let text = raw.trim().replace(/\s+/g, ' ');
  text = text.replace(/^(meta description:?\s*)/i, '');
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith('“') && text.endsWith('”'))) {
    text = text.slice(1, -1).trim();
  }
  if (text.length <= META_DESCRIPTION_SAFETY_CAP) return text;
  const truncated = text.slice(0, META_DESCRIPTION_SAFETY_CAP);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim();
}

/** Same flat-result convention as GeminiInsightsResult -- see its comment for why. */
export interface GeminiMetaDescriptionResult {
  ok: boolean;
  description?: string;
  reason?: GeminiFailureReason;
  message?: string;
}

function metaFailure(reason: GeminiFailureReason, message: string): GeminiMetaDescriptionResult {
  return { ok: false, reason, message };
}

export async function generateMetaDescription(title: string, excerpt: string, contentText: string, primaryKeyword: string, apiKey: string | undefined): Promise<GeminiMetaDescriptionResult> {
  if (!apiKey) return metaFailure('missing_key', 'GEMINI_API_KEY is not configured.');
  if (!title.trim()) return metaFailure('invalid_response', 'A title is required to generate a meta description.');

  try {
    const ai = getClient(apiKey);
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: buildMetaDescriptionPrompt(title, excerpt, contentText, primaryKeyword),
    });

    const text = response.text;
    if (!text || !text.trim()) return metaFailure('invalid_response', 'The AI returned an empty response.');

    const description = sanitizeMetaDescriptionText(text);
    if (!description) return metaFailure('invalid_response', 'The AI response did not contain usable text.');
    return { ok: true, description };
  } catch (err) {
    return metaFailure('api_error', err instanceof Error ? err.message : 'Unknown Gemini API error.');
  }
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
