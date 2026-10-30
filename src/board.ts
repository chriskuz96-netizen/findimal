import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { SERVER_URL } from './config';
import { getAppKey } from './identify';
import { bonusPhotos, getDeviceId, setBonusPhotos } from './usage';

// Rangliste mit Freunden. Auf dem Server liegen nur Spitzname, XP, Stufe, Anzahl Arten und das
// Profilbild – keine Fundorte. Ein eigenes Foto (Plus) geht nur als kleines Vorschaubild hin und
// wird dort vorher geprüft (nur Tiere/Natur, keine Menschen).

export type Me = { id: string; secret: string };
// Saison-Angaben: season (z. B. "autumn-2026"), sxp = XP in dieser Saison, fav/favN = meist fotografierte
// Tiergruppe, best = beste Saison-Platzierung (r = Platz, s = Saison)
export type SeasonStats = { season?: string; sxp?: number; fav?: string; favN?: number; best?: { s: string; r: number } | null };
export type Person = { id: string; name: string; xp: number; level: number; species: number; avatar: string } & SeasonStats;
export type MyStats = { name: string; xp: number; level: number; species: number; avatar: string } & SeasonStats;

const ME_KEY = 'findimal-board';
const FRIENDS_KEY = 'findimal-friends';
const SENT_KEY = 'findimal-board-sent';
const REMOVED_KEY = 'findimal-friends-removed'; // entfernte Freunde nicht wieder automatisch aufnehmen
const PENDING_KEY = 'findimal-friends-pending'; // eigene offene Freundschaftsanfragen (warten auf Zustimmung)
// selbst gemeldet: weltweit sofort weg (für alle erst nach 3 Meldungen). Frühere Ausblendungen
// ('findimal-board-hidden', 'findimal-friends-removed') gelten weltweit nicht mehr.
const REPORTED_KEY = 'findimal-board-reported';
// Automatisch in der Rangliste: nur wer sich bei der Einrichtung einen Entdecker-Namen gegeben hat
// (ältere Nutzer haben evtl. ihren echten Namen eingetippt – die machen weiter selbst mit).
const AUTO_KEY = 'findimal-board-auto';
const OPTOUT_KEY = 'findimal-board-optout'; // selbst ausgestiegen: nicht wieder automatisch aufnehmen
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ohne 0/O und 1/I (leicht zu verwechseln)

const random = (n: number, chars: string) =>
  Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

// Freundescode schön lesbar: "K7Q X2M" -> intern "K7QX2M"
export const cleanCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');
export const isCode = (code: string) => /^[A-HJ-NP-Z2-9]{6}$/.test(code);

// Eigenes Foto als Profilbild ('f-<Fund>'): an den Server geht der Verweis auf das hochgeladene Vorschaubild
// ('u:<Code>.<Kennung>'). Solange es (noch) nicht hochgeladen oder nicht erlaubt ist: 'p-letter'
// (Anfangsbuchstabe im goldenen Plus-Rahmen; ältere App-Versionen zeigen einfach den Buchstaben).
const PHOTO_KEY = 'findimal-board-photo';
type PhotoUpload = { find: string; avatar: string; rejected?: boolean };
let photoUpload: PhotoUpload | null | undefined;
async function loadPhotoUpload(): Promise<PhotoUpload | null> {
  if (photoUpload === undefined) {
    try {
      const raw = await AsyncStorage.getItem(PHOTO_KEY);
      photoUpload = raw ? (JSON.parse(raw) as PhotoUpload) : null;
    } catch {
      photoUpload = null;
    }
  }
  return photoUpload;
}
async function publicAvatar(a: unknown): Promise<unknown> {
  if (typeof a !== 'string' || !a.startsWith('f-')) return a;
  await uploading; // läuft gerade ein Hochladen: abwarten, sonst würde der Buchstabe das neue Foto überschreiben
  const up = await loadPhotoUpload();
  return up && up.find === a.slice(2) && !up.rejected ? up.avatar : 'p-letter';
}

