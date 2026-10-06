import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

// Findimal-Symbol: Fuchs schaut durch eine Lupe auf dunklem Waldgrün.
// Wird beim Laden der App gezeigt; als Bild (icon.png) im Zweig design-vorlage.
export function AppLogo({ size, rounded = true }: { size: number; rounded?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id="logoBg" cx="50%" cy="38%" r="70%">
          <Stop offset="0" stopColor="#2F6B47" />
          <Stop offset="1" stopColor="#0F2E1F" />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={100} height={100} rx={rounded ? 22 : 0} fill="url(#logoBg)" />
      {/* Blätter im Hintergrund */}
      <Path d="M-4 88Q14 62 40 70Q22 92 -4 88Z" fill="#1F5639" />
      <Path d="M104 84Q86 60 62 70Q78 92 104 84Z" fill="#1F5639" />
      {/* Ohren */}
      <Path d="M23 44L28 13L48 30Z" fill="#E8833A" />
      <Path d="M77 44L72 13L52 30Z" fill="#E8833A" />
      <Path d="M28 36L31 20L41 30Z" fill="#7A3E17" />
      <Path d="M72 36L69 20L59 30Z" fill="#7A3E17" />
      {/* Kopf */}
      <Path d="M18 44Q18 27 36 27L64 27Q82 27 82 44Q82 62 50 80Q18 62 18 44Z" fill="#E8833A" />
      {/* helle Wangen und Schnauze */}
      <Path d="M18 44Q30 54 44 58Q48 66 50 80Q24 66 18 44Z" fill="#FFF3E6" />
      <Path d="M82 44Q70 54 56 58Q52 66 50 80Q76 66 82 44Z" fill="#FFF3E6" />
      {/* Augen */}
      <Ellipse cx={37} cy={46} rx={3.6} ry={4.4} fill="#13261C" />
      <Circle cx={38.2} cy={44.5} r={1.2} fill="#fff" />
      {/* Nase */}
      <Ellipse cx={50} cy={76} rx={4.6} ry={3.4} fill="#13261C" />
      {/* Lupe vor dem rechten Auge – das Auge wirkt größer */}
      <Path d="M73 56L86 73" stroke="#13261C" strokeWidth={6} strokeLinecap="round" />
      <Circle cx={64} cy={46} r={13} fill="#D6ECF2" />
      <Ellipse cx={64} cy={46.5} rx={6.5} ry={7.5} fill="#13261C" />
      <Circle cx={66.5} cy={43.5} r={2.4} fill="#fff" />
      <Circle cx={61.5} cy={50} r={1.1} fill="#fff" />
      <Circle cx={64} cy={46} r={13} fill="none" stroke="#13261C" strokeWidth={5.5} />
      <Circle cx={64} cy={46} r={13} fill="none" stroke="#E9EEF0" strokeWidth={3.4} />
      <Path d="M55.5 40Q58 35.5 63 35" stroke="#fff" strokeWidth={1.8} fill="none" strokeLinecap="round" opacity={0.8} />
      {/* Pfote hält den Griff */}
      <Ellipse cx={80} cy={66} rx={4.5} ry={3.6} fill="#C86A28" />
    </Svg>
  );
}
