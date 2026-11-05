import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

// Für das Abzeichen „Geteilt“: welche Funde man schon geteilt hat (jeder Fund zählt einmal).
// Gemerkt wird nur die Kennung des Fundes, auf dem Handy.

const KEY = 'findimal-shared';
let ids: string[] | null = null;
const listeners = new Set<(n: number) => void>();

async function load(): Promise<string[]> {
  if (ids) return ids;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    ids = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    ids = [];
  }
  return ids;
}

export async function markShared(findId: string | null | undefined): Promise<void> {
  if (!findId) return;
  const list = await load();
  if (list.includes(findId)) return;
  ids = [...list, findId].slice(-200);
  await AsyncStorage.setItem(KEY, JSON.stringify(ids)).catch(() => {});
  listeners.forEach((l) => l(ids!.length));
}

export function forgetShared(): void {
  ids = [];
  AsyncStorage.removeItem(KEY).catch(() => {});
  listeners.forEach((l) => l(0));
}

// Zahl der geteilten Funde (aktualisiert sich nach jedem Teilen)
export function useSharedCount(): number {
  const [n, setN] = useState(ids?.length ?? 0);
  useEffect(() => {
    let alive = true;
    load().then((l) => alive && setN(l.length));
    listeners.add(setN);
    return () => {
      alive = false;
      listeners.delete(setN);
    };
  }, []);
  return n;
}
