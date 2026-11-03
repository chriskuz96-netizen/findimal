import { createContext, ReactNode, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

// Bildschirm-Aufteilung fürs iPhone Duo (Buch-Klapphandy):
// - zugeklappt (ca. 466 × 678) und auf normalen iPhones: eine Seite, nur Hochformat
// - aufgeklappt hochkant (ca. 669 × 951): eine große Seite
// - aufgeklappt quer (ca. 951 × 669, Falz senkrecht in der Mitte): zwei Seiten –
//   links immer „Entdecken“, rechts Sammlung, Challenges und Saison
// Alles richtet sich nur nach der Breite, nicht nach dem Gerätetyp.

// ab dieser Breite (und quer) werden zwei Seiten gezeigt
const SPLIT_WIDTH = 800;

export function useSplit(): boolean {
  const { width, height } = useWindowDimensions();
  return width >= SPLIT_WIDTH && width > height;
}

// Größe der Seite, in der eine Ansicht steht – bei zwei Seiten die Hälfte, sonst das ganze Fenster.
// Seiten sollen das statt useWindowDimensions() benutzen, wenn sie Breiten ausrechnen.
type Pane = { width: number; height: number };
const PaneContext = createContext<Pane | null>(null);

export function PaneSize({ width, height, children }: Pane & { children: ReactNode }) {
  return <PaneContext.Provider value={{ width, height }}>{children}</PaneContext.Provider>;
}

export function usePane(): Pane {
  const win = useWindowDimensions();
  return useContext(PaneContext) ?? { width: win.width, height: win.height };
}

// Drehen ist (noch) aus: die App steht fest im Hochformat (app.json "orientation": "portrait").
// Ein Versuch, das Drehen nur auf großen Bildschirmen zu erlauben, ließ auf normalen iPhones beim Öffnen
// mancher Fenster kurz drehen (3.11., Bau 13). Erst wieder einschalten, wenn es auf einem echten iPhone Duo
// bzw. im Duo-Simulator getestet werden kann. Zeigt das Duo die App von sich aus breit an, greift useSplit trotzdem.
