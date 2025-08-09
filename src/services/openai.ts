import Constants from 'expo-constants';

const extraFromConstants = (Constants as any)?.expoConfig?.extra || (Constants as any)?.manifestExtra;
let extraFromUpdates: any;
try {
  // Avoid hard dependency on expo-updates to prevent bundling errors if not installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Updates = require('expo-updates');
  extraFromUpdates = (Updates as any)?.manifest?.extra;
} catch {}
const API_KEY = (
  extraFromConstants?.OPENAI_API_KEY ??
  extraFromUpdates?.OPENAI_API_KEY ??
  (typeof process !== 'undefined' ? (process as any)?.env?.OPENAI_API_KEY : undefined)
) as string | undefined;
const API_URL = 'https://api.openai.com/v1/chat/completions';
// Consider Responses API if preferred; chat is simplest for RN MVP.

// --- Resilience helpers ---
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 700;       // backoff base
const TIMEOUT_MS = 15000;        // per request timeout
const inFlight: Record<string, Promise<any>> = {};
const cache = new Map<string, any>();

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms + Math.random()*200));

async function fetchWithTimeout(url: string, init: RequestInit, timeout = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeout);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

async function requestWithRetry(body: any, cacheKey: string) {
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  if (cacheKey in inFlight) return inFlight[cacheKey];

  const p = (async () => {
    let attempt = 0;
    while (true) {
      try {
        const res = await fetchWithTimeout(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
          body: JSON.stringify(body),
        });

        if (res.status === 429) {
          if (attempt >= MAX_RETRIES) throw new Error('rate_limited');
          const retryAfterSec = Number(res.headers.get('retry-after')) || 0;
          await sleep(retryAfterSec ? retryAfterSec * 1000 : BASE_DELAY_MS * Math.pow(2, attempt));
          attempt++;
          continue;
        }

        if (!res.ok) throw new Error(`http_${res.status}`);

        const data = await res.json();
        return data;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          if (attempt >= MAX_RETRIES) throw new Error('timeout');
          await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
          attempt++;
          continue;
        }
        if (attempt < MAX_RETRIES) {
          await sleep(BASE_DELAY_MS * Math.pow(2, attempt));
          attempt++;
          continue;
        }
        throw err;
      }
    }
  })();

  inFlight[cacheKey] = p;
  try {
    const data = await p;
    cache.set(cacheKey, data);
    return data;
  } finally {
    delete inFlight[cacheKey];
  }
}

export type Tone = 'Flirty'|'Polite'|'Funny'|'Direct'|'Witty';

const SYSTEM = `You write short, natural dating replies in a Gen-Z voice. Keep replies light, confident, playful. Slightly naughty (PG-13) but never crude, explicit, mean, manipulative, or love-bomby. Max length ~120 characters, 1–2 sentences. Avoid try-hard/cringe clichés like "m'lady", "uwu", or generic pickup lines. Emojis: optional, MAX 1, no emoji salad. Use slang sparingly: chill, low-key, vibe, bold, etc. Personalize if the seed mentions plans, places, days, or interests. Respect boundaries, de-escalate if sensitive or negative.`;

function toneStyle(tone: Tone): string {
  switch (tone) {
    case 'Flirty': return 'Playful tease, confident, flirt without being cheesy.';
    case 'Polite': return 'Warm, considerate, kind; clear but not bland.';
    case 'Funny': return 'Quick wit, light joke or wordplay; never corny or mean.';
    case 'Direct': return 'Confident, clear ask; friendly, no pressure.';
    case 'Witty': return 'Clever, smart one-liner; subtle flex, not pretentious.';
  }
}

function examples(tone: Tone): string {
  switch (tone) {
    case 'Flirty': return 'You seem like trouble in the best way—drink this week? 😉';
    case 'Polite': return 'Would love to grab coffee soon if you\'re free—totally your call.';
    case 'Funny': return 'Are we flirting or just speed-running small talk? Either way, I\'m in.';
    case 'Direct': return 'Thursday works—drink or coffee?';
    case 'Witty': return 'Chemistry seems promising. Lab test = tacos?';
  }
}

