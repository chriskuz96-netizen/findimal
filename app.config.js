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
        motionUsagePermission: false,
      },
    ],
  ],
});
