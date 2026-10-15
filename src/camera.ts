import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

import { Translate } from './i18n';
import { currentPlace, Spot } from './location';

const OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 1,
  // Kameradaten (Hersteller, Aufnahmezeit): fehlen sie bei einem Bild aus der Mediathek, stammt es meist aus dem Netz
  exif: true,
  // ganzer Bildschirm (auch die Fotoauswahl), damit dahinter nichts durchscheint
  presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
};

const MAX_SIDE = 1024; // größer braucht die Tierbestimmung nicht

// place: Ortsname des aktuellen Standorts (nur wenn erlaubt; wird nebenbei ermittelt, nur der Name wird gespeichert)
// foreign: aus der Mediathek, aber ohne Kameradaten (Bild aus dem Netz, Screenshot, weitergeleitet) – wird
// bestimmt, kommt aber nicht in die Sammlung
export type Photo = { uri: string; base64: string | null; place?: Promise<Spot | null>; foreign?: boolean };

// Hat das Bild Daten einer Kamera? (iOS legt sie teils direkt, teils in Gruppen wie "{TIFF}" / "{Exif}" ab)
function hasCameraData(exif: Record<string, any> | null | undefined): boolean {
  if (!exif) return false;
  const groups = [exif, exif['{TIFF}'], exif['{Exif}']].filter(Boolean);
  return groups.some((g) => !!(g.Make || g.Model || g.LensModel || g.DateTimeOriginal));
}

// Macht aus dem gewählten Bild ein Photo für die Bestimmung.
// onPicked(uri): Bild ist gewählt, wird jetzt vorbereitet (für den Ladebildschirm)
export type OnPicked = (uri: string) => void;
// onOpen: Kamera bzw. Fotoauswahl geht jetzt auf (Berechtigung ist da)
export type OnOpen = () => void;
async function toPhoto(result: ImagePicker.ImagePickerResult, onPicked?: OnPicked, fromLibrary = false): Promise<Photo | null> {
  if (result.canceled || !result.assets?.length) return null;
  const a = result.assets[0];
  const foreign = fromLibrary && !hasCameraData(a.exif);
  onPicked?.(a.uri);
  // Ort: der aktuelle Standort, falls erlaubt (die Ortsdaten im Bild werden nicht gelesen)
  const place = currentPlace();
  const photo = await shrink(a);
  return { ...photo, place, foreign };
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
export async function takePhoto(t: Translate, onPicked?: OnPicked, onOpen?: OnOpen): Promise<Photo | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    askForSettings(t);
    return null;
  }
  try {
    onOpen?.();
    return await toPhoto(await ImagePicker.launchCameraAsync(OPTIONS), onPicked);
  } catch {
    // Keine Kamera vorhanden (z. B. in der Web-Vorschau): Mediathek nehmen.
    return pickPhoto(onPicked);
  }
}

// Öffnet die Foto-Mediathek.
export async function pickPhoto(onPicked?: OnPicked, onOpen?: OnOpen): Promise<Photo | null> {
  onOpen?.();
  return toPhoto(await ImagePicker.launchImageLibraryAsync(OPTIONS), onPicked, true);
}
