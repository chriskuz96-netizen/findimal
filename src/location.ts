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