// Foto-Profilbild hochladen (falls noch nicht geschehen). photo: das gespeicherte Foto (data:-URI).
// 'ok' = hochgeladen, 'rejected' = Prüfung nicht bestanden, 'skip' = nichts zu tun / nicht dabei, 'error' = später nochmal
let uploading: Promise<unknown> | null = null;
export function ensurePhotoAvatar(avatar: string, photo: () => Promise<string | null>): Promise<'ok' | 'rejected' | 'skip' | 'error'> {
  // nur ein Hochladen gleichzeitig (Profil und Rangliste können es beide anstoßen)
  const run = (uploading ?? Promise.resolve()).then(() => uploadPhoto(avatar, photo));
  uploading = run.finally(() => {
    if (uploading === done) uploading = null;
  });
  const done = uploading;
  return run;
}
async function uploadPhoto(avatar: string, photo: () => Promise<string | null>): Promise<'ok' | 'rejected' | 'skip' | 'error'> {
  if (!avatar.startsWith('f-')) return 'skip';
  const find = avatar.slice(2);
  const [me, up] = await Promise.all([loadMe(), loadPhotoUpload()]);
  if (!me || up?.find === find) return 'skip';
  try {
    const uri = await photo();
    if (!uri) return 'skip';
    // quadratisch aus der Mitte, 160 × 160 – neu gespeichert, also ohne Ortsdaten im Bild
    const full = await ImageManipulator.manipulate(uri).renderAsync();
    const side = Math.min(full.width, full.height);
    const small = await ImageManipulator.manipulate(uri)
      .crop({ originX: (full.width - side) / 2, originY: (full.height - side) / 2, width: side, height: side })
      .resize({ width: 160, height: 160 })
      .renderAsync();
    const saved = await small.saveAsync({ compress: 0.6, format: SaveFormat.JPEG, base64: true });
    if (!saved.base64) return 'error';
    const res = await call({ mode: 'board_photo', ...me, image: saved.base64 });
    if (!res.ok) return 'error';
    const data = (await res.json()) as { ok: boolean; avatar?: string };
    photoUpload = data.ok && data.avatar ? { find, avatar: data.avatar } : { find, avatar: 'p-letter', rejected: true };
    await AsyncStorage.setItem(PHOTO_KEY, JSON.stringify(photoUpload)).catch(() => {});
    await AsyncStorage.removeItem(SENT_KEY).catch(() => {}); // beim nächsten Abgleich das neue Bild mitschicken
    return photoUpload.rejected ? 'rejected' : 'ok';
  } catch {
    return 'error';
  }
}

