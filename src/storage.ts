import AsyncStorage from '@react-native-async-storage/async-storage';

import { leave, loadMe } from './board';

// Alles, was die App dauerhaft auf dem Handy speichert.
const NAME_KEY = 'findimal-name';

export async function loadName(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(NAME_KEY);
  } catch {
    return null;
  }
}

export async function saveName(name: string): Promise<void> {
  try {
    await AsyncStorage.setItem(NAME_KEY, name);
  } catch {
    // Speichern fehlgeschlagen: Name gilt dann nur bis zum nächsten Start.
  }
}

export async function clearName(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NAME_KEY);
  } catch {
    // ignorieren
  }
}

// Region: null = noch nicht gefragt, '' = übersprungen, sonst Ortsname
const REGION_KEY = 'findimal-region';

export async function loadRegion(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(REGION_KEY);
  } catch {
    return null;
  }
}

export async function saveRegion(region: string): Promise<void> {
  try {
    await AsyncStorage.setItem(REGION_KEY, region);
  } catch {
    // ignorieren
  }
}

// Abzeichen, das als Profilbild dient ('' = Anfangsbuchstabe)
const AVATAR_KEY = 'findimal-avatar';

export async function loadAvatar(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(AVATAR_KEY)) ?? '';
  } catch {
    return '';
  }
}

export async function saveAvatar(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(AVATAR_KEY, id);
  } catch {
    // ignorieren
  }
}

// Bester Platz in der weltweiten Rangliste (für die Abzeichen Top 100/50/10/Nr. 1). Bleibt erhalten.
const RANK_KEY = 'findimal-best-rank';

export async function loadBestRank(): Promise<number | null> {
  try {
    const v = Number(await AsyncStorage.getItem(RANK_KEY));
    if (v > 0) return v;
    // ältere Version: nur "war in den Top 100"
    return (await AsyncStorage.getItem('findimal-top100')) === '1' ? 100 : null;
  } catch {
    return null;
  }
}

export async function saveBestRank(rank: number): Promise<void> {
  await AsyncStorage.setItem(RANK_KEY, String(rank)).catch(() => {});
}

// Löscht alle Findimal-Daten auf dem Handy (außer dem Findimal-Code für den Server).
export async function resetAll(): Promise<void> {
  try {
    // Eintrag in der Rangliste auf dem Server ebenfalls löschen
    const me = await loadMe();
    if (me) await leave(me);
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(
      keys.filter((k) => k.startsWith('findimal-') && k !== 'findimal-app-key'),
    );
  } catch {
    // ignorieren
  }
}
