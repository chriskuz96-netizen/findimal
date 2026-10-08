import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

import { Translate } from './i18n';
import { placeOf } from './location';

const OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 1,
  exif: true, // für den Aufnahmeort (GPS) bei Bildern aus der Mediathek
};

const MAX_SIDE = 1024; // größer braucht die Tierbestimmung nicht

// place: Ortsname, wo das Foto gemacht wurde (wird nebenbei ermittelt, nur der Name wird gespeichert)
export type Photo = { uri: string; base64: string | null; place?: Promise<string | null>; fromCamera?: boolean };

// GPS aus den Bilddaten (iOS: "{GPS}"-Bereich, Android: GPSLatitude usw.)
function gpsOf(exif: Record<string, any> | null | undefined): { lat: number; lon: number } | null {
  if (!exif) return null;
  const g = exif['{GPS}'] ?? exif;
  const lat = Number(g.Latitude ?? g.GPSLatitude);
  const lon = Number(g.Longitude ?? g.GPSLongitude);
  if (!isFinite(lat) || !isFinite(lon) || (lat === 0 && lon === 0)) return null;
  const s = String(g.LatitudeRef ?? g.GPSLatitudeRef ?? 'N').toUpperCase() === 'S' ? -1 : 1;
  const w = String(g.LongitudeRef ?? g.GPSLongitudeRef ?? 'E').toUpperCase() === 'W' ? -1 : 1;
  return { lat: Math.abs(lat) * s, lon: Math.abs(lon) * w };
}

// Verkleinert das Foto und wandelt es in Text (base64) um, damit es
// schnell und günstig an die Tierbestimmung geschickt werden kann.
async function toPhoto(result: ImagePicker.ImagePickerResult, fromCamera: boolean): Promise<Photo | null> {
  if (result.canceled || !result.assets?.length) return null;
  const a = result.assets[0];
  // Ort: aus dem Foto selbst, bei der Kamera sonst der aktuelle Standort
  const place = placeOf(gpsOf(a.exif), fromCamera);
  const photo = await shrink(a);
  return { ...photo, place, fromCamera };
}

async function shrink(a: ImagePicker.ImagePickerAsset): Promise<Photo> {
  try {
    let ctx = ImageManipulator.manipulate(a.uri);
    if (Math.max(a.width, a.height) > MAX_SIDE) {
      ctx = ctx.resize(a.width >= a.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
    }
    const image = await ctx.renderAsync();
    const saved = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
    return { uri: saved.uri, base64: saved.base64 ?? null };
  } catch {
    return { uri: a.uri, base64: null };
  }
}

function askForSettings(t: Translate) {
  Alert.alert(t('cam.noAccessTitle'), t('cam.noAccessText'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('cam.openSettings'), onPress: () => Linking.openSettings() },
  ]);
}

// Öffnet die Kamera und liefert das Foto (oder null, wenn abgebrochen).
export async function takePhoto(t: Translate): Promise<Photo | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    askForSettings(t);
    return null;
  }
  try {
    return toPhoto(await ImagePicker.launchCameraAsync(OPTIONS), true);
  } catch {
    // Keine Kamera vorhanden (z. B. in der Web-Vorschau): Mediathek nehmen.
    return pickPhoto();
  }
}

// Öffnet die Foto-Mediathek.
export async function pickPhoto(): Promise<Photo | null> {
  return toPhoto(await ImagePicker.launchImageLibraryAsync(OPTIONS), false);
}
