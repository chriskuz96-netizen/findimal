import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { loadFindPhoto } from './finds';

// Eigenes Foto als Profilbild (Plus): Profilbild-ID 'f-<Fund>~<Zeitstempel>'. Der selbst gewählte
// Bildausschnitt wird als fertiges quadratisches Bild gespeichert (ein Bild, immer das aktuelle).
// Ohne Ausschnitt (ältere Auswahl 'f-<Fund>') gilt das ganze Foto, mittig zugeschnitten.

const KEY = 'findimal-avatar-img';
let cache: { id: string; uri: string } | null | undefined;
const listeners = new Set<() => void>();

async function load(): Promise<{ id: string; uri: string } | null> {
  if (cache === undefined) {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      cache = raw ? (JSON.parse(raw) as { id: string; uri: string }) : null;
    } catch {
      cache = null;
    }
  }
  return cache;
}

export const findOfAvatar = (avatar: string) => avatar.slice(2).split('~')[0];

export async function saveAvatarImage(id: string, uri: string): Promise<void> {
  cache = { id, uri };
  listeners.forEach((l) => l());
  await AsyncStorage.setItem(KEY, JSON.stringify(cache)).catch(() => {});
}

// Bild für ein Foto-Profilbild: der gespeicherte Ausschnitt oder (ohne Ausschnitt) das Fund-Foto
export async function photoForAvatar(avatar: string): Promise<string | null> {
  const c = await load();
  if (c && c.id === avatar) return c.uri;
  return loadFindPhoto(findOfAvatar(avatar));
}

// Ausschnitt zu dieser Profilbild-ID (oder null)
export function useAvatarImage(avatar: string): string | null {
  const pick = () => (cache && cache.id === avatar ? cache.uri : null);
  const [uri, setUri] = useState<string | null>(pick);
  useEffect(() => {
    const update = () => setUri(pick());
    listeners.add(update);
    load().then(update);
    return () => {
      listeners.delete(update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatar]);
  return uri;
}
