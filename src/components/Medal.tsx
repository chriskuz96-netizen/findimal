import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { BadgeId } from '../progress';

// Medaillen-Farben: Bronze, Silber, Gold
const TIERS = {
  bronze: { light: '#F2C08A', mid: '#C7803F', dark: '#7A4A1E' },
  silver: { light: '#F4F6F8', mid: '#B9C2CB', dark: '#6B7681' },
  gold: { light: '#FFE9A3', mid: '#E8B53A', dark: '#9A6B12' },
};
const GREY = { light: '#C9CFC9', mid: '#9AA29B', dark: '#6B736C' };

export const BADGE_TIER: Record<BadgeId, keyof typeof TIERS> = {
  first: 'bronze',
  streak3: 'bronze',
  insects5: 'bronze',
  night: 'silver',
  birds5: 'silver',
  species10: 'silver',
  streak7: 'gold',
  species25: 'gold',
  allgroups: 'gold',
};

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
    case 'streak3':
    case 'streak7': // Flamme mit Zahl
      return (
        <G>
          <Path
            d="M0 13 C-8 13 -11 7 -10 2 C-9 -3 -5 -5 -4 -11 C-1 -8 1 -6 1 -3 C3 -6 4 -9 3 -13 C9 -9 11 -3 10 3 C9 9 6 13 0 13 Z"
            fill={`url(#flame-${g})`}
          />
          <Path d="M0 12 C-4 12 -5 8 -4 5 C-3 2 -1 1 0 -2 C2 1 4 3 4 6 C4 9 3 12 0 12 Z" fill={c('#FFF1B8')} />
          <SvgText x={0} y={11} fontSize={10} fontWeight="bold" fill={c('#7A3B10')} textAnchor="middle">
            {id === 'streak3' ? '3' : '7'}
          </SvgText>
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
    case 'species25': // Schmetterling mit Zahl
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
            {id === 'species10' ? '10' : '25'}
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
