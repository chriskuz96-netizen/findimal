// Ergänzt app.json für den echten App-Bau (EAS). Snack liest nur app.json und ignoriert diese Datei.
// App-Symbol und Startbild liegen im Zweig "app-assets" und werden vor dem Bauen nach assets/ kopiert.
const fs = require('fs');
const de = require('./locales/de.json');

const has = (file) => {
  try {
    return fs.existsSync(file);
  } catch {
    return false;
  }
};

module.exports = ({ config }) => ({
  ...config,
  // Expo-Konto und -Projekt für den App-Bau (EAS)
  owner: 'christianfindimals-team',
  extra: { ...config.extra, eas: { projectId: 'd01f3c01-05fb-435f-b41f-842cf6583f72' } },
  // Kleine Updates ohne Apple-Prüfung (Expo Updates): die App lädt sie beim Start und nutzt sie
  // ab dem nächsten Start. Ein Update geht an alle Bauten mit derselben App-Version ("version" in app.json).
  // WICHTIG: Kommen neue native Bausteine dazu (z. B. Werbung), vorher die Version erhöhen und neu bauen –
  // sonst bekäme ein alter Bau Code, der den neuen Baustein braucht.
  updates: { url: 'https://u.expo.dev/d01f3c01-05fb-435f-b41f-842cf6583f72' },
  runtimeVersion: { policy: 'appVersion' },
  ...(has('./assets/icon.png') ? { icon: './assets/icon.png' } : {}),
  splash: {
    ...config.splash,
    ...(has('./assets/splash-icon.png') ? { image: './assets/splash-icon.png', resizeMode: 'contain' } : {}),
  },
  // Texte, die iOS beim Fragen nach Kamera, Fotos und Standort zeigt (Deutsch als Grundsprache)
  locales: {
    de: './locales/de.json',
    en: './locales/en.json',
    fr: './locales/fr.json',
    es: './locales/es.json',
  },
  ios: {
    ...config.ios,
    infoPlist: { ...(config.ios && config.ios.infoPlist), CFBundleDevelopmentRegion: 'de', CFBundleAllowMixedLocalizations: true },
  },
  plugins: [
    [
      'expo-image-picker',
      { cameraPermission: de.NSCameraUsageDescription, photosPermission: de.NSPhotoLibraryUsageDescription, microphonePermission: false },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: de.NSLocationWhenInUseUsageDescription,
        locationAlwaysPermission: de.NSLocationWhenInUseUsageDescription,
        locationAlwaysAndWhenInUsePermission: de.NSLocationWhenInUseUsageDescription,
        motionUsagePermission: de.NSMotionUsageDescription,
      },
    ],
  ],
});
