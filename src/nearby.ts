import AsyncStorage from '@react-native-async-storage/async-storage';

import { SERVER_URL } from './config';
import { GroupId } from './groups';
import { Lang } from './i18n';
import { getAppKey } from './identify';
import { seasonFor } from './season';

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

const GRUPPE: Record<GroupId, string> = {
  mam: 'saeugetier',
  bird: 'vogel',
  ins: 'insekt',
  amp: 'amphibie',
  mol: 'weichtier',
  ara: 'spinnentier',
  fish: 'fisch',
  rep: 'reptil',
};

// Ersatz ohne Server: die Saison-Tiere, die in der App stecken (es soll immer Vorschläge geben)
function seasonFallback(lang: Lang): NearbyAnimal[] {
  return seasonFor(new Date(), lang)
    .phenomena.slice(0, 3)
    .map((p) => ({ name: p.title, wissenschaftlicher_name: '', gruppe: GRUPPE[p.icon] ?? '', wo: p.where, tipp: p.text }));
}

// Drei Vorschläge – immer: vom Server, sonst die letzten vom Server, sonst die Saison-Tiere aus der App.
export async function loadNearby(region: string, lang: Lang): Promise<NearbyAnimal[]> {
  const fresh = await loadFromServer(region, lang);
  if (fresh) return fresh;
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const c = JSON.parse(cached) as { key: string; tiere: NearbyAnimal[] };
      // nur in derselben Sprache und Region wiederverwenden
      if (c.key.startsWith(`${region}|${lang}|`) && c.tiere?.length) return c.tiere;
    }
  } catch {
    // ignorieren
  }
  return seasonFallback(lang);
}

// Holt drei Vorschläge vom Server. Pro Tag, Tageszeit und Region nur einmal (spart Kosten).
async function loadFromServer(region: string, lang: Lang): Promise<NearbyAnimal[] | null> {
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
