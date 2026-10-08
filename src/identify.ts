import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

import { Photo } from './camera';
import { SERVER_URL } from './config';
import { hasPlus } from './plus';
import { FREE_PHOTOS_PER_DAY, getDeviceId, setUsedToday, usedToday } from './usage';
import { Lang, Translate } from './i18n';

// Steckbrief, wie ihn der Server zurückgibt (Felder siehe server/findimal-worker.js).
export type Animal = {
  tier_gefunden: boolean;
  name: string;
  rasse?: string; // nur bei Haus- und Nutztieren, z. B. "Golden Retriever"
  rasse_sicher?: boolean; // false = Rasse nur geschätzt
  gefaehrdet?: boolean;
  giftig?: boolean; // giftig oder sticht/beißt mit Gift
  gross?: boolean; // ausgewachsen über 1 Meter
  schmetterling?: boolean; // Schmetterling oder Falter (auch Raupe)
  wasser?: boolean; // lebt im oder am Wasser
  winzig?: boolean; // ausgewachsen kleiner als 1 cm // auf der Roten Liste (mind. gefährdet) – für das Abzeichen "Seltener Fund"
  wissenschaftlicher_name: string;
  gruppe: string;
  sicherheit: 'sicher' | 'wahrscheinlich' | 'unsicher';
  kurzbeschreibung: string;
  klasse?: string;
  familie?: string;
  groesse?: string;
  aktiv?: string;
  lebensraum?: string;
  verbreitung?: string;
  gefaehrdung?: string;
  wusstest_du: string;
  rolle_in_der_natur?: string;
  nahrung?: string;
  fressfeinde?: string;
  hinweis: string;
};

// Ausführlicher Steckbrief: wird erst geladen, wenn jemand "Steckbrief anzeigen" tippt (spart KI-Kosten).
export type Details = Pick<
  Animal,
  'klasse' | 'familie' | 'groesse' | 'aktiv' | 'lebensraum' | 'verbreitung' | 'gefaehrdung' | 'rolle_in_der_natur' | 'nahrung' | 'fressfeinde'
>;

export const hasDetails = (a: Animal) => !!(a.klasse || a.lebensraum || a.nahrung);

export async function loadDetails(a: Animal, lang: Lang): Promise<Details | null> {
  if (!SERVER_URL) return null;
  try {
    const res = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Findimal-Key': await getAppKey(),
        'X-Findimal-Device': await getDeviceId(),
      },
      body: JSON.stringify({ mode: 'details', name: a.name, wissenschaftlicher_name: a.wissenschaftlicher_name, lang }),
    });
    return res.ok ? ((await res.json()) as Details) : null;
  } catch {
    return null;
  }
}

export type IdentifyResult =
  | { ok: true; animal: Animal }
  | { ok: false; message: string; limit?: boolean; cancelled?: boolean }; // limit: Gratis-Fotos für heute aufgebraucht

const KEY_STORAGE = 'findimal-app-key';

export async function getAppKey(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(KEY_STORAGE)) ?? '';
  } catch {
    return '';
  }
}

// Fragt einmalig nach dem Findimal-Code (APP_KEY aus Cloudflare) und speichert ihn.
function askForAppKey(t: Translate): Promise<string | null> {
  return new Promise((resolve) => {
    Alert.prompt(
      t('id.codeTitle'),
      t('id.codeText'),
      [
        { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(null) },
        {
          text: t('common.save'),
          onPress: async (value?: string) => {
            const key = (value ?? '').trim();
            try {
              await AsyncStorage.setItem(KEY_STORAGE, key);
            } catch {
              // ignorieren
            }
            resolve(key || null);
          },
        },
      ],
      'secure-text',
    );
  });
}

// extra = weiteres Foto zu einem Tier, das gerade bestimmt wird (zählt nicht als neues Gratis-Foto)
async function send(photos: Photo[], appKey: string, lang: Lang, rid?: string, signal?: AbortSignal): Promise<Response> {
  return fetch(SERVER_URL, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Findimal-Key': appKey,
      'X-Findimal-Device': await getDeviceId(),
      ...((await hasPlus()) ? { 'X-Findimal-Plus': '1' } : {}),
    },
    body: JSON.stringify({ images: photos.map((p) => p.base64), lang, extra: photos.length > 1, rid }),
  });
}

