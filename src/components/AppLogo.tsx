import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

// Findimal-Symbol: Igel schaut durch eine große Lupe auf dunklem Waldgrün.
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
      {/* Stacheln rund um den Igel */}
      <Path
        d="M86.0 60.0L76.6 64.8L84.0 72.4L73.6 74.1L78.4 83.5L67.9 81.9L69.5 92.4L60.1 87.6L58.4 98.0L50.8 90.6L46.0 100.0L41.2 90.6L33.6 98.0L31.9 87.6L22.5 92.4L24.1 81.9L13.6 83.5L18.4 74.1L8.0 72.4L15.4 64.8L6.0 60.0L15.4 55.2L8.0 47.6L18.4 45.9L13.6 36.5L24.1 38.1L22.5 27.6L31.9 32.4L33.6 22.0L41.2 29.4L46.0 20.0L50.8 29.4L58.4 22.0L60.1 32.4L69.5 27.6L67.9 38.1L78.4 36.5L73.6 45.9L84.0 47.6L76.6 55.2Z"
        fill="#4A3324"
      />
      <Path
        d="M78.8 63.3L71.0 67.0L75.7 74.3L67.1 75.2L69.0 83.6L60.6 81.5L59.6 90.1L52.4 85.2L48.5 92.9L43.4 85.9L37.1 91.8L34.7 83.4L26.7 86.8L27.4 78.1L18.7 78.6L22.3 70.7L14.0 68.1L20.1 61.9L13.2 56.7L21.0 53.0L16.3 45.7L24.9 44.8L23.0 36.4L31.4 38.5L32.4 29.9L39.6 34.8L43.5 27.1L48.6 34.1L54.9 28.2L57.3 36.6L65.3 33.2L64.6 41.9L73.3 41.4L69.7 49.3L78.0 51.9L71.9 58.1Z"
        fill="#7A5A3E"
      />
      {/* Ohren */}
      <Circle cx={28} cy={40} r={5.5} fill="#E2BE94" />
      <Circle cx={28} cy={40} r={3} fill="#B98A62" />
      <Circle cx={64} cy={40} r={5.5} fill="#E2BE94" />
      {/* helles Gesicht und Bauch */}
      <Ellipse cx={46} cy={86} rx={17} ry={10} fill="#E2BE94" />
      <Ellipse cx={46} cy={60} rx={22} ry={20} fill="#F0D3AE" />
      {/* linkes Auge */}
      <Ellipse cx={32} cy={56} rx={3.6} ry={4.2} fill="#13261C" />
      <Circle cx={33.2} cy={54.6} r={1.2} fill="#fff" />
      {/* Wangen, Nase, Mund */}
      <Ellipse cx={29} cy={65} rx={4} ry={2.6} fill="#E8A08A" opacity={0.7} />
      <Ellipse cx={44} cy={70} rx={4} ry={3} fill="#13261C" />
      <Circle cx={42.8} cy={69} r={1} fill="#fff" opacity={0.7} />
      <Path d="M39 75Q44 78 49 75" stroke="#13261C" strokeWidth={1.4} fill="none" strokeLinecap="round" />
      {/* große Lupe vor dem rechten Auge – das Auge wirkt riesig */}
      <Path d="M72 62L88 84" stroke="#13261C" strokeWidth={7.5} strokeLinecap="round" />
      <Circle cx={59} cy={48} r={19} fill="#D6ECF2" />
      <Ellipse cx={59} cy={49} rx={10.5} ry={11.5} fill="#13261C" />
      <Circle cx={63} cy={44} r={4} fill="#fff" />
      <Circle cx={55} cy={54} r={1.8} fill="#fff" />
      <Circle cx={59} cy={48} r={19} fill="none" stroke="#13261C" strokeWidth={7} />
      <Circle cx={59} cy={48} r={19} fill="none" stroke="#E9EEF0" strokeWidth={4.5} />
      <Path d="M46 39Q50 33 57 32" stroke="#fff" strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.8} />
      {/* Pfote hält den Griff */}
      <Ellipse cx={81} cy={74} rx={5} ry={4} fill="#B98A62" />
    </Svg>
  );
}
