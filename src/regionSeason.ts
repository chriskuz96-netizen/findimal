import AsyncStorage from '@react-native-async-storage/async-storage';

import { SERVER_URL } from './config';
import { GroupId } from './groups';
import { Lang } from './i18n';
import { getAppKey } from './identify';
import { Season, seasonId, SkyMood } from './season';

// Saison-Seite für Länder außerhalb Mitteleuropas: der Server lässt sie einmal pro Land, Monat und
// Sprache von der KI schreiben und speichert sie für alle. Hier wird sie zusätzlich auf dem Handy gemerkt.
// Gesendet wird nur das Land (z. B. "TH"), nie ein Ort.

type Raw = {
  name: string;
  stimmung: 'fruehling' | 'sommer' | 'herbst' | 'winter' | 'regen' | 'trocken';
  start_monat: number | null;
  end_monat: number | null;
  tiere: { titel: string; text: string; wo: string; gruppe: GroupId; gattungen: string[] }[];
  schauspiele: { kurz: string; titel: string; text: string; wo: string }[];
  hilfe: { titel: string; text: string }[];
};

const MOOD: Record<Raw['stimmung'], SkyMood> = {
  fruehling: 'spring',
  sommer: 'summer',
  herbst: 'autumn',
  winter: 'winter',
  regen: 'rain',
  trocken: 'summer',
};

const cacheKey = (cc: string, m: number, lang: Lang) => `findimal-saison-${cc}-${m}-${lang}`;

// Zeitraum der Jahreszeit dort (Monate 1–12, auch über den Jahreswechsel)
function range(now: Date, start: number | null, end: number | null): { start: Date; end: Date } | undefined {
  if (!start || !end) return undefined;
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const back = (m - start + 12) % 12; // so viele Monate liegt der Beginn zurück
  const len = ((end - start + 12) % 12) + 1;
  if (back >= len) return undefined; // passt nicht zum aktuellen Monat
  const s = new Date(y, m - 1 - back, 1);
  return { start: s, end: new Date(s.getFullYear(), s.getMonth() + len, 1) };
}

function toSeason(raw: Raw, now: Date): Season | null {
  if (!raw?.tiere || raw.tiere.length < 4) return null;
  return {
    id: seasonId(now),
    name: raw.name,
    mood: MOOD[raw.stimmung] ?? seasonId(now),
    range: range(now, raw.start_monat, raw.end_monat),
    phenomena: raw.tiere.slice(0, 4).map((t) => ({ icon: t.gruppe, title: t.titel, text: t.text, where: t.wo, match: t.gattungen })),
    spectacle: raw.schauspiele.map((s) => ({ short: s.kurz, title: s.titel, text: s.text, where: s.wo })),
    help: raw.hilfe.map((h) => ({ title: h.titel, text: h.text })),
  };
}

export async function loadRegionSeason(cc: string, lang: Lang, now = new Date()): Promise<Season | null> {
  const m = now.getMonth() + 1;
  const key = cacheKey(cc, m, lang);
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) return toSeason(JSON.parse(cached), now);
  } catch {
    // Zwischenspeicher kaputt: neu laden
  }
  if (!SERVER_URL) return null;
  try {
    const res = await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Findimal-Key': await getAppKey() },
      body: JSON.stringify({ mode: 'saison', cc, m, lang }),
    });
    if (!res.ok) return null;
    const raw = (await res.json()) as Raw;
    const season = toSeason(raw, now);
    if (season) await AsyncStorage.setItem(key, JSON.stringify(raw)).catch(() => {});
    return season;
  } catch {
    return null;
  }
}
