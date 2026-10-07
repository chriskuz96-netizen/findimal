import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

import { SERVER_URL } from './config';
import { getAppKey } from './identify';

// Rangliste mit Freunden. Auf dem Server liegen nur Spitzname, XP, Stufe,
// Anzahl Arten und das Abzeichen-Bild – keine Fotos und keine Fundorte.

export type Me = { id: string; secret: string };
export type Person = { id: string; name: string; xp: number; level: number; species: number; avatar: string };
export type MyStats = { name: string; xp: number; level: number; species: number; avatar: string };

const ME_KEY = 'findimal-board';
const FRIENDS_KEY = 'findimal-friends';
const SENT_KEY = 'findimal-board-sent';
const REMOVED_KEY = 'findimal-friends-removed'; // entfernte Freunde nicht wieder automatisch aufnehmen
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ohne 0/O und 1/I (leicht zu verwechseln)

const random = (n: number, chars: string) =>
  Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

// Freundescode schön lesbar: "K7Q X2M" -> intern "K7QX2M"
export const cleanCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');
export const isCode = (code: string) => /^[A-HJ-NP-Z2-9]{6}$/.test(code);

async function call(body: object): Promise<Response> {
  return fetch(SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Findimal-Key': await getAppKey() },
    body: JSON.stringify(body),
  });
}

export async function loadMe(): Promise<Me | null> {
  try {
    const raw = await AsyncStorage.getItem(ME_KEY);
    return raw ? (JSON.parse(raw) as Me) : null;
  } catch {
    return null;
  }
}

export async function loadFriends(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FRIENDS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function saveFriends(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(ids)).catch(() => {});
}

export async function loadRemoved(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(REMOVED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function saveRemoved(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(REMOVED_KEY, JSON.stringify(ids)).catch(() => {});
}

// Mitmachen: eigenen Freundescode anlegen und die eigenen Werte hochladen.
// Liefert einen Fehlergrund oder null bei Erfolg.
export type JoinError = 'offline' | 'nodb' | 'old' | 'key';

export async function join(stats: MyStats): Promise<{ me: Me | null; error: JoinError | null }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const me = { id: random(6, LETTERS), secret: random(32, LETTERS) };
    const res = await call({ mode: 'board_save', ...me, ...stats }).catch(() => null);
    if (!res) return { me: null, error: 'offline' };
    if (res.status === 503) return { me: null, error: 'nodb' };
    if (res.status === 403) continue; // Code schon vergeben: neuen würfeln
    if (res.status === 400) return { me: null, error: 'old' }; // alter Server-Code ohne Rangliste
    if (res.status === 401) return { me: null, error: 'key' }; // falscher Findimal-Code
    if (!res.ok) return { me: null, error: 'offline' };
    await AsyncStorage.setItem(ME_KEY, JSON.stringify(me)).catch(() => {});
    await AsyncStorage.setItem(SENT_KEY, JSON.stringify(stats)).catch(() => {});
    return { me, error: null };
  }
  return { me: null, error: 'offline' };
}

// Eigene Werte aktualisieren – nur wenn sich etwas geändert hat (spart Schreibzugriffe).
export async function syncMe(me: Me, stats: MyStats): Promise<void> {
  const text = JSON.stringify(stats);
  try {
    if ((await AsyncStorage.getItem(SENT_KEY)) === text) return;
    const res = await call({ mode: 'board_save', ...me, ...stats });
    if (res.ok) await AsyncStorage.setItem(SENT_KEY, text);
  } catch {
    // offline: beim nächsten Mal
  }
}

// Aussteigen: Eintrag auf dem Server löschen und alles lokal vergessen.
export async function leave(me: Me): Promise<void> {
  await call({ mode: 'board_delete', ...me }).catch(() => null);
  await AsyncStorage.multiRemove([ME_KEY, FRIENDS_KEY, SENT_KEY, REMOVED_KEY]).catch(() => {});
}

// Beim Freund vermerken, dass man ihn hinzugefügt hat (dann sieht er einen auch)
export async function link(me: Me, friend: string): Promise<void> {
  await call({ mode: 'board_link', ...me, friend }).catch(() => null);
}

// Eintrag eines anderen melden (z. B. anstößiger Name)
export async function report(me: Me, target: string): Promise<void> {
  await call({ mode: 'board_report', ...me, target }).catch(() => null);
}

// Codes von allen, die einen selbst hinzugefügt haben
export async function inbox(me: Me): Promise<string[]> {
  try {
    const res = await call({ mode: 'board_inbox', ...me });
    if (!res.ok) return [];
    const data = (await res.json()) as { ids?: string[] };
    return (data.ids ?? []).filter(isCode);
  } catch {
    return [];
  }
}

export async function fetchPeople(ids: string[]): Promise<Person[] | null> {
  if (!ids.length) return [];
  try {
    const res = await call({ mode: 'board_get', ids });
    if (!res.ok) return null;
    const data = (await res.json()) as { people?: Person[] };
    return data.people ?? [];
  } catch {
    return null;
  }
}

// Einladungslink: zeigt eine kleine Webseite des Findimal-Servers, die Findimal (in Expo Go)
// mit dem Freundescode öffnet. Ein normaler https-Link ist in WhatsApp & Co. anklickbar.
// Kann die App keinen Link auf sich selbst bauen (z. B. in Expo Go/Snack), zeigt die Seite nur Name und Code.
export function inviteLink(code: string, name: string, lang: string): string {
  let app = '';
  try {
    app = Linking.createURL('invite', { queryParams: { code } });
  } catch {
    app = '';
  }
  const q = [`c=${code}`, `n=${encodeURIComponent(name)}`, `l=${lang}`];
  if (app) q.push(`u=${encodeURIComponent(app)}`);
  return `${SERVER_URL.replace(/\/$/, '')}/einladung?${q.join('&')}`;
}

// Freundescode aus einem Link, mit dem die App geöffnet wurde (oder null)
export function codeFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const code = Linking.parse(url).queryParams?.code;
    const id = typeof code === 'string' ? cleanCode(code) : '';
    return isCode(id) ? id : null;
  } catch {
    return null;
  }
}

// Weltweite Rangliste: die 100 Entdecker mit den meisten XP
export async function fetchTop(): Promise<Person[] | null> {
  try {
    const res = await call({ mode: 'board_top' });
    if (!res.ok) return null;
    const data = (await res.json()) as { people?: Person[] };
    return data.people ?? [];
  } catch {
    return null;
  }
}
