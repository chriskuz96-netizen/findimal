import * as ScreenOrientation from 'expo-screen-orientation';
import { createContext, ReactNode, useContext, useEffect } from 'react';
import { Dimensions, Platform, useWindowDimensions } from 'react-native';

// Bildschirm-Aufteilung fürs iPhone Duo (Buch-Klapphandy):
// - zugeklappt (ca. 466 × 678) und auf normalen iPhones: eine Seite, nur Hochformat
// - aufgeklappt hochkant (ca. 669 × 951): eine große Seite
// - aufgeklappt quer (ca. 951 × 669, Falz senkrecht in der Mitte): zwei Seiten –
//   links immer „Entdecken“, rechts Sammlung, Challenges und Saison
// Alles richtet sich nur nach der Breite, nicht nach dem Gerätetyp.

// ab dieser kürzeren Bildschirmseite darf gedreht werden (aufgeklapptes Duo; Handys bleiben im Hochformat)
const BIG_SCREEN = 600;
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

// Drehen nur auf großen Bildschirmen erlauben (beim Auf- und Zuklappen neu prüfen)
export function useOrientationPolicy(): void {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const apply = () => {
      const { width, height } = Dimensions.get('screen');
      const big = Math.min(width, height) >= BIG_SCREEN;
      (big ? ScreenOrientation.unlockAsync() : ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)).catch(() => {});
    };
    apply();
    const sub = Dimensions.addEventListener('change', apply);
    return () => sub.remove();
  }, []);
}
