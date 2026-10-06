import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

// Findimal-Symbol: Eichhörnchen mit Lupe auf dunklem Waldgrün.
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
      {/* buschiger Schwanz */}
      <Path d="M44 84C16 86 6 58 16 38C24 22 46 18 48 34C49 44 38 46 35 39C31 52 34 68 48 74Z" fill="#A8653B" />
      <Path d="M40 78C22 76 16 58 22 44C27 34 38 32 41 38C33 44 32 62 44 72Z" fill="#C98552" />
      {/* Körper und Bauch */}
      <Ellipse cx={58} cy={66} rx={15} ry={18} fill="#B86E3F" />
      <Ellipse cx={63} cy={70} rx={8} ry={12} fill="#F1D3AE" />
      {/* Füße */}
      <Ellipse cx={52} cy={84} rx={7} ry={3.5} fill="#8F5733" />
      <Ellipse cx={67} cy={84} rx={7} ry={3.5} fill="#8F5733" />
      {/* Kopf mit Ohr */}
      <Path d="M55 32L55 16L65 28Z" fill="#B86E3F" />
      <Path d="M57 29L57.5 21L62 27Z" fill="#7A3E17" />
      <Circle cx={63} cy={40} r={13} fill="#B86E3F" />
      <Ellipse cx={72} cy={45} rx={7} ry={5.5} fill="#C98552" />
      <Ellipse cx={74} cy={47} rx={3.5} ry={2.5} fill="#F1D3AE" />
      <Circle cx={67} cy={37} r={3} fill="#13261C" />
      <Circle cx={68} cy={36} r={1} fill="#fff" />
      <Circle cx={78.5} cy={44} r={1.8} fill="#13261C" />
      {/* Lupe in den Pfoten */}
      <Path d="M74 70L67 75" stroke="#FFD2A8" strokeWidth={4.5} strokeLinecap="round" />
      <Circle cx={81} cy={63} r={9} fill="rgba(255,243,230,0.22)" stroke="#FFD2A8" strokeWidth={3.5} />
      <Ellipse cx={68} cy={73} rx={4} ry={3} fill="#8F5733" />
    </Svg>
  );
}
