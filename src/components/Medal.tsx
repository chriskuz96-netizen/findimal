import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { BADGE_TIER, BadgeId } from '../progress';

// Medaillen-Farben: Bronze, Silber, Gold
const TIERS = {
  bronze: { light: '#F2C08A', mid: '#C7803F', dark: '#7A4A1E' },
  silver: { light: '#F4F6F8', mid: '#B9C2CB', dark: '#6B7681' },
  gold: { light: '#FFE9A3', mid: '#E8B53A', dark: '#9A6B12' },
};
const GREY = { light: '#C9CFC9', mid: '#9AA29B', dark: '#6B736C' };

export { BADGE_TIER };

type Props = { id: BadgeId; size: number; earned?: boolean };

// Eine runde Medaille mit Bändchen und Bild in der Mitte.
export function Medal({ id, size, earned = true }: Props) {
  const t = earned ? TIERS[BADGE_TIER[id]] : GREY;
  const g = `${id}-${earned ? 'on' : 'off'}`; // eindeutige Namen für Verläufe
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id={`rim-${g}`} cx="0.35" cy="0.3" r="0.8">
          <Stop offset="0" stopColor={t.light} />
          <Stop offset="0.55" stopColor={t.mid} />
          <Stop offset="1" stopColor={t.dark} />
        </RadialGradient>
        <RadialGradient id={`core-${g}`} cx="0.4" cy="0.35" r="0.75">
          <Stop offset="0" stopColor={earned ? '#2B6B47' : '#7E877F'} />
          <Stop offset="1" stopColor={earned ? '#0F3322' : '#555D56'} />
        </RadialGradient>
        <LinearGradient id={`flame-${g}`} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={earned ? '#E8833A' : '#A8AFA9'} />
          <Stop offset="1" stopColor={earned ? '#FFD45E' : '#D5DAD5'} />
        </LinearGradient>
      </Defs>

      {/* Bändchen hinter der Medaille */}
      <Path d="M20 44 L14 62 L21 58 L25 63 L30 47 Z" fill={earned ? '#C9533B' : '#8E958F'} />
      <Path d="M44 44 L50 62 L43 58 L39 63 L34 47 Z" fill={earned ? '#1F6E47' : '#7A817B'} />

      {/* Rand mit kleinen Zacken */}
      <Circle cx={32} cy={28} r={26} fill={`url(#rim-${g})`} />
      <G fill={t.dark} opacity={0.35}>
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i / 24) * Math.PI * 2;
          return <Circle key={i} cx={32 + Math.cos(a) * 24} cy={28 + Math.sin(a) * 24} r={0.9} />;
        })}
      </G>
      <Circle cx={32} cy={28} r={19.5} fill={`url(#core-${g})`} stroke={t.dark} strokeWidth={1.2} />
      {/* Glanzlicht */}
      <Path d="M15 20 A19 19 0 0 1 30 8" stroke="#fff" strokeOpacity={0.55} strokeWidth={2.2} fill="none" strokeLinecap="round" />

      <G transform="translate(32 28)">
        <Art id={id} earned={earned} g={g} />
      </G>

      {!earned && (
        // kleines Schloss
        <G transform="translate(44 40)">
          <Circle r={8} fill="#4A524B" stroke="#fff" strokeWidth={1.5} />
          <Path d="M-2.6 -1 V-3 A2.6 2.6 0 0 1 2.6 -3 V-1" stroke="#fff" strokeWidth={1.4} fill="none" />
          <Path d="M-3.6 -1 H3.6 V4 H-3.6 Z" fill="#fff" />
        </G>
      )}
    </Svg>
  );
}

