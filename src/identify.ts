import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

import { Photo } from './camera';
import { SERVER_URL } from './config';
import { Lang, Translate } from './i18n';

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

async function send(photo: Photo, appKey: string, lang: Lang): Promise<Response> {
  return fetch(SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Findimal-Key': appKey },
    body: JSON.stringify({ image: photo.base64, lang }),
  });
}

// Schickt das Foto an den Findimal-Server und liefert den Steckbrief.
export async function identify(photo: Photo, t: Translate, lang: Lang): Promise<IdentifyResult> {
  if (!SERVER_URL) return { ok: false, message: t('id.noServer') };
  if (!photo.base64) return { ok: false, message: t('id.noPhoto') };
  try {
    let res = await send(photo, await getAppKey(), lang);
    if (res.status === 401) {
      const key = await askForAppKey(t);
      if (!key) return { ok: false, message: t('id.noCode') };
      res = await send(photo, key, lang);
      if (res.status === 401) return { ok: false, message: t('id.wrongCode') };
    }
    if (res.status === 400) return { ok: false, message: t('id.badPhoto') };
    if (res.status === 422) return { ok: false, message: t('id.refused') };
    if (res.status >= 500) return { ok: false, message: t('id.unavailable') };
    if (!res.ok) return { ok: false, message: t('id.error') };
    return { ok: true, animal: (await res.json()) as Animal };
  } catch {
    return { ok: false, message: t('id.offline') };
  }
}
