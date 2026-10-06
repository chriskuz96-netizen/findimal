import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

import { Animal } from './identify';

// Ein gespeicherter Fund in der Sammlung.
export type Find = {
  id: string;
  date: string; // ISO-Datum
  photoUri: string;
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

// Fotos liegen sonst nur im Zwischenspeicher; hier kopieren wir sie dauerhaft weg.
function keepPhoto(uri: string, id: string): string {
  try {
    const dir = new Directory(Paths.document, 'funde');
    if (!dir.exists) dir.create();
    const dest = new File(dir, `${id}.jpg`);
    new File(uri).copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

// Speichert einen neuen Fund. Liefert die neue Liste und ob die Art neu ist.
export async function addFind(
  finds: Find[],
  photoUri: string,
  animal: Animal,
): Promise<{ finds: Find[]; isNew: boolean }> {
  const isNew = !finds.some((f) => speciesKey(f.animal) === speciesKey(animal));
  const id = `${Date.now()}`;
  const find: Find = { id, date: new Date().toISOString(), photoUri: keepPhoto(photoUri, id), animal };
  const next = [...finds, find];
  await storeFinds(next);
  return { finds: next, isNew };
}

export async function removeFind(finds: Find[], id: string): Promise<Find[]> {
  const find = finds.find((f) => f.id === id);
  if (find) {
    try {
      new File(find.photoUri).delete();
    } catch {
      // Foto schon weg: egal
    }
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
