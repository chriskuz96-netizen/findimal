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
   API-Schlüssel in `eas.json` (`ascApiKeyPath`, `ascApiKeyId`, `ascApiKeyIssuerId`) – **nie im Projektordner eintragen**,
   sondern in einer eigenen Kopie: `git worktree add --detach <scratchpad>/submit HEAD`, dort `eas.json` ergänzen und
   `eas submit --id <Build-ID>` ausführen (am 15.10. war der Schlüssel versehentlich auf GitHub gelandet).
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

## TestFlight für Tester
- Öffentlicher Link: https://testflight.apple.com/join/cjtvMZnH (Gruppe „Tester (Link)“, max. 100). Build 10 am 16.10.
  freigegeben (erste Beta-Prüfung dauerte ca. 13 Std.). Tester brauchen den Findimal-Code (separat schicken).
- Neue Builds: in App Store Connect der Gruppe hinzufügen und zur Beta-Prüfung einreichen.
- Erster Start lädt seit 16.10. das neueste Update vor der Einrichtung (`src/firstUpdate.ts`), sonst sähe man den
  aktuellen Stand erst beim zweiten Start.

## „Stimmt nicht?“ (16.10.)
- Unter dem Ergebnis und bei Funden in der Sammlung: eigene Vermutung eingeben, die genaue KI prüft am vorhandenen Foto.
- Server: `korrektur: { falsch, vorschlag }` → direkt `MODEL`, Tageslimit `DAILY_KORREKTUR` (5), kostet kein Gratis-Foto.

## Forscher-Quiz (29.10.)
- Oben auf Challenges: jeden Tag 10 Fragen mit Zeitbalken, bis +60 XP. Ersetzt die alten 3 Tagesfragen.
- Fragearten: Text, Wahr/Falsch, ein großes Bild (Spur, Umriss am Himmel, Fundstück), Duell „wer von beiden?“ und Rangliste (Treppchen 1–4, Einträge per Finger an die richtige Stelle schieben, dann „Fertig“; bei Zeitablauf zählt, was dasteht).
- Keine Tierbilder mehr im Quiz (29.10., Wunsch): so gehen beliebig viele Tiere ohne Zeichenaufwand. Nur Spuren/Umrisse/Fundstücke sind gezeichnet.
- Fragen stehen in `tools/quiz/*.json` (7 Sprachen), daraus macht `python3 tools/make_quiz_bank.py` die Datei `src/quizBank.ts`.
- Quiz-Bilder: `tools/quiz_art.py` (`python3 tools/make_quiz_art.py`).
- Stand: 274 Fragen ≈ 27 Spieltage ohne Wiederholung. Danach kommen zuerst falsch beantwortete Fragen wieder. Neue Pakete per Update, ohne laufende Kosten.
- Nach jeder Antwort bleibt die Erklärung stehen, bis man „Weiter“ oder irgendwo hintippt (automatisch weiter war zu stressig, 29.10.).
- Werbung: fester Banner unten im Quiz, Vollbild-Werbung erst nach der XP-Animation (nicht mit Plus).

## Plus: eigenes Foto als Profilbild (30.10.)
- Im Profil → Profilbild → „Deine Fotos (Plus)“. Auf dem eigenen Handy wird das Original gezeigt.
- Für die Rangliste lädt die App ein Vorschaubild hoch (160 × 160, ohne Ortsdaten). Der Server prüft es mit der KI
  (nur Tiere/Natur, keine Menschen), höchstens 5 Versuche am Tag. Abgelehnt: andere sehen den Buchstaben im goldenen Rahmen.
- Server: `board_photo`, Bild unter `ph:<Code>` im KV, abrufbar unter `/profilbild/<Code>`; wird beim Austreten gelöscht
  und bei 3 Meldungen ausgeblendet. Datenschutzseite ist angepasst.

## Rangliste: Freundschaftsanfragen (30.10.)
- Anfrage über die Profilkarte („Freundschaftsanfrage senden“; `board_request`, offen unter `rq:<Code>`). Kein „+“ mehr in
  den Listen, dort nur ⏳ (angefragt) bzw. ✓ (Freund). „Anfrage zurückziehen“ in der Karte (`board_unrequest`). Der andere sieht sie bei „Freunde“
  und kann annehmen/ablehnen (`board_answer`). Per Code/Einladungslink geht es weiter sofort.