// Bilder in der Mitte (Koordinaten um 0,0, ca. ±14)
function Art({ id, earned, g }: { id: BadgeId; earned: boolean; g: string }) {
  const c = (color: string) => (earned ? color : '#C4CAC5');
  switch (id) {
    case 'first': // Lupe mit Funkeln
      return (
        <G>
          <Circle cx={-2} cy={-2} r={7.5} fill={c('#BFE6F2')} fillOpacity={0.35} stroke={c('#FFD2A8')} strokeWidth={2.6} />
          <Path d="M3.5 3.5 L10 10" stroke={c('#FFD2A8')} strokeWidth={3.6} strokeLinecap="round" />
          <Path d="M-4 -6 Q-2 -5 -1 -7" stroke="#fff" strokeOpacity={0.8} strokeWidth={1.4} fill="none" strokeLinecap="round" />
          <Star x={9} y={-9} r={3.4} fill={c('#FFE07A')} />
        </G>
      );
    case 'insects5': // Marienkäfer
      return (
        <G>
          <Path d="M-8 -4l-5 -3M-9 2h-5M-8 7l-5 3M8 -4l5 -3M9 2h5M8 7l5 3" stroke={c('#1B1410')} strokeWidth={1.3} strokeLinecap="round" />
          <Circle cx={0} cy={-9} r={4.5} fill={c('#1B1410')} />
          <Ellipse cx={0} cy={2} rx={10} ry={11} fill={c('#D9433A')} />
          <Path d="M0 -9 V13" stroke={c('#1B1410')} strokeWidth={1.3} />
          <Circle cx={-5} cy={-2} r={2} fill={c('#1B1410')} />
          <Circle cx={5} cy={-2} r={2} fill={c('#1B1410')} />
          <Circle cx={-5} cy={6} r={2} fill={c('#1B1410')} />
          <Circle cx={5} cy={6} r={2} fill={c('#1B1410')} />
          <Circle cx={0} cy={2} r={1.6} fill={c('#1B1410')} />
          <Path d="M-6 -6 Q-4 -8 -1 -8" stroke="#fff" strokeOpacity={0.6} strokeWidth={1.2} fill="none" />
        </G>
      );
    case 'night': // Mond, Sterne, Eule-Augen
      return (
        <G>
          <Path d="M3 -12 A12 12 0 1 0 12 4 A9 9 0 1 1 3 -12 Z" fill={c('#FFE07A')} />
          <Star x={-8} y={-8} r={2.4} fill={c('#FFF4C2')} />
          <Star x={-11} y={4} r={1.6} fill={c('#FFF4C2')} />
          <Star x={9} y={-10} r={1.8} fill={c('#FFF4C2')} />
        </G>
      );
    case 'birds5': // Vogel
      return (
        <G>
          <Path d="M-12 4 C-7 5 -4 3 -2 -1 C0 -5 3 -7 6 -7 C9 -7 11 -5 11 -3 L14 -2 L11 -1 C11 7 5 11 -2 11 L-6 11 Z" fill={c('#3A7CA5')} />
          <Path d="M-4 4 C-1 8 4 8 7 4 C3 5 -1 5 -4 4 Z" fill={c('#FFD2A8')} />
          <Path d="M-6 2 C-2 -2 2 -1 3 2 C0 1 -3 2 -6 2 Z" fill={c('#1F4E6B')} />
          <Circle cx={7} cy={-4} r={1.3} fill="#fff" />
          <Circle cx={7.3} cy={-4} r={0.7} fill="#13261C" />
        </G>
      );
    case 'species10':
    case 'species25':
    case 'species50': // Schmetterling mit Zahl
      return (
        <G>
          <Path d="M0 -2 C-4 -12 -14 -12 -13 -5 C-12 1 -5 1 0 0 Z" fill={c('#E8833A')} />
          <Path d="M0 -2 C4 -12 14 -12 13 -5 C12 1 5 1 0 0 Z" fill={c('#E8833A')} />
          <Path d="M0 1 C-5 2 -11 5 -9 9 C-7 12 -2 8 0 3 Z" fill={c('#FFD2A8')} />
          <Path d="M0 1 C5 2 11 5 9 9 C7 12 2 8 0 3 Z" fill={c('#FFD2A8')} />
          <Circle cx={-8} cy={-6} r={1.8} fill={c('#13261C')} />
          <Circle cx={8} cy={-6} r={1.8} fill={c('#13261C')} />
          <Ellipse cx={0} cy={0} rx={1.4} ry={6} fill={c('#13261C')} />
          <Path d="M0 -6 L-3 -11 M0 -6 L3 -11" stroke={c('#13261C')} strokeWidth={1} />
          <SvgText x={0} y={13.5} fontSize={6.5} fontWeight="bold" fill={c('#FFE9A3')} textAnchor="middle">
            {id === 'species10' ? '10' : id === 'species25' ? '25' : '50'}
          </SvgText>
        </G>
      );
    case 'fish': // Fisch mit Luftblasen
      return (
        <G>
          <Path d="M-9 0 C-5 -8 5 -9 10 0 C5 9 -5 8 -9 0 Z" fill={c('#3A8FA5')} />
          <Path d="M-9 0 L-14 -6 L-13 0 L-14 6 Z" fill={c('#1F4F5E')} />
          <Path d="M-1 -6 C1 -9 4 -9 5 -7" stroke={c('#1F4F5E')} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          <Path d="M0 -5 C-2 -1 -2 2 0 5" stroke={c('#BFE6F2')} strokeWidth={1.2} fill="none" />
          <Circle cx={5} cy={-1.5} r={1.6} fill="#fff" />
          <Circle cx={5.4} cy={-1.5} r={0.8} fill="#13261C" />
          <Circle cx={11} cy={-8} r={1.6} fill="none" stroke={c('#BFE6F2')} strokeWidth={0.9} />
          <Circle cx={8} cy={-12} r={1.1} fill="none" stroke={c('#BFE6F2')} strokeWidth={0.8} />
        </G>
      );
    case 'reptile': // Eidechse von oben
      return (
        <G>
          <Path d="M1 6 C2 10 -1 13 -6 13" stroke={c('#7A8A3E')} strokeWidth={3} fill="none" strokeLinecap="round" />
          <Path d="M-3 -4 L-9 -8 M3 -4 L9 -7 M-3 4 L-9 7 M3 4 L9 8" stroke={c('#7A8A3E')} strokeWidth={2.2} strokeLinecap="round" />
          <Ellipse cx={0} cy={0} rx={4} ry={8} fill={c('#9DB35A')} />
          <Ellipse cx={0} cy={-10} rx={3.4} ry={4} fill={c('#9DB35A')} />
          <Path d="M0 -5 V6" stroke={c('#5E6E2B')} strokeWidth={1} strokeDasharray="1.5 1.5" />
          <Circle cx={-1.5} cy={-11} r={0.9} fill={c('#13261C')} />
          <Circle cx={1.5} cy={-11} r={0.9} fill={c('#13261C')} />
        </G>
      );
    case 'early': // Sonnenaufgang
      return (
        <G>
          <Path d="M-11 4 A11 11 0 0 1 11 4 Z" fill={c('#FFD45E')} />
          <Path d="M0 -12 V-9 M-9 -8 L-7 -6 M9 -8 L7 -6 M-13 -2 H-10 M13 -2 H10" stroke={c('#FFE9A3')} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M-14 4 H14" stroke={c('#FFD2A8')} strokeWidth={2} strokeLinecap="round" />
          <Path d="M-9 8 H9 M-5 11 H5" stroke={c('#BFE6F2')} strokeWidth={1.6} strokeLinecap="round" opacity={0.8} />
        </G>
      );
    case 'streak7': // Flamme mit 7
      return (
        <G>
          <Path d="M0 -13 C4 -7 10 -4 10 4 C10 10 5 13 0 13 C-5 13 -10 10 -10 4 C-10 -1 -6 -3 -5 -8 C-2 -5 -1 -3 0 -13 Z" fill={c('#E8833A')} />
          <Path d="M0 -3 C2 0 5 2 5 6 C5 9 3 11 0 11 C-3 11 -5 9 -5 6 C-5 3 -2 1 0 -3 Z" fill={c('#FFD45E')} />
          <SvgText x={0} y={10} fontSize={9} fontWeight="bold" fill={c('#7A3E17')} textAnchor="middle">
            7
          </SvgText>
        </G>
      );
    case 'mam5': // Fuchskopf
      return (
        <G>
          <Path d="M-11 -2 L-9 -13 L-3 -7 Z M11 -2 L9 -13 L3 -7 Z" fill={c('#E8833A')} />
          <Path d="M-11 -3 Q-11 -8 -5 -8 L5 -8 Q11 -8 11 -3 Q11 4 0 12 Q-11 4 -11 -3 Z" fill={c('#E8833A')} />
          <Path d="M-11 -3 Q-6 2 -2 3 Q-1 7 0 12 Q-9 6 -11 -3 Z M11 -3 Q6 2 2 3 Q1 7 0 12 Q9 6 11 -3 Z" fill={c('#FFF3E6')} />
          <Circle cx={-4} cy={-2} r={1.4} fill={c('#13261C')} />
          <Circle cx={4} cy={-2} r={1.4} fill={c('#13261C')} />
          <Ellipse cx={0} cy={10} rx={1.8} ry={1.3} fill={c('#13261C')} />
        </G>
      );
    case 'amp5': // Frosch mit Krone
      return (
        <G>
          <Path d="M-6 -12 L-6 -8 L6 -8 L6 -12 L3 -9.5 L0 -13 L-3 -9.5 Z" fill={c('#FFD45E')} />
          <Ellipse cx={0} cy={4} rx={12} ry={8} fill={c('#5FA24A')} />
          <Circle cx={-6} cy={-4} r={4.5} fill={c('#5FA24A')} />
          <Circle cx={6} cy={-4} r={4.5} fill={c('#5FA24A')} />
          <Circle cx={-6} cy={-4.5} r={2.6} fill="#fff" />
          <Circle cx={6} cy={-4.5} r={2.6} fill="#fff" />
          <Circle cx={-6} cy={-4.5} r={1.3} fill={c('#13261C')} />
          <Circle cx={6} cy={-4.5} r={1.3} fill={c('#13261C')} />
          <Path d="M-5 6 Q0 9 5 6" stroke={c('#2F5E2A')} strokeWidth={1.4} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'mol5': // Schnecke
      return (
        <G>
          <Path d="M-13 9 L10 9 Q13 9 13 6 L13 2 Q11 4 9 4 L-10 4 Q-13 4 -13 9 Z" fill={c('#C9B48A')} />
          <Path d="M10 4 L12 -4 M12 4 L15 -3" stroke={c('#C9B48A')} strokeWidth={1.4} strokeLinecap="round" />
          <Circle cx={-2} cy={-2} r={9} fill={c('#B7832F')} />
          <Path d="M-2 -2 m-6 0 a6 6 0 1 0 6 -6 a4 4 0 1 0 4 4 a2 2 0 1 0 -2 2" stroke={c('#7A4A1E')} strokeWidth={1.4} fill="none" />
        </G>
      );
    case 'ara5': // Spinne im Netz
      return (
        <G>
          <Path d="M0 -14 V14 M-14 0 H14 M-10 -10 L10 10 M10 -10 L-10 10" stroke={c('#E9EEF0')} strokeWidth={0.6} opacity={0.8} />
          <Circle cx={0} cy={0} r={6} fill="none" stroke={c('#E9EEF0')} strokeWidth={0.6} opacity={0.8} />
          <Circle cx={0} cy={0} r={11} fill="none" stroke={c('#E9EEF0')} strokeWidth={0.6} opacity={0.8} />
          <Path d="M-3 -1 L-9 -6 M-3 1 L-10 0 M-3 3 L-9 7 M-2 4 L-6 10 M3 -1 L9 -6 M3 1 L10 0 M3 3 L9 7 M2 4 L6 10" stroke={c('#3A2F4A')} strokeWidth={1.4} strokeLinecap="round" />
          <Ellipse cx={0} cy={2} rx={3.6} ry={4.6} fill={c('#5E4E78')} />
          <Circle cx={0} cy={-3.5} r={2.4} fill={c('#3A2F4A')} />
          <Path d="M0 0 L0 4 M-1.6 2 L1.6 2" stroke={c('#FFE9A3')} strokeWidth={0.9} />
        </G>
      );
    case 'top100':
    case 'top50':
    case 'top10':
    case 'top1': // Pokal mit Platz
      return (
        <G>
          <Path d="M-8 -11 H8 V-3 Q8 5 0 6 Q-8 5 -8 -3 Z" fill={c('#FFD45E')} stroke={c('#9A6B12')} strokeWidth={0.8} />
          <Path d="M-8 -9 Q-13 -9 -12 -4 Q-11 0 -7 0 M8 -9 Q13 -9 12 -4 Q11 0 7 0" stroke={c('#FFD45E')} strokeWidth={1.8} fill="none" />
          <Path d="M-2 6 H2 V9 H-2 Z M-6 9 H6 V12 H-6 Z" fill={c('#E8B53A')} />
          <SvgText x={0} y={id === 'top1' ? -0.5 : -1.5} fontSize={id === 'top1' ? 9 : 6.5} fontWeight="bold" fill={c('#7A4A1E')} textAnchor="middle">
            {id === 'top100' ? '100' : id === 'top50' ? '50' : id === 'top10' ? '10' : '1'}
          </SvgText>
          {id === 'top1' && <Star x={0} y={-15} r={3.2} fill={c('#FFF4C2')} />}
        </G>
      );
    case 'seasons4': // Kreis in vier Jahreszeiten-Farben
      return (
        <G>
          <Path d="M0 0 L0 -12 A12 12 0 0 1 12 0 Z" fill={c('#8FD16A')} />
          <Path d="M0 0 L12 0 A12 12 0 0 1 0 12 Z" fill={c('#FFD45E')} />
          <Path d="M0 0 L0 12 A12 12 0 0 1 -12 0 Z" fill={c('#E8833A')} />
          <Path d="M0 0 L-12 0 A12 12 0 0 1 0 -12 Z" fill={c('#CFE6F5')} />
          <Circle cx={0} cy={0} r={4} fill={c('#123826')} stroke={c('#FFF4C2')} strokeWidth={1} />
        </G>
      );
    case 'seasonAll': // Blatt mit Haken
      return (
        <G>
          <Path d="M-10 10 Q-12 -10 11 -12 Q12 9 -10 10 Z" fill={c('#6FBF8A')} />
          <Path d="M-10 10 L6 -6" stroke={c('#2E7D52')} strokeWidth={1.2} />
          <Path d="M-3 1 L1 5 L8 -3" stroke={c('#FFF4C2')} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </G>
      );
    case 'rare': // Diamant
      return (
        <G>
          <Path d="M-11 -4 L-6 -10 H6 L11 -4 L0 11 Z" fill={c('#7FD3E8')} stroke={c('#2C6E86')} strokeWidth={0.8} strokeLinejoin="round" />
          <Path d="M-11 -4 H11 M-6 -10 L-3 -4 L0 11 L3 -4 L6 -10" stroke={c('#2C6E86')} strokeWidth={0.7} fill="none" />
          <Path d="M-4 -8 L-6 -5" stroke="#fff" strokeWidth={1.2} strokeLinecap="round" />
        </G>
      );
    case 'quiz25': // Sprechblase mit Fragezeichen
      return (
        <G>
          <Path d="M-11 -10 H11 Q13 -10 13 -8 V4 Q13 6 11 6 H-2 L-7 11 V6 H-11 Q-13 6 -13 4 V-8 Q-13 -10 -11 -10 Z" fill={c('#FFF4C2')} />
          <SvgText x={0} y={3} fontSize={13} fontWeight="bold" fill={c('#7A4A1E')} textAnchor="middle">
            ?
          </SvgText>
        </G>
      );
    case 'team3': // drei Köpfe
      return (
        <G>
          <Circle cx={-8} cy={-3} r={3.5} fill={c('#CFE6F5')} />
          <Path d="M-14 9 Q-14 1 -8 1 Q-2 1 -2 9 Z" fill={c('#CFE6F5')} />
          <Circle cx={8} cy={-3} r={3.5} fill={c('#CFE6F5')} />
          <Path d="M2 9 Q2 1 8 1 Q14 1 14 9 Z" fill={c('#CFE6F5')} />
          <Circle cx={0} cy={-6} r={4.2} fill={c('#FFD45E')} />
          <Path d="M-7 10 Q-7 0 0 0 Q7 0 7 10 Z" fill={c('#FFD45E')} />
        </G>
      );
    case 'streak30': // große Flamme mit 30
      return (
        <G>
          <Path d="M0 -14 C5 -8 11 -4 11 4 C11 10 6 13 0 13 C-6 13 -11 10 -11 4 C-11 -2 -7 -4 -6 -9 C-3 -6 -1 -4 0 -14 Z" fill={c('#D9433A')} />
          <Path d="M0 -6 C3 -2 7 1 7 6 C7 10 4 12 0 12 C-4 12 -7 10 -7 6 C-7 2 -3 0 0 -6 Z" fill={c('#FFD45E')} />
          <SvgText x={0} y={10} fontSize={8} fontWeight="bold" fill={c('#7A3E17')} textAnchor="middle">
            30
          </SvgText>
        </G>
      );
    case 'breeds5': // Pfote
      return (
        <G fill={c('#FFF3E6')}>
          <Ellipse cx={0} cy={5} rx={7} ry={6} />
          <Ellipse cx={-9} cy={-3} rx={2.8} ry={3.6} />
          <Ellipse cx={-3.5} cy={-9} rx={2.8} ry={3.6} />
          <Ellipse cx={3.5} cy={-9} rx={2.8} ry={3.6} />
          <Ellipse cx={9} cy={-3} rx={2.8} ry={3.6} />
        </G>
      );
    case 'cats5': // Katzenkopf
      return (
        <G>
          <Path d="M-11 -2 L-10 -13 L-3 -7 Z M11 -2 L10 -13 L3 -7 Z" fill={c('#9AA4AE')} />
          <Path d="M-11 -4 Q-11 -9 -4 -8 L4 -8 Q11 -9 11 -4 Q12 9 0 11 Q-12 9 -11 -4 Z" fill={c('#9AA4AE')} />
          <Path d="M-8.5 -9 L-8 -4 L-5 -7 Z M8.5 -9 L8 -4 L5 -7 Z" fill={c('#F2B8B0')} />
          <Ellipse cx={-4.5} cy={-1} rx={1.8} ry={2.4} fill={c('#B5D96A')} />
          <Ellipse cx={4.5} cy={-1} rx={1.8} ry={2.4} fill={c('#B5D96A')} />
          <Path d="M-1.5 3 L1.5 3 L0 4.8 Z" fill={c('#E88A8A')} />
          <Path d="M-3 4 L-11 2.5 M-3 5.5 L-11 6.5 M3 4 L11 2.5 M3 5.5 L11 6.5" stroke={c('#F4F6F8')} strokeWidth={0.7} />
        </G>
      );
    case 'dogs5': // Hundekopf mit Schlappohren
      return (
        <G>
          <Path d="M-8 -6 Q-8 -11 0 -11 Q8 -11 8 -6 L8 4 Q8 11 0 11 Q-8 11 -8 4 Z" fill={c('#D9A86C')} />
          <Path d="M-8 -8 Q-15 -6 -12 5 Q-9 6 -8 1 Z M8 -8 Q15 -6 12 5 Q9 6 8 1 Z" fill={c('#8A5A33')} />
          <Ellipse cx={0} cy={5} rx={4.5} ry={3.6} fill={c('#F3E2C8')} />
          <Circle cx={-3.5} cy={-2} r={1.4} fill={c('#13261C')} />
          <Circle cx={3.5} cy={-2} r={1.4} fill={c('#13261C')} />
          <Ellipse cx={0} cy={3} rx={1.9} ry={1.4} fill={c('#13261C')} />
          <Path d="M-1.4 8 Q0 10 1.4 8" stroke={c('#E07A7A')} strokeWidth={1.2} fill="none" />
        </G>
      );
    case 'farm3': // Hahn
      return (
        <G>
          <Path d="M-2 -12 Q0 -15 2 -12 Q4 -15 5 -11 Q7 -12 6 -8 L-1 -8 Z" fill={c('#D9433A')} />
          <Path d="M-6 9 Q-12 2 -8 -4 Q-5 -9 1 -8 Q6 -7 6 -2 L10 -1 L6 1 Q8 9 -1 11 Q-4 11 -6 9 Z" fill={c('#F4F6F8')} />
          <Path d="M-6 8 Q-14 6 -13 -3 Q-10 2 -6 2 Z" fill={c('#3E8F5E')} />
          <Path d="M6 1 L4 4 L5 1 Z" fill={c('#D9433A')} />
          <Circle cx={3} cy={-4} r={1.1} fill={c('#13261C')} />
          <Path d="M-2 11 L-2 14 M2 11 L2 14" stroke={c('#E8B53A')} strokeWidth={1.4} />
        </G>
      );
    case 'big3': // Hirschgeweih über einem Kopf
      return (
        <G>
          <Path d="M-4 -4 L-8 -12 M-8 -12 L-12 -11 M-8 -12 L-9 -16 M-6 -8 L-11 -7 M4 -4 L8 -12 M8 -12 L12 -11 M8 -12 L9 -16 M6 -8 L11 -7" stroke={c('#F2D7A6')} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M-6 -4 Q0 -7 6 -4 L4 8 Q0 13 -4 8 Z" fill={c('#B7783D')} />
          <Ellipse cx={0} cy={9} rx={3} ry={2.3} fill={c('#3A2416')} />
          <Circle cx={-3} cy={0} r={1.1} fill={c('#13261C')} />
          <Circle cx={3} cy={0} r={1.1} fill={c('#13261C')} />
        </G>
      );
    case 'venom': // Warndreieck
      return (
        <G>
          <Path d="M0 -13 L13 10 L-13 10 Z" fill={c('#FFD45E')} stroke={c('#9A6B12')} strokeWidth={1.4} strokeLinejoin="round" />
          <Path d="M0 -5 L0 3" stroke={c('#13261C')} strokeWidth={2.6} strokeLinecap="round" />
          <Circle cx={0} cy={6.6} r={1.5} fill={c('#13261C')} />
        </G>
      );
    case 'butterfly3': // Schmetterling von der Seite, mit Blüte
      return (
        <G>
          <Path d="M0 -2 Q-12 -16 -12 -4 Q-12 2 0 0 Z" fill={c('#8E6CC9')} />
          <Path d="M0 -2 Q12 -16 12 -4 Q12 2 0 0 Z" fill={c('#8E6CC9')} />
          <Path d="M0 0 Q-9 10 -6 2 Z M0 0 Q9 10 6 2 Z" fill={c('#C9B3EE')} />
          <Circle cx={-7} cy={-6} r={1.6} fill={c('#FFD45E')} />
          <Circle cx={7} cy={-6} r={1.6} fill={c('#FFD45E')} />
          <Path d="M0 -4 L0 6" stroke={c('#13261C')} strokeWidth={1.6} strokeLinecap="round" />
          <Path d="M0 -4 Q-2 -9 -4 -10 M0 -4 Q2 -9 4 -10" stroke={c('#13261C')} strokeWidth={0.8} fill="none" />
          <Circle cx={0} cy={11} r={2.2} fill={c('#E88A8A')} />
        </G>
      );
    case 'spiders5': // Spinne mit Lupe
      return (
        <G>
          <Path d="M-3 0 L-11 -6 M-3 1 L-12 0 M-3 2 L-11 7 M-2 3 L-8 11 M3 0 L11 -6 M3 1 L12 0 M3 2 L11 7 M2 3 L8 11" stroke={c('#E8D3B8')} strokeWidth={1.3} strokeLinecap="round" />
          <Ellipse cx={0} cy={3} rx={4.2} ry={5} fill={c('#C98A5A')} />
          <Circle cx={0} cy={-3} r={2.8} fill={c('#C98A5A')} />
          <Path d="M-1.6 2 L1.6 2 M0 0.5 L0 5" stroke={c('#F4F6F8')} strokeWidth={0.9} />
          <Circle cx={8} cy={-9} r={4} fill="none" stroke={c('#FFD45E')} strokeWidth={1.6} />
          <Path d="M5.2 -6.2 L2 -3" stroke={c('#FFD45E')} strokeWidth={1.8} strokeLinecap="round" />
        </G>
      );
    case 'birds10': // Vogel mit 10
      return (
        <G>
          <Path d="M-11 2 Q-6 -8 3 -6 Q8 -10 12 -7 L8 -4 Q8 6 -2 8 Q-9 8 -11 2 Z" fill={c('#5C9BD1')} />
          <Path d="M-6 -1 Q0 -6 6 -2 Q0 4 -6 -1 Z" fill={c('#2E6EA8')} />
          <Circle cx={6} cy={-6} r={1} fill={c('#13261C')} />
          <Path d="M12 -7 L15 -6 L12 -5 Z" fill={c('#E8B53A')} />
          <SvgText x={0} y={14} fontSize={7.5} fontWeight="bold" fill={c('#FFD45E')} textAnchor="middle">
            10
          </SvgText>
        </G>
      );
    case 'insects10': // Biene mit 10
      return (
        <G>
          <Ellipse cx={-4} cy={-8} rx={4.5} ry={3} fill={c('#E6F2FA')} opacity={0.9} />
          <Ellipse cx={4} cy={-8} rx={4.5} ry={3} fill={c('#E6F2FA')} opacity={0.9} />
          <Ellipse cx={0} cy={-1} rx={8} ry={6} fill={c('#FFD45E')} />
          <Path d="M-3 -6.5 L-3 4.5 M2 -6.5 L2 4.5" stroke={c('#13261C')} strokeWidth={2.2} />
          <Circle cx={-8.5} cy={-2} r={2.6} fill={c('#13261C')} />
          <Path d="M8 -1 L11 -1" stroke={c('#13261C')} strokeWidth={1.4} strokeLinecap="round" />
          <SvgText x={0} y={14} fontSize={7.5} fontWeight="bold" fill={c('#FFD45E')} textAnchor="middle">
            10
          </SvgText>
        </G>
      );
    case 'allgroups': // Krone mit sechs Edelsteinen
      return (
        <G>
          <Path d="M-12 7 L-13 -6 L-6 0 L0 -10 L6 0 L13 -6 L12 7 Z" fill={c('#FFD45E')} stroke={c('#9A6B12')} strokeWidth={1} strokeLinejoin="round" />
          <Path d="M-12 7 H12 V11 H-12 Z" fill={c('#E8B53A')} />
          <Circle cx={-13} cy={-6} r={1.8} fill={c('#D9433A')} />
          <Circle cx={0} cy={-10} r={1.8} fill={c('#3A7CA5')} />
          <Circle cx={13} cy={-6} r={1.8} fill={c('#3E8F5E')} />
          <Circle cx={-6} cy={9} r={1.3} fill={c('#B7832F')} />
          <Circle cx={0} cy={9} r={1.3} fill={c('#5E4E78')} />
          <Circle cx={6} cy={9} r={1.3} fill={c('#8E5E3C')} />
        </G>
      );
  }
}

function Star({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  const pts = Array.from({ length: 10 })
    .map((_, i) => {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.45;
      return `${(x + Math.cos(a) * rr).toFixed(2)},${(y + Math.sin(a) * rr).toFixed(2)}`;
    })
    .join(' ');
  return <Path d={`M${pts}Z`} fill={fill} />;
}
