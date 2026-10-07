# Findimal – Stand und nächste Schritte

Notiz für die nächste Arbeitssitzung (Stand: 7. Oktober 2026).

## Konten
- Apple-Entwickler-Account: angemeldet und bezahlt (eigene Apple-ID nur für Findimal, Einzelperson).
  Freischaltung durch Apple steht evtl. noch aus.
- Expo: Konto `christianfindimal`, Projekt `findimal`, Projekt-ID `d01f3c01-05fb-435f-b41f-842cf6583f72`
  (in `app.config.js` eingetragen). Zugangsschlüssel als Umgebungsvariable `EXPO_TOKEN`.
- Cloudflare-Worker: `https://findimal.chriskuz96.workers.dev/` (Code: `server/findimal-worker.js`,
  wird von Hand im Cloudflare-Editor eingefügt). KV-Speicher als `DB` verbunden.
- Anthropic: Guthaben vorab, Monatslimit klein halten (TestFlight: ca. 20 $).

## App-Bau (EAS)
- `app.json` ist Snack-tauglich; `app.config.js` ergänzt Symbol, Startbild, Berechtigungstexte (`locales/`),
  Plugins, Expo-Konto und Projekt-ID. Snack ignoriert `app.config.js`.
- App-Symbol und Startbild liegen im Zweig `app-assets` (Snack verträgt keine PNGs im Hauptzweig).
  Vor dem Bauen: `git show origin/app-assets:assets/icon.png > assets/icon.png` und ebenso `splash-icon.png`.
- Bundle-ID `com.chriskuz.findimal`, nur iPhone (`supportsTablet: false`), `eas.json` mit Profil `production`.

## Nächste Schritte
1. Sobald Apple freigeschaltet hat: App-Store-Connect-API-Schlüssel erstellen lassen (Rolle Admin)
   und als Umgebungsvariablen hinterlegen: `EXPO_ASC_KEY_ID`, `EXPO_ASC_ISSUER_ID`, `EXPO_APPLE_TEAM_ID`
   und den Inhalt der .p8-Datei (z. B. `EXPO_ASC_API_KEY_P8`). Nie in den Chat schreiben lassen.
2. App in App Store Connect anlegen (Name Findimal, Bundle-ID oben).
3. Ersten Bau mit EAS (`eas build -p ios --profile production`) und Upload zu TestFlight (`eas submit`).
4. Server für Tester öffnen: in Cloudflare die Variable `OFFEN` = `ja` setzen (Grenzen: 3 Fotos pro Handy,
   80 pro Anschluss, 300 pro Tag gesamt; `TAGES_GRENZE` änderbar).
5. Kleine Updates ohne Apple-Prüfung sind eingerichtet (expo-updates, Kanal `production`):
   `eas update --channel production --message "…"`. Nur für reine JS-/Text-Änderungen; neue native
   Bausteine brauchen einen neuen Bau.
6. Später: AdMob mit Testanzeigen, Plus-Abo (In-App-Kauf).
   (Die Fundkarte wurde entfernt – keine Kartendienst-Kosten.)

## Kontrollzentrum-Knopf (nach dem ersten TestFlight-Bau)
- App versteht schon `findimal://kamera` (öffnet die Kamera); `scheme: findimal` steht in `app.json`.
- Swift-Code und Einstellungen liegen im Zweig `app-assets` unter `targets/kamera-knopf/` (README dort).
  Zum Einschalten: `targets/` kopieren, `@bacons/apple-targets` installieren und als Plugin eintragen, neu bauen.
- Einladungsseite des Servers erlaubt jetzt auch `findimal://`-Links. Text „Du brauchst Expo Go“ später auf
  App-Store-Link umstellen.

## Vor dem öffentlichen App-Store-Start
- Impressum: Platzhalter in `server/findimal-worker.js` (OPERATOR) durch echte Angaben ersetzen
  (Entscheidung: eigene Wohnadresse; E-Mail findimal26@gmail.com ist schon eingetragen).
- Gewerbe anmelden, Fragebogen Finanzamt (Kleinunternehmer), ggf. USt-IdNr. für AdMob.
- Marke „Findimal“: im DPMA/TMview nichts gefunden (Stand Oktober 2026).
- Test-Schalter für Plus aus der App entfernen, echtes Abo einbauen.