- „Entfernen“ bei Freunden lässt die Person in der weltweiten Liste. Weltweit verschwindet jemand nur durch Melden
  (bei einem selbst sofort, für alle nach 3 Meldungen).

## Sprachen (1.11.)
- 7 Sprachen: Deutsch, Englisch, Französisch, Spanisch, **Italienisch**, **Portugiesisch (Brasilien)**, **Japanisch** (jeweils App-Texte, alle 274 Quizfragen,
  Saison, Tipps, Spitznamen, Datenschutz/Hilfe/Einladung auf dem Server, App-Store-Text in `docs/APPSTORE.md`).
- Japanisch: unsere Schriften haben keine japanischen Zeichen, das iPhone nimmt dafür seine Systemschrift. Auf dem iPhone prüfen,
  ob Überschriften fett genug wirken. App-Store-Text vor der Einreichung von Muttersprachler gegenlesen lassen.
  Namensfilter auf dem Server kennt jetzt auch japanische, portugiesische und italienische Schimpfwörter.
- Neue Sprache hinzufügen: `src/i18n/strings.ts` (Typ `Strings` erzwingt alle Schlüssel), `src/i18n/index.tsx` (Lang, LANGS, LOCALES),
  `tools/quiz/*.json` + `tools/make_quiz_bank.py`, `src/season.ts`, `src/tips.ts`, `src/nicknames.ts`; Server: `LANGUAGES`,
  `INVITE_TEXT`, `PRIVACY`, `HELP`, `PRIVACY_DATE`, `NAMES` in `infoPage`.
- China-Festland: nicht machbar (ICP-Lizenz, Anthropic dort nicht verfügbar, workers.dev meist gesperrt).
  Möglich: Chinesisch traditionell (Taiwan, Hongkong) und vereinfacht (Singapur, Auslands-Chinesen).
- Weitere Sprachen erst, wenn man nach dem Start sieht, aus welchen Ländern Nutzer kommen.
- Datenschutz (alle Sprachen, Stand November 2026): Saison-Abschnitt nennt jetzt die grobe Klimazone (Breite auf 10° gerundet).

## Saison weltweit (1.11.)
- Saison-Seite außerhalb Mitteleuropas: KI pro Land, Monat, Sprache – jetzt zusätzlich pro Breitengrad-Streifen
  (10°, `findimal-lat-band`, nur beim Standort/Ort-Eintippen ermittelt; Server-Schlüssel `saison:v2:<Land>:<Band>:…`).
  So bekommen große Länder (Brasilien, Australien, USA …) die passende Klimazone.
- Saison-Namen in Tropen/Südhalbkugel (Zone „other“ und Band < 25° bzw. unbekannt) nach Monaten:
  „Saison Sep.–Nov. 2026“ statt „Herbst 2026“ (`useNeutralSeasons` in `src/zone.ts`).

## Bilder ohne Kameradaten (30.10.)
- Aus der Fotoauswahl und ohne Kameradaten (Make/Model/Objektiv/Aufnahmezeit, `hasCameraData` in `src/camera.ts`):
  wird bestimmt, aber als `bildart: 'fremd'` gespeichert → „Nur zum Nachschlagen“, keine XP/Rangliste/Abzeichen.
  Prüfung läuft nur auf dem Handy (keine Kosten). Kamera-Fotos der App und eigene Mediathek-Fotos sind nicht betroffen.
- In der Web-Vorschau haben Bilder nie Kameradaten → dort ist jedes hochgeladene Bild „Nachschlagen“.

## Joker und „Serie retten“ (30.10.)
- Joker im Forscher-Quiz, einmal pro Runde (`Round.j`: -1 = frei, sonst Frage-Nr.): 4 Antworten → 50:50,
  2 Antworten → +10 Sek., Treppchen → ein Platz richtig und fest. Antwort mit Joker ohne Schnelligkeitsbonus.
- Gratis: vor einer neuen Runde Startbildschirm „Mit Joker spielen (kurzes Video)“ / „Ohne Joker los“.
  Plus: Joker automatisch. Wer heute schon ein Belohnungs-Video gesehen hat (Joker, Serie retten,
  Extra-Foto), bekommt heute keine große Werbung mehr (Vollbild nach dem Quiz, halbe Werbeseite) – `rewardedToday()`.
