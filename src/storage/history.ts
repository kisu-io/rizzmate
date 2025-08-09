import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HistoryItem } from '../navigation/types';

const STORAGE_KEY = '@rizzmate/history/v1';

export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Validate minimal shape
    return (parsed as HistoryItem[]).filter(
      (it) => it && typeof it.id === 'string' && typeof it.text === 'string' && typeof it.createdAt === 'number'
    );
  } catch {
    return [];
  }
}

export async function setHistory(items: HistoryItem[]): Promise<void> {
  try {
    const capped = items.slice(0, 100);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  } catch {
    // noop
  }
}

export async function addHistoryItem(item: HistoryItem): Promise<void> {
  try {
    const list = await getHistory();
    // Dedupe by identical text
    const withoutDupes = list.filter((x) => x.text.trim() !== item.text.trim());
    const next = [item, ...withoutDupes].slice(0, 100);
    await setHistory(next);
  } catch {
    // noop
  }
}

export async function deleteHistoryItem(id: string): Promise<void> {
  try {
    const list = await getHistory();
    const next = list.filter((x) => x.id !== id);
    await setHistory(next);
  } catch {
    // noop
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

export { STORAGE_KEY };



