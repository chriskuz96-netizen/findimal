# Findimal – Bilder für den App-Bau

Nur die Bilder für den App-Store-Bau (App-Symbol, Startbild). Sie liegen getrennt vom
Hauptzweig `main`, weil Snack beim Import von Bilddateien Probleme macht.
Beim Bauen der App werden sie nach `assets/` in den Hauptzweig kopiert.

- `assets/icon.png` – App-Symbol 1024 × 1024, ohne Transparenz (iOS rundet die Ecken selbst)
- `assets/splash-icon.png` – Logo für den Startbildschirm
- `assets/icon.svg` – Vorlage (aus `src/components/AppLogo.tsx`)

## Bildschirmfotos für den App Store (`store-screenshots/`)
1320 × 2868 Pixel (6,9-Zoll-iPhone), je 9 Bilder auf Deutsch (`de-…`) und Englisch (`en-…`).
Erstellt aus der Web-Vorschau mit Beispieldaten und eigenen Tierfotos (Huhn, Nebelkrähe, Höckerschwan, Koala, Kühe, Hund).

## Knopf fürs Kontrollzentrum (`targets/kamera-knopf/`)
Vorbereitet, noch nicht eingeschaltet. Zum Einschalten beim Bau:
1. `targets/` in den Hauptzweig kopieren (wie die Bilder).
2. `npm install @bacons/apple-targets` und in `app.config.js` das Plugin `'@bacons/apple-targets'` ergänzen.
3. Neu bauen (eigener Bau über Apple, kein Expo-Update). Der Swift-Code ist noch nicht kompiliert worden.
Der Knopf öffnet `findimal://kamera`; die App wertet das aus und startet die Kamera.