- Serie retten: gestern verpasst, vorgestern in Serie → einmal pro Woche (`ForscherLog.saved`). Gratis per Video
  (Leiste unter der Quiz-Karte), Plus automatisch. Gerettete Tage zählen für die Serie, bringen keine XP.
- Videos: `showRewarded()` in `src/ads.ts` gibt die Belohnung bis AdMob sofort (Testversion) – mit AdMob anschließen.

## Saison-Rangliste (30.10.)
- Dritter Reiter „Saison“: meiste XP in der laufenden Jahreszeit (`seasonXp` in `src/progress.ts`: Funde, Saison-Ziel,
  Wochen-Aufgaben und Quiz-XP dieser Saison). Server führt `stop:<Saison>` (Top 100, bleibt nach Saisonende stehen).
- Saisonende: beim ersten Öffnen danach schaut die App ihren Platz in der alten Liste nach und schreibt einmalig
  Extra-XP gut (`SEASON_REWARDS`: 1. +500, Top 3 +300, Top 10 +200, Top 50 +100, Top 100 +50; gemerkt unter
  `findimal-season-awards`).
- Profil zeigt „Meist fotografiert“ (Tiergruppe). Profilkarte zeigt außerdem Saison-XP, Saison-Platz und beste Saison.

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
- Impressum: erledigt (15.10.). Name und Anschrift stehen als Cloudflare-Variablen `IMPRESSUM_NAME` und
  `IMPRESSUM_ADRESSE` (nicht im GitHub-Code), Anschrift nur ganz unten. Beim Hochladen des Workers
  `keep_bindings` mit `plain_text` angeben, sonst gehen die Variablen verloren.
- Gewerbe anmelden, Fragebogen Finanzamt (Kleinunternehmer), ggf. USt-IdNr. für AdMob.
- Marke „Findimal“: im DPMA/TMview nichts gefunden (Stand Oktober 2026).
- App-Store-Kategorie prüfen: „Bildung“ gilt laut RevenueCat 2026 als schwierige Kategorie für neue Apps.
  Vor der Einreichung überlegen, ob „Nachschlagewerke“ als Hauptkategorie besser passt.
- Test-Schalter für Plus aus der App entfernen, echtes Abo einbauen.
- Server für alle öffnen (`OFFEN = ja`) – im App Store hat niemand einen Findimal-Code. Vorher Apple App Attest
  einbauen (Server prüft, dass Anfragen aus der echten App kommen). Anthropic-Monatslimit klein halten.
- **Anthropic-Guthaben (5.11.: ca. 4,56 $, Limit 5 $):** kurz vor dem Start in console.anthropic.com Auto-Reload
  einschalten (unter 10 $ → 20 $ nachladen) und Monatslimit auf ca. 50 $ setzen. Leeres Guthaben = keine Tierbestimmung.
  Server deckelt auf 300 Bestimmungen/Tag. Nach den ersten Wochen an echte Kosten anpassen.
- Wächter: tägliche geplante Aufgabe „Findimal-Wächter“ (7:52 Uhr) meldet Zugriffe ohne Code (KV-Schlüssel `fremd:Datum`).
  Vorschläge „In deiner Nähe“ gehen seit 15.10. auch ohne Code.
- **Server-Adresse ohne eigenen Namen:** `findimal.chriskuz96.workers.dev` zeigt „chriskuz96“ (Einladungslinks,
  Datenschutz, Hilfe). **Entschieden (15.10.):** später nur den Namensteil ändern (Cloudflare → Workers & Pages →
  Konto-Unterdomäne, z. B. `findimal-app.workers.dev`), keine eigene Domain. Achtung: die alte Adresse geht dann
  sofort nicht mehr. Deshalb gleichzeitig `SERVER_URL` in `src/config.ts` umstellen und per `eas update`
  verteilen, die Links in `docs/APPSTORE.md` anpassen. Am besten vor dem Start, wenn nur Tester betroffen sind.
- GitHub-Projekt ist öffentlich (Server-Adresse sichtbar, Geheimnisse nicht) – ggf. auf privat stellen.

