import AsyncStorage from '@react-native-async-storage/async-storage';

import { SERVER_URL } from './config';
import { Lang } from './i18n';
import { getAppKey } from './identify';

export type NearbyAnimal = {
  name: string;
  wissenschaftlicher_name: string;
  gruppe: string;
  wo: string;
  tipp: string;
};

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

// Wie in der Vorlage: 6–17 Uhr = tagsüber, sonst abends
export function daytime(date = new Date()): 'day' | 'eve' {
  const h = date.getHours();
  return h >= 6 && h < 17 ? 'day' : 'eve';
}

const CACHE_KEY = 'findimal-nearby';

// Holt drei Vorschläge vom Server. Pro Tag, Tageszeit und Region nur einmal (spart Kosten).
export async function loadNearby(region: string, lang: Lang): Promise<NearbyAnimal[] | null> {
  const now = new Date();
  const zeit = `${MONTHS[now.getMonth()]}, ${daytime(now) === 'day' ? 'tagsüber' : 'abends'}`;
  const key = `${region}|${lang}|${now.toDateString()}|${zeit}`;

  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const c = JSON.parse(cached) as { key: string; tiere: NearbyAnimal[] };
      if (c.key === key) return c.tiere;
    }
  } catch {
    // Zwischenspeicher kaputt: neu laden
  }

  if (!SERVER_URL) return null;
  try {
    const res = await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Findimal-Key': await getAppKey() },
      body: JSON.stringify({ mode: 'nearby', region: region || 'Mitteleuropa', zeit, lang }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { tiere?: NearbyAnimal[] };
    const tiere = (data.tiere ?? []).slice(0, 3);
    if (!tiere.length) return null;
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ key, tiere })).catch(() => {});
    return tiere;
  } catch {
    return null;
  }
}
