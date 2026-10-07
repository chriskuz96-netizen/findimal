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

// Abzeichen "Top 100": einmal erreicht, bleibt es
const TOP100_KEY = 'findimal-top100';

export async function loadTop100(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(TOP100_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function saveTop100(): Promise<void> {
  await AsyncStorage.setItem(TOP100_KEY, '1').catch(() => {});
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
