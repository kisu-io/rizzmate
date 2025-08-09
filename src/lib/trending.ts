import type { LineMetric } from '../storage/trending';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function score(metric: LineMetric): number {
  const base = (metric.copies * 2) + (metric.saves * 3);
  const now = Date.now();
  const decay = Math.exp(-(now - (metric.lastUsedAt || now)) / WEEK_MS);
  return base * decay;
}

export function sortByTrending<T extends { id: string }>(items: T[], metrics: Record<string, LineMetric>): T[] {
  return [...items].sort((a, b) => (score(metrics[b.id] ?? { id: b.id, copies: 0, saves: 0, lastUsedAt: 0 }) -
    score(metrics[a.id] ?? { id: a.id, copies: 0, saves: 0, lastUsedAt: 0 })));
}


