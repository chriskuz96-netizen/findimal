import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

// Findimal-Symbol: Eichhörnchen schaut durch eine große Lupe auf dunklem Waldgrün.
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
      {/* buschiger Schwanz hinter dem Körper */}
      <Path d="M58 92C86 92 96 66 88 44C82 26 64 22 62 36C61 46 72 46 74 40C80 56 76 76 56 82Z" fill="#A8653B" />
      <Path d="M62 86C80 84 88 66 84 50C81 40 72 38 70 42C76 52 76 70 60 78Z" fill="#C98552" />
      {/* Körper und Bauch */}
      <Ellipse cx={44} cy={78} rx={19} ry={16} fill="#B86E3F" />
      <Ellipse cx={44} cy={82} rx={11} ry={11} fill="#F1D3AE" />
      {/* Ohren mit Pinseln */}
      <Path d="M24 38L20 14L38 30Z" fill="#B86E3F" />
      <Path d="M64 38L68 14L50 30Z" fill="#B86E3F" />
      <Path d="M19 20L19 6L22.5 13L25 5L27 15L29 22Z" fill="#8F5733" />
      <Path d="M69 20L69 6L65.5 13L63 5L61 15L59 22Z" fill="#8F5733" />
      <Path d="M26 32L24 20L33 29Z" fill="#7A3E17" />
      {/* Kopf von vorne */}
      <Ellipse cx={44} cy={48} rx={22} ry={19} fill="#B86E3F" />
      <Ellipse cx={28} cy={57} rx={7} ry={5.5} fill="#F1D3AE" />
            {/* linkes Auge */}
      <Ellipse cx={30} cy={45} rx={3.6} ry={4.2} fill="#13261C" />
      <Circle cx={31.2} cy={43.6} r={1.2} fill="#fff" />
      {/* Nase, Mund, Zähne */}
      <Ellipse cx={38} cy={58} rx={3} ry={2.2} fill="#13261C" />
      <Path d="M34 62Q38 65 42 62" stroke="#13261C" strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <Rect x={36.4} y={63.6} width={3.2} height={3.6} rx={0.8} fill="#fff" />
      {/* große Lupe vor dem rechten Auge – das Auge wirkt riesig */}
      <Path d="M71 57L87 79" stroke="#13261C" strokeWidth={7.5} strokeLinecap="round" />
      <Circle cx={58} cy={42} r={20} fill="#D6ECF2" />
      <Ellipse cx={58} cy={43} rx={11} ry={12} fill="#13261C" />
      <Circle cx={62} cy={38} r={4} fill="#fff" />
      <Circle cx={54} cy={48} r={1.8} fill="#fff" />
      <Circle cx={58} cy={42} r={20} fill="none" stroke="#13261C" strokeWidth={7} />
      <Circle cx={58} cy={42} r={20} fill="none" stroke="#E9EEF0" strokeWidth={4.5} />
      <Path d="M44 32Q48 26 55 25" stroke="#fff" strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.8} />
      {/* Pfote hält den Griff */}
      <Ellipse cx={80} cy={70} rx={5.5} ry={4.5} fill="#8F5733" />
    </Svg>
  );
}
