import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { Photo } from './camera';
import { Animal } from './identify';

// Ein gespeicherter Fund in der Sammlung.
export type Find = {
  id: string;
  date: string; // ISO-Datum
  place?: string; // Ortsname, wo das Foto gemacht wurde (z. B. "München")
  animal: Animal;
};

const FINDS_KEY = 'findimal-finds';

export async function loadFinds(): Promise<Find[]> {
  try {
    const raw = await AsyncStorage.getItem(FINDS_KEY);
    return raw ? (JSON.parse(raw) as Find[]) : [];
  } catch {
    return [];
  }
}

async function storeFinds(finds: Find[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FINDS_KEY, JSON.stringify(finds));
  } catch {
    // Speichern fehlgeschlagen: Fund gilt dann nur bis zum nächsten Start.
  }
}

// Gleiche Art = gleicher wissenschaftlicher Name (sonst gleicher deutscher Name).
export function speciesKey(a: Animal): string {
  return (a.wissenschaftlicher_name || a.name).trim().toLowerCase();
}

// Fotos werden einzeln gespeichert (als Text), damit die Fundliste klein bleibt.
const photoKey = (id: string) => `findimal-photo-${id}`;
const photoCache = new Map<string, string>();

async function storePhoto(id: string, photo: Photo): Promise<void> {
  const uri = photo.base64 ? `data:image/jpeg;base64,${photo.base64}` : photo.uri;
  photoCache.set(id, uri);
  try {
    await AsyncStorage.setItem(photoKey(id), uri);
  } catch {
    // ignorieren: Foto ist dann nur bis zum nächsten Start da
  }
}

// Lädt das Foto eines Fundes (für <Image source={{ uri }} />).
export function useFindPhoto(id: string): string | null {
  const [uri, setUri] = useState<string | null>(photoCache.get(id) ?? null);
  useEffect(() => {
    if (photoCache.has(id)) return;
    AsyncStorage.getItem(photoKey(id))
      .then((v) => {
        if (v) {
          photoCache.set(id, v);
          setUri(v);
        }
      })
      .catch(() => {});
  }, [id]);
  return uri;
}

// Speichert einen neuen Fund. Liefert die neue Liste und ob die Art neu ist.
export async function addFind(
  finds: Find[],
  photo: Photo,
  animal: Animal,
  homePlace?: string, // Ort aus den Einstellungen: wenn der Standort nicht erlaubt ist
): Promise<{ finds: Find[]; isNew: boolean; id: string }> {
  const isNew = !finds.some((f) => speciesKey(f.animal) === speciesKey(animal));
  const id = `${Date.now()}`;
  await storePhoto(id, photo);
  // Ort abwarten, aber höchstens 3 Sekunden (meist ist er längst fertig)
  const place = photo.place
    ? await Promise.race([photo.place, new Promise<null>((r) => setTimeout(() => r(null), 3000))])
    : null;
  const where = place || homePlace || null;
  const find: Find = { id, date: new Date().toISOString(), ...(where ? { place: where } : {}), animal };
  const next = [...finds, find];
  await storeFinds(next);
  return { finds: next, isNew, id };
}

// Fundort nachträglich ändern ('' = entfernen)
export async function updatePlace(finds: Find[], id: string, place: string): Promise<Find[]> {
  const next = finds.map((f) => {
    if (f.id !== id) return f;
    const { place: _old, ...rest } = f;
    return place ? { ...rest, place } : rest;
  });
  await storeFinds(next);
  return next;
}

// Ersetzt die Bestimmung eines Fundes (z. B. nach einem zweiten Foto).
export async function updateFind(finds: Find[], id: string, animal: Animal): Promise<Find[]> {
  const next = finds.map((f) => (f.id === id ? { ...f, animal } : f));
  await storeFinds(next);
  return next;
}

export async function removeFind(finds: Find[], id: string): Promise<Find[]> {
  photoCache.delete(id);
  try {
    await AsyncStorage.removeItem(photoKey(id));
  } catch {
    // ignorieren
  }
  const next = finds.filter((f) => f.id !== id);
  await storeFinds(next);
  return next;
}

// Nummer der Art in der Sammlung (#001 = erste entdeckte Art).
export function speciesNumber(finds: Find[], animal: Animal): number {
  const order: string[] = [];
  for (const f of finds) {
    const k = speciesKey(f.animal);
    if (!order.includes(k)) order.push(k);
  }
  return order.indexOf(speciesKey(animal)) + 1;
}
