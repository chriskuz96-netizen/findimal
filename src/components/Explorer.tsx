import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';

import { colors } from '../theme';

// Runde Medaille mit der Forscher-Figur (Hut und Lupe), wie "#prof" im Entwurf.
export function Explorer({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <RadialGradient id="medal" cx="0.4" cy="0.35" r="0.5">
          <Stop offset="0" stopColor={colors.accentLight} />
          <Stop offset="1" stopColor={colors.accent} />
        </RadialGradient>
      </Defs>
      <Circle cx={32} cy={32} r={31} fill="url(#medal)" />
      <Circle cx={32} cy={32} r={29} fill="none" stroke={colors.accentDark} strokeWidth={2} />
      <Path d="M12 62Q12 44 28 41H36Q52 44 52 62Z" fill="#0F2A1E" />
      <Circle cx={32} cy={31} r={10} fill="#0F2A1E" />
      <Ellipse cx={32} cy={21} rx={17} ry={3.5} fill="#0F2A1E" />
      <Path d="M22 21Q23 9 32 9Q41 9 42 21Z" fill="#0F2A1E" />
      <Circle cx={47} cy={40} r={6} fill="none" stroke="#0F2A1E" strokeWidth={3} />
      <Path d="M43 45L38 52" stroke="#0F2A1E" strokeWidth={3.5} strokeLinecap="round" />
    </Svg>
  );
}
