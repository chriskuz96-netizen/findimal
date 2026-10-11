import * as Location from 'expo-location';

import { clearCountry, saveCountry, saveZone, zoneOf } from './zone';

// Ermittelt den Ortsnamen (z. B. "München") aus dem aktuellen Standort.
// Gespeichert wird nur der Name (und der grobe Naturraum für die Natur-Tipps), nie die Koordinaten.
export async function detectPlace(): Promise<string | null> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return null;
    const pos =
      (await Location.getLastKnownPositionAsync()) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    const [addr] = await Location.reverseGeocodeAsync({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
    if (addr?.isoCountryCode) {
      await saveZone(zoneOf(addr.isoCountryCode, pos.coords.latitude, pos.coords.longitude));
      await saveCountry(addr.isoCountryCode.toUpperCase());
    }
    return addr?.city || addr?.subregion || addr?.region || null;
  } catch {
    return null;
  }
}

// Selbst eingetippte Region (z. B. "Bangkok"): Land und Naturraum über den Ortsdienst des iPhones
// herausfinden (für Saison-Seite und Natur-Tipps). Gespeichert wird nur Land und Zone, keine Koordinaten.
// Klappt das nicht, gilt wieder das Land aus den iPhone-Einstellungen.
export async function placeCountry(name: string): Promise<void> {
  try {
    const [pos] = await Promise.race([
      Location.geocodeAsync(name),
      new Promise<never>((_, no) => setTimeout(() => no(new Error('zu langsam')), 5000)),
    ]);
    if (!pos) throw new Error('nicht gefunden');
    const [addr] = await Location.reverseGeocodeAsync({ latitude: pos.latitude, longitude: pos.longitude });
    if (!addr?.isoCountryCode) throw new Error('kein Land');
    await saveZone(zoneOf(addr.isoCountryCode, pos.latitude, pos.longitude));
    await saveCountry(addr.isoCountryCode.toUpperCase());
  } catch {
    await clearCountry();
  }
}

// Ortsname und Land des aktuellen Standorts für einen neuen Fund – nur wenn der Standort schon erlaubt ist
// (hier wird nie gefragt). Sonst null; dann nimmt die App den Ort aus den Einstellungen.
// Das Land (z. B. "TH") zählt für die Weltenbummler-Abzeichen.
export type Spot = { name: string | null; country: string | null };
export async function currentPlace(): Promise<Spot | null> {
  try {
    if (!(await Location.getForegroundPermissionsAsync()).granted) return null;
    const pos = await Location.getLastKnownPositionAsync();
    if (!pos) return null;
    const [addr] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    if (!addr) return null;
    return {
      name: addr.city || addr.subregion || addr.region || addr.country || null,
      country: addr.isoCountryCode ? addr.isoCountryCode.toUpperCase() : null,
    };
  } catch {
    return null;
  }
}
