import * as Location from 'expo-location';

import { saveZone, zoneOf } from './zone';

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
    if (addr?.isoCountryCode) await saveZone(zoneOf(addr.isoCountryCode, pos.coords.latitude, pos.coords.longitude));
    return addr?.city || addr?.subregion || addr?.region || null;
  } catch {
    return null;
  }
}

// Ortsname für ein Foto: aus den GPS-Daten des Bildes, sonst (nur bei der Kamera und nur,
// wenn der Standort schon erlaubt ist – hier wird nie gefragt) aus dem aktuellen Standort.
export async function placeOf(gps: { lat: number; lon: number } | null, fromCamera: boolean): Promise<string | null> {
  try {
    let coords = gps;
    if (!coords && fromCamera && (await Location.getForegroundPermissionsAsync()).granted) {
      const pos = await Location.getLastKnownPositionAsync();
      if (pos) coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
    }
    if (!coords) return null;
    const [addr] = await Location.reverseGeocodeAsync({ latitude: coords.lat, longitude: coords.lon });
    return addr?.city || addr?.subregion || addr?.region || addr?.country || null;
  } catch {
    return null;
  }
}
