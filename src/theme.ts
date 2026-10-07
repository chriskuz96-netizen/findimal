// Farben, Schriften und Abstände aus findimal-design.html

export const colors = {
  // Grundfarben (helles Thema)
  bg: '#F0F3EC',
  ink: '#13261C',
  mute: '#5B6C61',
  line: '#D5DECF',
  card: '#FFFFFF',
  // Akzent: Fuchsorange
  accent: '#E8833A',
  accentLight: '#FFD2A8',
  accentDark: '#A9561C',
  moss: '#1F6E47',
  coral: '#D9533B',
  // Dschungel-Startseite
  skyTop: '#2A6B48',
  skyMid: '#143F2A',
  skyBottom: '#0B2619',
  leafDark: '#1A4A32',
  leafMid: '#1E5A3C',
  firefly: '#F2D27A',
  camInner: '#2B6B47',
  camOuter: '#0F3322',
  white: '#FFFFFF',
};

// Helle und dunkle Variante für normale Seiten (z. B. Begrüßung).
// Die Startseite ist immer dunkel.
export type Palette = {
  bg: string;
  ink: string;
  mute: string;
  line: string;
  card: string;
  moss: string; // Grün für Text und Symbole
  button: string; // Grün für Knöpfe mit weißer Schrift (im Dunkelmodus dunkler, damit sie lesbar bleibt)
};

export const lightPalette: Palette = {
  bg: colors.bg,
  ink: colors.ink,
  mute: colors.mute,
  line: colors.line,
  card: colors.card,
  moss: colors.moss,
  button: colors.moss,
};

export const darkPalette: Palette = {
  bg: '#0A1711',
  ink: '#E5EEE3',
  mute: '#9DB0A2',
  line: '#22392C',
  card: '#12241A',
  moss: '#6FBF8A',
  button: '#2E7D52',
};

export const fonts = {
  // Überschriften
  serifBold: 'Fraunces_700Bold',
  serifSemi: 'Fraunces_600SemiBold',
  // Fließtext
  sans: 'NunitoSans_500Medium',
  sansBold: 'NunitoSans_700Bold',
};

export const spacing = {
  gutter: 18, // Seitenrand wie im Entwurf
  radiusHero: 28,
  radiusCard: 20,
};
