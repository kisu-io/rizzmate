import type { Tone } from '../navigation/types';

export type Suggestion = { id: string; text: string; tone: Tone };

function seedHash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h);
}

function pickDetails(seed: string): string[] {
  const lower = seed.toLowerCase();
  const details: string[] = [];
  const keywords = ['friday', 'saturday', 'coffee', 'drinks', 'sushi', 'dog', 'gym', 'study', 'beach'];
  keywords.forEach((k) => {
    if (lower.includes(k)) details.push(k);
  });
  return details;
}

export function generateToneSuggestions(tone: Tone, seed: string, count = 4): Suggestion[] {
  const baseId = Date.now();
  const details = pickDetails(seed);
  const h = seedHash(seed + tone);
  const picks = (arr: string[]) => arr[h % arr.length];

  const ref = (fallback: string) => (details[0] ? details[0] : fallback);

  const banks: Record<Tone, string[]> = {
    Flirty: [
      `ngl you’ve been living rent‑free in my head 👀`,
      `lowkey think we’d vibe. ${ref('coffee')} soon? ☕️`,
      `this might be bold but i wanna see you this ${ref('friday')} ✨`,
      `you + me + ${ref('drinks')} this week? i’ll bring the rizz 😉`,
      `i kinda like your energy. wanna hang?` ,
    ],
    Polite: [
      `would love to hang sometime, no pressure 🙌`,
      `up for ${ref('coffee')} this week? totally your call`,
      `are you free ${ref('friday')}? happy to plan around you 🙂`,
      `keen to keep chatting—maybe ${ref('drinks')} soon?`,
      `open to meeting up when you are!`,
    ],
    Funny: [
      `you single? asking for a friend… jk it’s me 😏`,
      `plot twist: we grab ${ref('sushi')} and call it “research” 🍣`,
      `are you Wi‑Fi? cuz i’m feeling the connection 📶`,
      `on a scale of 1‑10 you’re a ${((h % 3) + 8)}. wanna prove it over ${ref('coffee')}?`,
      `i’m bad at math but we add up tho 🧮`,
    ],
    Direct: [
      `when are we grabbing ${ref('drinks')}?`,
      `let’s do ${ref('coffee')} this ${ref('friday')} — you in?`,
      `i like this—meet up this week?`,
      `what’s your schedule like for ${ref('friday')}?`,
      `free tomorrow evening?`,
    ],
    Witty: [
      `small question: are you Wi‑Fi? signal says yes 📶`,
      `my hypothesis: we’d crush a ${ref('coffee')} chat. test it?`,
      `statistically, ${ref('friday')} is perfect for a meet‑cute 📊`,
      `low‑key convinced we’d banter dangerously well ⚡️`,
      `scheduling joy: you + me + ${ref('coffee')} = ✅`,
    ],
  };

  const lines = banks[tone];
  const out: Suggestion[] = [];
  for (let i = 0; i < count; i += 1) {
    const idx = (h + i) % lines.length;
    out.push({ id: `${baseId}-${tone}-${i}`, text: lines[idx], tone });
  }
  return out;
}

export function generateAllSuggestions(seed: string): Record<Tone, Suggestion[]> {
  const tones: Tone[] = ['Flirty', 'Polite', 'Funny', 'Direct', 'Witty'];
  const entries = tones.map((t) => [t, generateToneSuggestions(t, seed, 4)] as const);
  return Object.fromEntries(entries) as Record<Tone, Suggestion[]>;
}