## Android gleichzeitig starten (entschieden 30.10.)
- Google Play verlangt bei neuen privaten Konten vor der Freigabe einen geschlossenen Test mit mindestens 12 Testern
  über 14 Tage. Deshalb: Konto (einmalig 25 $) bis ca. 7.11. anlegen, Identität bestätigen lassen, bis ca. 10.11.
  ersten Android-Build in den geschlossenen Test, 15–20 Tester mit Android-Handy einladen. Freigabe dann ca. Ende
  November / Anfang Dezember.
- Code: `app.json` hat `android.package` (`com.chriskuz.findimal`), aber noch kein `adaptiveIcon` – vor dem ersten
  Build ergänzen. Android-Build mit EAS noch nie gelaufen: Kamera, Fotoauswahl, Mitteilungen (Android-Kanal),
  Tastatur in Onboarding/Region/Code, Teilen-Link der Rangliste prüfen.
- Abo über Google Play Billing (gleiche Bibliothek wie für Apple wählen, die beides kann), AdMob-App auch für Android
  anlegen, Familien-Richtlinie von Google beachten (Zielgruppe im Fragebogen).
- Server-Schutz: Apple App Attest gibt es nur auf dem iPhone – für Android braucht der Server die Play Integrity API.
- Kontrollzentrum-Knopf gibt es nur auf dem iPhone.

## Aus dem Test vom 15.10. (vor dem Start erledigen)
- Server: Profilbild-ID beim Speichern gegen erlaubte Werte prüfen (App ist schon abgesichert).
- Rangliste: XP werden ungeprüft übernommen → Sprünge begrenzen, `board_*` pro IP begrenzen.
- Melden: 3 Meldungen von frischen Codes blenden jeden aus → nur Melder mit etwas XP zählen.
- `board_link`: Fremde landen ungefragt in der Freundesliste → begrenzen bzw. bestätigen lassen; ab 51 Freunden fehlen Einträge.
- Kosten: Geräte-ID würfelt die App selbst (Limit pro Handy umgehbar); Fotos ohne Tier gehen auch an das teure Modell.
  `DAILY_PER_IP` ist 150 (nicht 80). Vor `OFFEN=ja` App Attest.
- KV: `top` und Saison-Zähler werden gleichzeitig überschrieben (bei vielen Nutzern) → später D1/Durable Object.
- Einladungsseite verweist auf „Expo Go“ → auf App-Store-Seite umstellen.
- Sammlung: Fotos liegen als Text im Speicher, alle Kacheln auf einmal → bei vielen Funden Fotos als Dateien + FlatList.
- Standort-Texte „immer“ und Bewegungsdaten-Text prüfen (App nutzt nur „beim Verwenden“).
- Plus/Video/Anzeigen-Platzhalter vor der Store-Einreichung ausblenden bzw. echt einbauen (Apple lehnt sonst ab).
- Rangliste automatisch an: für Kinder heikel (DSGVO Art. 8) – vor dem Start nochmal entscheiden.

## Geräte-Abgleich über iCloud (15.10.: vorerst NICHT, nur falls Nutzer danach fragen)
- Grund: Handywechsel klappt schon über Schnellstart/iCloud-Backup (alle Daten inkl. Fotos liegen in AsyncStorage);
  Nutzung fast nur auf dem Handy, nicht auf dem iPad.
- Ziel: gleiche Sammlung, Fotos, Punkte und Ranglisten-Eintrag auf iPhone, iPad und neuem Handy (gleiche Apple-ID),
  ohne eigenes Konto und ohne Daten auf unserem Server.
- Umsetzung (neuer App-Bau nötig): iCloud-Fähigkeit + Container `iCloud.com.chriskuz.findimal` für die App-ID
  (im Apple-Entwicklerportal einschalten), Baustein z. B. `react-native-cloud-store` mit Config-Plugin.
  Kleine Daten (Name, Punkte, Ranglisten-Code/-Geheimnis, Einstellungen) in iCloud-Key-Value, Funde + Fotos als Dateien
  im iCloud-Container. Zusammenführen: Funde nach ID vereinen, neuere Änderung gewinnt.
