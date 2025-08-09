import { generateOne } from './openai';
import type { CompatibilityStats } from '../navigation/types';

export function heuristicsFromOCR(txt: string) {
  const lines = txt.split(/\n+/).map(s => s.trim()).filter(Boolean);
  const youLines = lines.filter(l => /(^you[: ]|^me[: ]|^i[: ]|\bI\b)/i.test(l));
  const themCount = Math.max(lines.length - youLines.length, 0);
  return {
    youCount: youLines.length,
    themCount,
  };
}

export async function analyzeCompatibility(ocrText: string): Promise<{ stats: CompatibilityStats; summary: string }> {
  const seed = (ocrText || '').trim().replace(/\s+/g,' ').slice(-2000);

  const { youCount, themCount } = heuristicsFromOCR(seed);

  const prompt = `
You are a dating analyst. Given a chat transcript (last messages, noisy text allowed), return JSON with:
{
 "youInterest": 0-100,
 "themInterest": 0-100,
 "youWords": ["top","keywords"],
 "themWords": ["top","keywords"],
 "redFlags": ["short phrases"],
 "greenFlags": ["short phrases"],
 "attachmentYou": "Secure|Anxious|Avoidant|Unknown",
 "attachmentThem": "Secure|Anxious|Avoidant|Unknown",
 "compatibility": 0-100,
 "summary": "2-3 short lines in friendly tone."
}
Rules: Be kind, PG-13, no diagnosis. If unsure, use "Unknown". Keep arrays <=4 items.
Chat:
${seed}
Return ONLY JSON.`;

  const jsonText = await generateOne({ seed: prompt, tone: 'Witty' });
  let parsed: any = {};
  try { parsed = JSON.parse(jsonText); } catch { parsed = {}; }

  const stats: CompatibilityStats = {
    youCount,
    themCount,
    youInterest: clamp(parsed.youInterest, 0, 100) ?? 50,
    themInterest: clamp(parsed.themInterest, 0, 100) ?? 50,
    youWords: parsed.youWords ?? [],
    themWords: parsed.themWords ?? [],
    redFlags: parsed.redFlags ?? [],
    greenFlags: parsed.greenFlags ?? [],
    attachmentYou: parsed.attachmentYou ?? 'Unknown',
    attachmentThem: parsed.attachmentThem ?? 'Unknown',
    compatibility: clamp(parsed.compatibility, 0, 100) ?? 50,
  };
  return { stats, summary: parsed.summary || 'Looks like there\'s some potential—play it cool and keep it fun.' };
}

function clamp(n: number, min: number, max: number){ return Math.max(min, Math.min(max, Number(n))); }

