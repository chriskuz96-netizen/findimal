# Findimal

Eine freundliche App, mit der man Tiere per Foto bestimmt und sammelt.
Expo / React Native mit TypeScript – läuft in **Expo Go** (kein eigener nativer Code).

Design-Vorlage: `findimal-design.html` im Branch `design-vorlage`
(nicht in `main`, weil Expo Snack HTML-Dateien nicht importieren kann)

## Ordner

- `App.tsx` – Einstieg: lädt Schriften (Fraunces, Nunito Sans) und zeigt die Startseite
- `src/theme.ts` – Farben, Schriften, Abstände aus der Vorlage
- `src/screens/StartScreen.tsx` – Startseite (Dschungel, Kamera-Knopf, Begrüßung)
- `src/components/` – Bausteine (Hintergrund, Kamera-Knopf, Tiere)
- `src/hooks/useLoop.ts` – kleine Hilfe für endlose, dezente Animationen
