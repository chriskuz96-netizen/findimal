import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

import { SERVER_URL } from './config';
import { getAppKey } from './identify';
import { Lang } from './i18n';
import { getDeviceId } from './usage';

// Anonyme Nutzerzählung: einmal am Tag „Hallo“ an den Server (nur zufällige Handy-Kennung, Sprache,
// App-Version, System, erster Start). Der Server speichert davon nur einen Hash, 90 Tage lang.
const KEY = 'findimal-hello'; // Tag des letzten Hallos (YYYY-MM-DD)

export async function sayHello(lang: Lang): Promise<void> {
  if (!SERVER_URL || Platform.OS === 'web') return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const last = await AsyncStorage.getItem(KEY);
    if (last === today) return;
    const res = await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Findimal-Key': await getAppKey(), 'X-Findimal-Device': await getDeviceId() },
      body: JSON.stringify({ mode: 'hello', lang, v: Updates.runtimeVersion ?? '', p: Platform.OS, first: last === null }),
    });
    if (res.ok) await AsyncStorage.setItem(KEY, today);
  } catch {
    // offline: beim nächsten Start nochmal
  }
}