async function call(body: object): Promise<Response> {
  if ('avatar' in body) body = { ...body, avatar: await publicAvatar((body as { avatar?: unknown }).avatar) };
  return fetch(SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Findimal-Key': await getAppKey(), 'X-Findimal-Device': await getDeviceId() },
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

async function loadList(key: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
export const loadPending = () => loadList(PENDING_KEY);
export const savePending = (ids: string[]) => AsyncStorage.setItem(PENDING_KEY, JSON.stringify(ids)).catch(() => {});
export const loadReported = () => loadList(REPORTED_KEY);
export const saveReported = (ids: string[]) => AsyncStorage.setItem(REPORTED_KEY, JSON.stringify(ids)).catch(() => {});

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
    // neuer Code: ein früher hochgeladenes Foto gehört zum alten Code – neu hochladen
    photoUpload = null;
    await AsyncStorage.removeItem(PHOTO_KEY).catch(() => {});
    await AsyncStorage.removeItem(OPTOUT_KEY).catch(() => {});
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
  await AsyncStorage.multiRemove([ME_KEY, FRIENDS_KEY, SENT_KEY, REMOVED_KEY, PENDING_KEY]).catch(() => {});
  await AsyncStorage.setItem(OPTOUT_KEY, '1').catch(() => {});
}

// Bei der Einrichtung mit Entdecker-Namen: ab jetzt automatisch in der Rangliste
export async function allowAutoJoin(): Promise<void> {
  await AsyncStorage.setItem(AUTO_KEY, '1').catch(() => {});
}

// Automatisch mitmachen (einmal), wenn erlaubt und nicht selbst ausgestiegen
export async function autoJoin(stats: MyStats): Promise<void> {
  try {
    const [auto, out, me] = await Promise.all([AsyncStorage.getItem(AUTO_KEY), AsyncStorage.getItem(OPTOUT_KEY), loadMe()]);
    if (auto !== '1' || out === '1' || me) return;
    await join(stats);
  } catch {
    // offline: beim nächsten Start
  }
}

// Beim Freund vermerken, dass man ihn hinzugefügt hat (dann sieht er einen auch)
// Zeitpunkt des eigenen Einladungs-Bonus (damit er nicht auch als „Freund ist gefolgt“ gemeldet wird)
export let lastOwnBonus = 0;

// Liefert true, wenn es dafür den Einladungs-Bonus gab (je 1 Gratis-Foto extra für beide)
export async function link(me: Me, friend: string): Promise<boolean> {
  try {
    const res = await call({ mode: 'board_link', ...me, friend });
    const data = (await res.json()) as { bonus?: boolean };
    if (data.bonus) {
      lastOwnBonus = Date.now();
      await setBonusPhotos((await bonusPhotos()) + 1); // sofort nutzbar
    }
    return !!data.bonus;
  } catch {
    return false;
  }
}

// Eintrag eines anderen melden (z. B. anstößiger Name)
export async function report(me: Me, target: string): Promise<void> {
  await call({ mode: 'board_report', ...me, target }).catch(() => null);
}

// Codes von allen, die einen selbst hinzugefügt haben (ids), und offene Freundschaftsanfragen an mich.
// requests = null: der Server kennt noch keine Anfragen (älterer Stand) – dann gibt es kein „+“ in der Weltliste.
export async function inbox(me: Me): Promise<{ ids: string[]; requests: string[] | null }> {
  try {
    const res = await call({ mode: 'board_inbox', ...me });
    if (!res.ok) return { ids: [], requests: [] };
    const data = (await res.json()) as { ids?: string[]; bonus?: number; requests?: string[] };
    if (typeof data.bonus === 'number') await setBonusPhotos(data.bonus); // offene Extra-Fotos
    return { ids: (data.ids ?? []).filter(isCode), requests: Array.isArray(data.requests) ? data.requests.filter(isCode) : null };
  } catch {
    return { ids: [], requests: [] };
  }
}

// Freundschaftsanfrage senden (z. B. aus der weltweiten Liste): 'linked' = der andere hatte mich schon hinzugefügt
export async function requestFriend(me: Me, friend: string): Promise<'requested' | 'linked' | 'error'> {
  try {
    const res = await call({ mode: 'board_request', ...me, friend });
    if (!res.ok) return 'error';
    const data = (await res.json()) as { status?: string };
    return data.status === 'linked' ? 'linked' : 'requested';
  } catch {
    return 'error';
  }
}

// Anfrage annehmen oder ablehnen
export async function answerRequest(me: Me, from: string, accept: boolean): Promise<boolean> {
  try {
    return (await call({ mode: 'board_answer', ...me, from, accept })).ok;
  } catch {
    return false;
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
// Weltweite Saison-Rangliste (auch abgelaufene Saisons – die bleiben für die Belohnung stehen)
export async function fetchSeasonTop(season: string): Promise<Person[] | null> {
  try {
    const res = await call({ mode: 'board_stop', season });
    if (!res.ok) return null;
    const data = (await res.json()) as { people?: Person[] };
    return data.people ?? [];
  } catch {
    return null;
  }
}

// Belohnungen für abgelaufene Saisons: { "summer-2026": { rank: 7, xp: 200 } } (rank 0 = nicht in den Top 100)
export type SeasonAwards = Record<string, { rank: number; xp: number }>;
const AWARDS_KEY = 'findimal-season-awards';
export async function loadSeasonAwards(): Promise<SeasonAwards> {
  try {
    const raw = await AsyncStorage.getItem(AWARDS_KEY);
    return raw ? (JSON.parse(raw) as SeasonAwards) : {};
  } catch {
    return {};
  }
}
// Einmal pro Saison: Platz in der Liste der abgelaufenen Saison nachsehen und die Belohnung merken.
// Liefert die neue Belohnung (oder null, wenn schon geprüft / offline).
export async function checkSeasonAward(
  me: Me,
  season: string,
  reward: (rank: number) => number,
): Promise<{ awards: SeasonAwards; rank: number; xp: number } | null> {
  const awards = await loadSeasonAwards();
  if (awards[season]) return null;
  const list = await fetchSeasonTop(season);
  if (!list) return null; // offline: später nochmal
  const rank = list.findIndex((x) => x.id === me.id) + 1;
  const xp = reward(rank);
  const next = { ...awards, [season]: { rank, xp } };
  await AsyncStorage.setItem(AWARDS_KEY, JSON.stringify(next)).catch(() => {});
  return { awards: next, rank, xp };
}

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
