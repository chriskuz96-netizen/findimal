# Findimal – Stand und nächste Schritte

Notiz für die nächste Arbeitssitzung (Stand: 14. Oktober 2026).

## Konten
- Apple-Entwickler-Account: freigeschaltet (14.10.2026), eigene Apple-ID nur für Findimal, Einzelperson.
- Expo: Konto `christianfindimal`, Projekt `findimal` (gehört dem Team `christianfindimals-team`), Projekt-ID `d01f3c01-05fb-435f-b41f-842cf6583f72`
  (in `app.config.js` eingetragen). Zugangsschlüssel als Umgebungsvariable `EXPO_TOKEN`.
- Cloudflare-Worker: `https://findimal.chriskuz96.workers.dev/` (Code: `server/findimal-worker.js`,
  wird von Hand im Cloudflare-Editor eingefügt). KV-Speicher als `DB` verbunden.
- Anthropic: Guthaben vorab, Monatslimit klein halten (TestFlight: ca. 20 $).

## App-Bau (EAS)
- `app.json` ist Snack-tauglich; `app.config.js` ergänzt Symbol, Startbild, Berechtigungstexte (`locales/`),
  Plugins, Expo-Konto und Projekt-ID. Snack ignoriert `app.config.js`.
- App-Symbol und Startbild liegen im Zweig `app-assets` (Snack verträgt keine PNGs im Hauptzweig).
  Vor dem Bauen: `git show origin/app-assets:assets/icon.png > assets/icon.png` und ebenso `splash-icon.png`,
  `icon-dark.png` und `icon-tinted.png` (dunkles/getöntes Symbol für iOS 18+).
- Bundle-ID `com.chriskuz.findimal`, nur iPhone (`supportsTablet: false`), `eas.json` mit Profil `production`.

## Nächste Schritte
1. Zugänge (eingerichtet am 15.10.):
   - Expo-Token und Cloudflare-Token sind **Network secrets** der Umgebung „Default“ (Proxy hängt
     `Authorization: Bearer …` an Anfragen zu `*.expo.dev` bzw. `api.cloudflare.com`). Sie sind NICHT als
     Umgebungsvariable sichtbar; für eas-cli ggf. `EXPO_TOKEN` mit Platzhalterwert setzen (Proxy ersetzt den Header).
     Getestet: api.expo.dev meldet `christianfindimal`, Cloudflare-Token gültig.
   - Apple als Umgebungsvariablen: `EXPO_ASC_KEY_ID`, `EXPO_ASC_ISSUER_ID`, `EXPO_APPLE_TEAM_ID` (D3JJJYM9W7)
     und `EXPO_ASC_API_KEY_P8` (Inhalt der .p8; vor dem Bau in eine Datei schreiben und
     `EXPO_ASC_API_KEY_PATH` darauf setzen). Nie in den Chat schreiben lassen.
   - App in App Store Connect angelegt (Hauptsprache Englisch USA), App-ID com.chriskuz.findimal registriert.
2. App in App Store Connect anlegen (Name Findimal, Bundle-ID oben).
   Erster Bau 15.10.: Projekt gehört dem Expo-Team `christianfindimals-team` → `owner` in `app.config.js`.
   App-Symbol/Startbild neu aus `AppLogo.tsx` erzeugt und in `app-assets` hochgeladen (`.easignore` sorgt dafür,
   dass EAS `assets/` mitnimmt, obwohl Git es ignoriert). Netzwerk der Umgebung erlaubt jetzt
   `api.appstoreconnect.apple.com`. Verteilungszertifikat und Profil liegen auf dem Expo-Server (gültig bis 15.10.2027).
   Push-Fähigkeit der App-ID von Hand eingeschaltet (EAS-Abgleich scheitert) → immer mit
   `EXPO_NO_CAPABILITY_SYNC=1`, `EXPO_APPLE_TEAM_TYPE=INDIVIDUAL` und `--non-interactive` bauen.
   App-Store-Connect-ID der App: 6823092816 (in `eas.json` unter submit).
   Bau 5 von Apple abgelehnt (ITMS-90683: NSMotionUsageDescription fehlte, verlangt vom Standort-Baustein; jetzt in
   `locales/` ergänzt). Bau 1.0.0 (6) am 15.10. von Apple angenommen (VALID) und in TestFlight. `eas submit --non-interactive` braucht den
   API-Schlüssel in `eas.json` (`ascApiKeyPath`, `ascApiKeyId`, `ascApiKeyIssuerId`) – nur lokal eintragen, nicht committen.