- Dabei die App fürs iPad freischalten (`supportsTablet: true`) und Seiten an große Breiten anpassen (passt zum iPhone Duo).
- Gut zu wissen: Beim Handywechsel per iCloud-Backup bzw. Schnellstart kommen die App-Daten heute schon mit.

## iPhone Duo (faltbar, ab Herbst 2026)
- Läuft schon: außen wie ein normales iPhone, innen (7,6 Zoll) nur in iPhone-Größe mit Rändern.
- Später, wenn die ersten Geräte da sind: mit dem iOS-27.1-Werkzeug (oder neuer) bauen, Seiten an die Breite anpassen
  (Sammlung mehr Spalten, Startseite, Saison-Karten), im Simulator bzw. auf einem echten Gerät testen.
- Apple verlangt laut Berichten ab April 2027 Duo-Bildschirmfotos im App Store.
- **3.11.: Expo SDK 58 + Duo auf Zweig `sdk58-duo`** (Version 1.1.0, React Native 0.88, EAS-Bild `latest` für Xcode/iOS 27.1).
  Sammlung 3–4 Spalten ab 600 Punkten Breite, Quiz höchstens 640 breit. Achtung: kleine Updates (eas update) gehen
  jetzt getrennt an 1.0.0 (alter Bau, vom Zweig `main`) und 1.1.0 (neuer Bau, vom Zweig `sdk58-duo`). Nach dem Test
  `sdk58-duo` in `main` übernehmen und nur noch 1.1.0 bedienen.
  **Duo quer (ab 800 breit und breiter als hoch): zwei Seiten** – links immer Entdecken, rechts Sammlung/Challenges/
  Saison mit eigener Tab-Leiste (src/layout.tsx: useSplit, PaneSize/usePane). **Drehen ist aus** (fest Hochformat):
  Bau 13 erlaubte Drehen nur auf großen Bildschirmen (expo-screen-orientation), auf normalen iPhones zuckte die App
  aber beim Öffnen mancher Fenster kurz quer. Entschieden 3.11.: normale iPhones haben Vorrang, Duo-Drehen erst
  wieder, wenn es auf echtem Duo/Duo-Simulator getestet werden kann. Seit Bau 14 wieder nur Hochformat.
  Das Duo ist ein Buch-Klapphandy: zugeklappt ca. 466×678, aufgeklappt ca. 951×669 mit Falz senkrecht in der Mitte.
  Gesture Handler 3: alter Baukasten (Gesture.Pan/Native) ist veraltet, funktioniert aber; später auf Hooks umstellen.
- **Entschieden 1.11.: vor dem Start fürs Duo optimieren** (zusammen mit dem Bau für Abo/Werbung/Server-Schutz):
  1. Expo SDK 57 → 58 (baut mit iOS 27.1; Apps mit älterem Werkzeug erscheinen auf dem Innen-Bildschirm klein
     in der Mitte). Danach alle Web-Tests und einen TestFlight-Bau prüfen.
  2. Seiten an die Breite anpassen: Sammlung mehr Spalten, Startseite/Saison-Karten nebeneinander, Quiz und
     Steckbrief mit Maximalbreite, SafeAreaView auch seitlich (Statusbalken rechts beim Duo).
  3. Duo-Bildschirmfotos in App Store Connect hochladen → Abzeichen „Made for iPhone Duo“, Chance auf Apples
     Duo-Sammlungen. (Ob optimierte Apps in der Suche höher stehen, ist nicht belegt.)
  Testen: Layout im Browser in Duo-Größe; echtes Gerät oder Xcode-Simulator fehlt bisher.

## Ideen für später (wenn viele Spieler da sind)
- Weltweite Rangliste ausbauen: eigenes Fenster mit Filtern nach **Land und Region** und nach **Saison**
  (z. B. „Herbst 2026“). Eigene **Platznummer** anzeigen (z. B. „Platz 740 von 1.000“ statt „–“) – dafür muss
  der Server alle Punktestände kennen, nicht nur die Top 100 (`TOP_SIZE`).
- **Entschieden (15.10.):** Weltweit nur **Top 10**, dann „···“, dann **ein paar Leute vor und nach einem selbst**
  (motiviert, den Nächsten zu überholen). Statt der langen Top-100-Liste.
