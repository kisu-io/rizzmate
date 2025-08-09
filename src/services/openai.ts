import Constants from 'expo-constants';

const API_KEY = Constants?.expoConfig?.extra?.OPENAI_API_KEY;
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
  if (inFlight[cacheKey]) return inFlight[cacheKey];

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

const SYSTEM = `You write short, natural dating messages. Keep it concise, respectful, and in the requested tone. Avoid pickup lines that are crude or offensive.`;

function toneStyle(tone: Tone) {
  switch (tone) {
    case 'Flirty': return 'Playful, light flirty, one sentence.';
    case 'Polite': return 'Warm, considerate, respectful tone.';
    case 'Funny': return 'Light humor, one-liner vibe. Keep it kind.';
    case 'Direct': return 'Confident, straightforward, friendly.';
    case 'Witty':  return 'Clever, smart, one-liner with subtle charm.';
  }
}

export async function generateOne({ seed, tone }: { seed: string; tone: Tone }): Promise<string> {
  if (!API_KEY) throw new Error('Missing OPENAI_API_KEY');
  const cacheKey = `one:${tone}:${seed}`;
  const userPrompt = `Context:\n${seed}\n\nTask: Write ONE short reply for a dating chat in the tone: ${tone}.
Style: ${toneStyle(tone)}\nLength: 1–2 short sentences max.`;

  const data = await requestWithRetry({
    model: 'gpt-4o-mini',
    temperature: 0.9,
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
  const userPrompt =
`Context:
${seed}

Task: Write ${count} DISTINCT short replies for a dating chat in the tone: ${tone}.
Style: ${toneStyle(tone)}
Rules:
- Each reply 1–2 short sentences max.
- No numbering. Separate each reply with '---'.
- Avoid crude content; keep respectful.`;

  const data = await requestWithRetry({
    model: 'gpt-4o-mini',
    temperature: 0.9,
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
  return results;
}

export function prettyOpenAIError(e: any) {
  const m = String(e?.message || '');
  if (m.includes('rate_limited') || m.includes('429')) return 'Too many requests. Try again in a few seconds.';
  if (m.includes('timeout')) return 'Model timed out. Please try again.';
  if (m.startsWith('http_')) return 'Service error. Please try again.';
  return 'Something went wrong. Please try again.';
}