3. ~~Ersten Bau mit EAS und Upload zu TestFlight~~ erledigt (15.10.). Offen: Tester in App Store Connect → TestFlight eintragen.
4. Server für Tester öffnen: in Cloudflare die Variable `OFFEN` = `ja` setzen (Grenzen: 3 Fotos pro Handy,
   80 pro Anschluss, 300 pro Tag gesamt; `TAGES_GRENZE` änderbar).
5. Kleine Updates ohne Apple-Prüfung sind eingerichtet (expo-updates, Kanal `production`):
   `eas update --channel production --environment production --platform ios --message "…"`. Nur für reine
   JS-/Text-Änderungen. Laufzeit-Regel ist `appVersion` (seit Bau 8): Updates gehen an alle Bauten mit gleicher
   Version. Neue native Bausteine → zuerst `version` in `app.json` erhöhen, dann neu bauen.
   (Vorher `fingerprint`: zu empfindlich, schon `.gitignore`/`eas.json` änderten die Kennung.)
6. Später: AdMob mit Testanzeigen, Plus-Abo (In-App-Kauf).
   (Die Fundkarte wurde entfernt – keine Kartendienst-Kosten.)

## Offen beim Server
- Claude lädt `server/findimal-worker.js` jetzt selbst hoch (Cloudflare-API, Worker `findimal`, Modul-Format,
  Bindungen behalten: Geheimnisse ANTHROPIC_API_KEY, APP_KEY, KV `DB`). Am 15.10. war der laufende Server
  identisch mit GitHub. Variable `OFFEN` ist noch nicht gesetzt (erst für Tester ohne Code).

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
- Server für alle öffnen (`OFFEN = ja`) – im App Store hat niemand einen Findimal-Code. Vorher Apple App Attest
  einbauen (Server prüft, dass Anfragen aus der echten App kommen). Anthropic-Monatslimit klein halten.
- Wächter: tägliche geplante Aufgabe „Findimal-Wächter“ (7:52 Uhr) meldet Zugriffe ohne Code (KV-Schlüssel `fremd:Datum`).
  Vorschläge „In deiner Nähe“ gehen seit 15.10. auch ohne Code.
- **Server-Adresse ohne eigenen Namen:** `findimal.chriskuz96.workers.dev` zeigt „chriskuz96“ (Einladungslinks,
  Datenschutz, Hilfe). **Entschieden (15.10.):** später nur den Namensteil ändern (Cloudflare → Workers & Pages →
  Konto-Unterdomäne, z. B. `findimal-app.workers.dev`), keine eigene Domain. Achtung: die alte Adresse geht dann
  sofort nicht mehr. Deshalb gleichzeitig `SERVER_URL` in `src/config.ts` umstellen und per `eas update`
  verteilen, die Links in `docs/APPSTORE.md` anpassen. Am besten vor dem Start, wenn nur Tester betroffen sind.
- GitHub-Projekt ist öffentlich (Server-Adresse sichtbar, Geheimnisse nicht) – ggf. auf privat stellen.

## Ideen für später (wenn viele Spieler da sind)
- Weltweite Rangliste ausbauen: eigenes Fenster mit Filtern nach **Land und Region** und nach **Saison**
  (z. B. „Herbst 2026“). Eigene **Platznummer** anzeigen (z. B. „Platz 740 von 1.000“ statt „–“) – dafür muss
  der Server alle Punktestände kennen, nicht nur die Top 100 (`TOP_SIZE`).
- **Entschieden (15.10.):** Weltweit nur **Top 10**, dann „···“, dann **ein paar Leute vor und nach einem selbst**
  (motiviert, den Nächsten zu überholen). Statt der langen Top-100-Liste.
