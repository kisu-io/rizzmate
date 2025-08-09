import Constants from 'expo-constants';

const API_KEY = Constants?.expoConfig?.extra?.OPENAI_API_KEY;
const API_URL = 'https://api.openai.com/v1/chat/completions';
// Consider Responses API if preferred; chat is simplest for RN MVP.

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
  const userPrompt =
    `Context:\n${seed}\n\nTask: Write ONE short reply for a dating chat in the tone: ${tone}.\nStyle: ${toneStyle(tone)}\nLength: 1–2 short sentences max.`;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // lightweight + cheap for mobile
      temperature: 0.9,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${text}`);
  }
  const data = await res.json();
  const out = data?.choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error('No content from OpenAI');
  return out;
}

export async function generateManyForTone({ seed, tone, count = 4 }:
  { seed: string; tone: Tone; count?: number }): Promise<string[]> {
  // Multi-suggestion in one request to save latency.
  if (!API_KEY) throw new Error('Missing OPENAI_API_KEY');
  const userPrompt =
`Context:
${seed}

Task: Write ${count} DISTINCT short replies for a dating chat in the tone: ${tone}.
Style: ${toneStyle(tone)}
Rules:
- Each reply 1–2 short sentences max.
- No numbering. Separate with "---".
- Avoid crude/NSFW content. Keep it respectful.`;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.9,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${text}`);
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || '';
  const list = raw.split('---').map((s: string) => s.trim()).filter(Boolean);
  return list.slice(0, count);
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
