# Findimal – Stand und nächste Schritte

Notiz für die nächste Arbeitssitzung (Stand: 14. Oktober 2026).

## Konten
- Apple-Entwickler-Account: freigeschaltet (14.10.2026), eigene Apple-ID nur für Findimal, Einzelperson.
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
1. App-Store-Connect-API-Schlüssel (Rolle Admin) und Expo-Zugang als Umgebungsvariablen:
   `EXPO_TOKEN`, `EXPO_ASC_KEY_ID`, `EXPO_ASC_ISSUER_ID`, `EXPO_APPLE_TEAM_ID` und der Inhalt der .p8-Datei
   als `EXPO_ASC_API_KEY_P8` (vor dem Bau in eine Datei schreiben und `EXPO_ASC_API_KEY_PATH` darauf setzen).
   Nie in den Chat schreiben lassen. Netzwerk der Umgebung muss expo.dev, api.expo.dev, u.expo.dev und
   storage.googleapis.com erlauben (am 14.10. noch gesperrt).
2. App in App Store Connect anlegen (Name Findimal, Bundle-ID oben).
3. Ersten Bau mit EAS (`eas build -p ios --profile production`) und Upload zu TestFlight (`eas submit`).
4. Server für Tester öffnen: in Cloudflare die Variable `OFFEN` = `ja` setzen (Grenzen: 3 Fotos pro Handy,
   80 pro Anschluss, 300 pro Tag gesamt; `TAGES_GRENZE` änderbar).
5. Kleine Updates ohne Apple-Prüfung sind eingerichtet (expo-updates, Kanal `production`):
   `eas update --channel production --message "…"`. Nur für reine JS-/Text-Änderungen; neue native
   Bausteine brauchen einen neuen Bau.
6. Später: AdMob mit Testanzeigen, Plus-Abo (In-App-Kauf).
   (Die Fundkarte wurde entfernt – keine Kartendienst-Kosten.)

## Offen beim Server
- Der Nutzer fügt `server/findimal-worker.js` von Hand in Cloudflare ein. Seit dem 11.10. kamen dazu:
  Gegend/Monat als Hinweis bei der Bestimmung, konkrete Art statt „Spinne“, Länder-Saison (`mode: 'saison'`),
  Datenschutz-Ergänzungen. Nachfragen, ob eingefügt.
- Cloudflare-Zugang für Claude (API-Token „Edit Cloudflare Workers“ + api.cloudflare.com freigeben):
  erst nach dem Start der App.

## Natur-Tipps (Mitteilungen)
- `src/notify.ts` plant lokal (expo-notifications) die nächsten 8 Sonntage 10 Uhr, Texte in `src/tips.ts`.
- Kein Push-Server, kein Token. Frage nach dem ersten Fund, Schalter im Profil, Test-Knopf nur in `__DEV__`.
- Naturraum (`src/zone.ts`): Mitteleuropa / Mittelmeer (eigene Wintertipps) / außerhalb Europas (keine Tipps). Aus dem Land beim Standort-Erkennen, sonst aus den iPhone-Einstellungen.
- Im TestFlight-Bau prüfen: Mitteilung kommt, Tippen öffnet die Saison-Seite.

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
