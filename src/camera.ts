import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

import { Translate } from './i18n';
import { currentPlace } from './location';

const OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 1,
};

const MAX_SIDE = 1024; // größer braucht die Tierbestimmung nicht

// place: Ortsname des aktuellen Standorts (nur wenn erlaubt; wird nebenbei ermittelt, nur der Name wird gespeichert)
export type Photo = { uri: string; base64: string | null; place?: Promise<string | null> };

// Macht aus dem gewählten Bild ein Photo für die Bestimmung.
// onPicked(true): Bild ist gewählt, wird jetzt vorbereitet (für einen Ladekreis)
async function toPhoto(result: ImagePicker.ImagePickerResult, onPicked?: (busy: boolean) => void): Promise<Photo | null> {
  if (result.canceled || !result.assets?.length) return null;
  onPicked?.(true);
  const a = result.assets[0];
  // Ort: der aktuelle Standort, falls erlaubt (die Ortsdaten im Bild werden nicht gelesen)
  const place = currentPlace();
  const photo = await shrink(a);
  return { ...photo, place };
}

// Verkleinert das Foto und wandelt es in Text (base64) um, damit es
// schnell und günstig an die Tierbestimmung geschickt werden kann.
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
export async function takePhoto(t: Translate, onPicked?: (busy: boolean) => void): Promise<Photo | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    askForSettings(t);
    return null;
  }
  try {
    return await toPhoto(await ImagePicker.launchCameraAsync(OPTIONS), onPicked);
  } catch {
    // Keine Kamera vorhanden (z. B. in der Web-Vorschau): Mediathek nehmen.
    return pickPhoto(onPicked);
  }
}

// Öffnet die Foto-Mediathek.
export async function pickPhoto(onPicked?: (busy: boolean) => void): Promise<Photo | null> {
  return toPhoto(await ImagePicker.launchImageLibraryAsync(OPTIONS), onPicked);
}
