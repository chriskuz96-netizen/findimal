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
