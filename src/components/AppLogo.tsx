import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

// Findimal-Symbol: kleiner Fuchs mit Lupe auf dunklem Waldgrün.
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
      <Ellipse cx={63} cy={46} rx={3.6} ry={4.4} fill="#13261C" />
      <Circle cx={38.2} cy={44.5} r={1.2} fill="#fff" />
      <Circle cx={64.2} cy={44.5} r={1.2} fill="#fff" />
      {/* Nase */}
      <Ellipse cx={50} cy={76} rx={4.6} ry={3.4} fill="#13261C" />
      {/* Lupe */}
      <Circle cx={74} cy={72} r={11} fill="rgba(255,243,230,0.18)" stroke="#FFD2A8" strokeWidth={4} />
      <Path d="M82 80L91 89" stroke="#FFD2A8" strokeWidth={5.5} strokeLinecap="round" />
    </Svg>
  );
}
