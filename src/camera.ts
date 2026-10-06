import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

const OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.7,
  base64: true, // brauchen wir später für die Tierbestimmung
};

export type Photo = { uri: string; base64: string | null };

function toPhoto(result: ImagePicker.ImagePickerResult): Photo | null {
  if (result.canceled || !result.assets?.length) return null;
  const a = result.assets[0];
  return { uri: a.uri, base64: a.base64 ?? null };
}

function askForSettings(what: string) {
  Alert.alert(
    `Kein Zugriff auf ${what}`,
    `Findimal braucht Zugriff auf ${what}, um Tiere zu bestimmen. Du kannst das in den Einstellungen erlauben.`,
    [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Einstellungen öffnen', onPress: () => Linking.openSettings() },
    ],
  );
}

// Öffnet die Kamera und liefert das Foto (oder null, wenn abgebrochen).
export async function takePhoto(): Promise<Photo | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    askForSettings('die Kamera');
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
