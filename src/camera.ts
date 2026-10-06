import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

import { Translate } from './i18n';

const OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 1,
};

const MAX_SIDE = 1024; // größer braucht die Tierbestimmung nicht

export type Photo = { uri: string; base64: string | null };

// Verkleinert das Foto und wandelt es in Text (base64) um, damit es
// schnell und günstig an die Tierbestimmung geschickt werden kann.
async function toPhoto(result: ImagePicker.ImagePickerResult): Promise<Photo | null> {
  if (result.canceled || !result.assets?.length) return null;
  const a = result.assets[0];
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
    return toPhoto(await ImagePicker.launchCameraAsync(OPTIONS));
  } catch {
    // Keine Kamera vorhanden (z. B. in der Web-Vorschau): Mediathek nehmen.
    return pickPhoto();
  }
}

// Öffnet die Foto-Mediathek.
export async function pickPhoto(): Promise<Photo | null> {
  return toPhoto(await ImagePicker.launchImageLibraryAsync(OPTIONS));
}
