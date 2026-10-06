import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

import { Photo } from './camera';
import { SERVER_URL } from './config';

// Steckbrief, wie ihn der Server zurückgibt (Felder siehe server/findimal-worker.js).
export type Animal = {
  tier_gefunden: boolean;
  name: string;
  wissenschaftlicher_name: string;
  gruppe: string;
  sicherheit: 'sicher' | 'wahrscheinlich' | 'unsicher';
  kurzbeschreibung: string;
  klasse: string;
  familie: string;
  groesse: string;
  aktiv: string;
  lebensraum: string;
  verbreitung: string;
  gefaehrdung: string;
  wusstest_du: string;
  rolle_in_der_natur: string;
  nahrung: string;
  fressfeinde: string;
  hinweis: string;
};

export type IdentifyResult = { ok: true; animal: Animal } | { ok: false; message: string };

const KEY_STORAGE = 'findimal-app-key';

async function getAppKey(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(KEY_STORAGE)) ?? '';
  } catch {
    return '';
  }
}

// Fragt einmalig nach dem Findimal-Code (APP_KEY aus Cloudflare) und speichert ihn.
function askForAppKey(): Promise<string | null> {
  return new Promise((resolve) => {
    Alert.prompt(
      'Findimal-Code',
      'Bitte gib den Code ein, den du in Cloudflare als APP_KEY festgelegt hast.',
      [
        { text: 'Abbrechen', style: 'cancel', onPress: () => resolve(null) },
        {
          text: 'Speichern',
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

async function send(photo: Photo, appKey: string): Promise<Response> {
  return fetch(SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Findimal-Key': appKey },
    body: JSON.stringify({ image: photo.base64 }),
  });
}

// Schickt das Foto an den Findimal-Server und liefert den Steckbrief.
export async function identify(photo: Photo): Promise<IdentifyResult> {
  if (!SERVER_URL) {
    return { ok: false, message: 'Der Findimal-Server ist noch nicht eingerichtet.' };
  }
  if (!photo.base64) {
    return { ok: false, message: 'Das Foto konnte nicht vorbereitet werden. Bitte nochmal versuchen.' };
  }
  try {
    let res = await send(photo, await getAppKey());
    if (res.status === 401) {
      const key = await askForAppKey();
      if (!key) return { ok: false, message: 'Ohne Findimal-Code kann ich das Tier nicht bestimmen.' };
      res = await send(photo, key);
      if (res.status === 401) return { ok: false, message: 'Der Findimal-Code stimmt nicht.' };
    }
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data?.fehler ?? 'Etwas ist schiefgelaufen.' };
    return { ok: true, animal: data as Animal };
  } catch {
    return { ok: false, message: 'Keine Verbindung. Bist du online?' };
  }
}