// Schickt ein oder mehrere Fotos desselben Tieres an den Findimal-Server und liefert den Steckbrief.
// cancel: zum Abbrechen (dann zählt das Foto nicht als Gratis-Foto)
export type IdentifyCancel = { rid: string; controller: AbortController };

export function newCancel(): IdentifyCancel {
  const rid = Array.from({ length: 20 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
  return { rid, controller: new AbortController() };
}

// Bricht eine laufende Bestimmung ab und sagt dem Server Bescheid, dass sie nicht zählen soll
export async function cancelIdentify(c: IdentifyCancel): Promise<void> {
  c.controller.abort();
  if (!SERVER_URL) return;
  try {
    await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Findimal-Key': await getAppKey(),
        'X-Findimal-Device': await getDeviceId(),
      },
      body: JSON.stringify({ mode: 'cancel', rid: c.rid }),
    });
  } catch {
    // offline: dann ist die Bestimmung ohnehin nicht angekommen
  }
}

// Höchstens so lange wartet die App auf eine Bestimmung (Server: 10 s schnelle KI, dann 25 s genaue KI)
const IDENTIFY_TIMEOUT = 40_000;

export async function identify(photos: Photo[], t: Translate, lang: Lang, cancel?: IdentifyCancel): Promise<IdentifyResult> {
  if (!SERVER_URL) return { ok: false, message: t('id.noServer') };
  if (photos.some((p) => !p.base64)) return { ok: false, message: t('id.noPhoto') };
  const c = cancel ?? newCancel();
  const signal = c.controller.signal;
  // Zeitgrenze: danach abbrechen wie beim Abbrechen-Knopf (zählt nicht als Gratis-Foto)
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const arm = () => {
    timer = setTimeout(() => {
      timedOut = true;
      cancelIdentify(c);
    }, IDENTIFY_TIMEOUT);
  };
  const disarm = () => timer && clearTimeout(timer);
  const stopped = (): IdentifyResult =>
    timedOut ? { ok: false, message: t('id.slow') } : { ok: false, message: '', cancelled: true };
  try {
    arm();
    let res = await send(photos, await getAppKey(), lang, c.rid, signal);
    if (res.status === 401) {
      disarm(); // während der Code-Eingabe läuft keine Zeit
      const key = await askForAppKey(t);
      if (!key) return { ok: false, message: t('id.noCode') };
      arm();
      res = await send(photos, key, lang, c.rid, signal);
      if (res.status === 401) return { ok: false, message: t('id.wrongCode') };
    }
    if (res.status === 429) {
      await setUsedToday(FREE_PHOTOS_PER_DAY);
      return { ok: false, message: t('lim.text', { n: FREE_PHOTOS_PER_DAY }), limit: true };
    }
    if (res.status === 409 || signal.aborted) return stopped();
    if (res.status === 400) return { ok: false, message: t('id.badPhoto') };
    if (res.status === 422) return { ok: false, message: t('id.refused') };
    if (res.status === 504) return { ok: false, message: t('id.slow') };
    if (res.status >= 500) return { ok: false, message: t('id.unavailable') };
    if (!res.ok) return { ok: false, message: t('id.error') };
    // Gratis-Fotos mitzählen (der Server meldet, wie viele heute schon genutzt sind)
    const used = Number(res.headers.get('X-Findimal-Used'));
    const animal = (await res.json()) as Animal;
    if (signal.aborted) return stopped();
    if (photos.length === 1) await setUsedToday(Number.isFinite(used) && used > 0 ? used : (await usedToday()) + 1);
    return { ok: true, animal };
  } catch {
    if (signal.aborted) return stopped();
    return { ok: false, message: t('id.offline') };
  } finally {
    disarm();
  }
}