function buildUserPrompt(seed: string, tone: Tone, count?: number): string {
  const trimmedSeed = seed.trim().replace(/\s+/g, ' ').slice(-600);
  
  if (count) {
    return `Context: ${trimmedSeed}

Task: Write ${count} DISTINCT short replies for a dating chat in the ${tone} tone.
Style: ${toneStyle(tone)}
Example vibe: "${examples(tone)}"

Rules:
- Each reply 1–2 short sentences max (~120 chars)
- No numbering. Separate each reply with '---'
- Gen-Z voice: confident, playful, slightly naughty but PG-13
- Optional emoji (max 1), no emoji salad
- Personalize based on context if possible`;
  } else {
    return `Context: ${trimmedSeed}

Task: Write ONE short reply for a dating chat in the ${tone} tone.
Style: ${toneStyle(tone)}
Example vibe: "${examples(tone)}"
Length: 1–2 short sentences max (~120 characters)
Voice: Gen-Z, confident, playful, slightly naughty but PG-18`;
  }
}

export async function generateOne({ seed, tone }: { seed: string; tone: Tone }): Promise<string> {
  if (!API_KEY) throw new Error('Missing OPENAI_API_KEY');
  const cacheKey = `one:${tone}:${seed}`;
  const userPrompt = buildUserPrompt(seed, tone);

  const data = await requestWithRetry({
    model: 'gpt-4o-mini',
    temperature: 1.0,
    top_p: 0.9,
    presence_penalty: 0.3,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: userPrompt },
    ],
  }, cacheKey);

  const out = data?.choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error('empty');
  return out;
}

export async function generateManyForTone(
  { seed, tone, count = 4 }: { seed: string; tone: Tone; count?: number }
): Promise<string[]> {
  if (!API_KEY) throw new Error('Missing OPENAI_API_KEY');
  const cacheKey = `many:${count}:${tone}:${seed}`;
  const userPrompt = buildUserPrompt(seed, tone, count);

  const data = await requestWithRetry({
    model: 'gpt-4o-mini',
    temperature: 1.05,
    top_p: 0.9,
    presence_penalty: 0.35,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: userPrompt },
    ],
  }, cacheKey);

  const raw = data?.choices?.[0]?.message?.content || '';
  return raw.split('---').map((s: string) => s.trim()).filter(Boolean).slice(0, count);
}

export async function generateAllTones(seed: string, count = 4): Promise<Record<Tone, string[]>> {
  const tones: Tone[] = ['Flirty','Polite','Funny','Direct','Witty'];
  const results: Record<Tone, string[]> = {
    Flirty: [], Polite: [], Funny: [], Direct: [], Witty: [],
  };
  // Sequential to avoid rate-limit; optimize later with Promise.allSettled + small delay.
  for (const t of tones) {
    try { results[t] = await generateManyForTone({ seed, tone: t, count }); }
    catch { results[t] = []; }
  }
  // If everything came back empty, surface an error so callers can show feedback
  const hasAny = tones.some((t) => (results[t]?.length ?? 0) > 0);
  if (!hasAny) {
    throw new Error('empty_result');
  }
  return results;
}

export function prettyOpenAIError(e: any) {
  const m = String(e?.message || '');
  if (m.includes('Missing OPENAI_API_KEY')) return 'Missing API key. Add it to .env and restart the app.';
  if (m.toLowerCase().includes('network request failed')) return 'Network error. Check your connection and try again.';
  if (m.includes('rate_limited') || m.includes('429')) return 'Too many requests. Try again in a few seconds.';
  if (m.includes('timeout')) return 'Model timed out. Please try again.';
  if (m.startsWith('http_')) return 'Service error. Please try again.';
  return 'Something went wrong. Please try again.';
}
