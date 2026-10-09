import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { Photo } from './camera';
import { Animal } from './identify';

// Ein gespeicherter Fund in der Sammlung.
export type Find = {
  id: string;
  date: string; // ISO-Datum
  place?: string; // Ortsname, wo das Foto gemacht wurde (z. B. "München")
  lang?: string; // Sprache der Texte (nach einem Sprachwechsel wird übersetzt)
  animal: Animal;
};

const FINDS_KEY = 'findimal-finds';

// Aktueller Stand und Warteschlange: Änderungen laufen nacheinander und immer auf dem neuesten Stand
// (sonst könnte z. B. eine Übersetzung im Hintergrund einen gerade gespeicherten Fund überschreiben).
let latest: Find[] = [];
let queue: Promise<unknown> = Promise.resolve();

function change(fn: (finds: Find[]) => Find[]): Promise<Find[]> {
  const run = queue.then(async () => {
    const next = fn(latest);
    latest = next;
    await storeFinds(next);
    return next;
  });
  queue = run.catch(() => {});
  return run;
}

export async function loadFinds(): Promise<Find[]> {
  try {
    const raw = await AsyncStorage.getItem(FINDS_KEY);
    latest = raw ? (JSON.parse(raw) as Find[]) : [];
  } catch {
    latest = [];
  }
  return latest;
}

// Nach „Alles zurücksetzen“
export function forgetFinds(): void {
  latest = [];
  photoCache.clear();
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
    // anderer Fund: sofort dessen Foto (oder erst mal keins) zeigen
    setUri(photoCache.get(id) ?? null);
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
  photo: Photo,
  animal: Animal,
  homePlace?: string, // Ort aus den Einstellungen: wenn der Standort nicht erlaubt ist
  lang?: string, // Sprache der Texte
): Promise<{ finds: Find[]; isNew: boolean; id: string }> {
  const id = `${Date.now()}`;
  await storePhoto(id, photo);
  // Ort abwarten, aber höchstens 3 Sekunden (meist ist er längst fertig)
  const place = photo.place
    ? await Promise.race([photo.place, new Promise<null>((r) => setTimeout(() => r(null), 3000))])
    : null;
  const where = place || homePlace || null;
  const find: Find = { id, date: new Date().toISOString(), ...(where ? { place: where } : {}), ...(lang ? { lang } : {}), animal };
  let isNew = false;
  const finds = await change((list) => {
    isNew = !list.some((f) => speciesKey(f.animal) === speciesKey(animal));
    return [...list, find];
  });
  return { finds, isNew, id };
}

// Fundort nachträglich ändern ('' = entfernen)
export function updatePlace(id: string, place: string): Promise<Find[]> {
  return change((list) =>
    list.map((f) => {
      if (f.id !== id) return f;
      const { place: _old, ...rest } = f;
      return place ? { ...rest, place } : rest;
    }),
  );
}

// Ersetzt die Bestimmung eines Fundes (z. B. nach einem zweiten Foto).
export function updateFind(id: string, animal: Animal): Promise<Find[]> {
  return change((list) => list.map((f) => (f.id === id ? { ...f, animal } : f)));
}

// Übersetzte Texte eines Fundes speichern (Sprachwechsel)
export function translateFindTexts(id: string, texts: Partial<Animal>, lang: string): Promise<Find[]> {
  return change((list) => list.map((f) => (f.id === id ? { ...f, lang, animal: { ...f.animal, ...texts } } : f)));
}

export async function removeFind(id: string): Promise<Find[]> {
  photoCache.delete(id);
  try {
    await AsyncStorage.removeItem(photoKey(id));
  } catch {
    // ignorieren
  }
  return change((list) => list.filter((f) => f.id !== id));
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
