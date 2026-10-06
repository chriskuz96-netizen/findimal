import * as Location from 'expo-location';

// Ermittelt den Ortsnamen (z. B. "München") aus dem aktuellen Standort.
// Gespeichert wird nur der Name, nie die genauen Koordinaten.
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
    return addr?.city || addr?.subregion || addr?.region || null;
  } catch {
    return null;
  }
}

export type Coords = { lat: number; lng: number };

// Aktueller Standort für einen Fund (gerundet auf ca. 100 m). Null, wenn nicht erlaubt.
export async function currentCoords(): Promise<Coords | null> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return null;
    const pos =
      (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    return roundCoords(pos.coords.latitude, pos.coords.longitude);
  } catch {
    return null;
  }
}

export function roundCoords(lat: number, lng: number): Coords {
  return { lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000 };
}

// Ort aus den Foto-Daten (EXIF), falls das Foto einen enthält.
export function coordsFromExif(exif: Record<string, unknown> | null | undefined): Coords | null {
  if (!exif) return null;
  const gps = (exif.GPS ?? exif['{GPS}'] ?? exif) as Record<string, unknown>;
  const lat = Number(gps.Latitude ?? gps.GPSLatitude);
  const lng = Number(gps.Longitude ?? gps.GPSLongitude);
  if (!isFinite(lat) || !isFinite(lng) || (lat === 0 && lng === 0)) return null;
  const latRef = String(gps.LatitudeRef ?? gps.GPSLatitudeRef ?? 'N');
  const lngRef = String(gps.LongitudeRef ?? gps.GPSLongitudeRef ?? 'E');
  return roundCoords(latRef === 'S' ? -Math.abs(lat) : lat, lngRef === 'W' ? -Math.abs(lng) : lng);
}
