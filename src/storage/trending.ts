import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY = '@rizzmate/trending/v1';

export type LineMetric = { id: string; copies: number; saves: number; lastUsedAt: number };

export async function getMetrics(): Promise<Record<string, LineMetric>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, LineMetric>;
    return {};
  } catch {
    return {};
  }
}

export async function bumpMetric(id: string, field: 'copies' | 'saves'): Promise<void> {
  try {
    const metrics = await getMetrics();
    const now = Date.now();
    const current = metrics[id] ?? { id, copies: 0, saves: 0, lastUsedAt: now };
    const next: LineMetric = {
      ...current,
      [field]: (current[field] ?? 0) + 1,
      lastUsedAt: now,
    } as LineMetric;
    metrics[id] = next;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    // noop
  }
}


