import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useLoop } from '../hooks/useLoop';
import { colors } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Glühwürmchen, das langsam auf- und abblendet.
function Firefly({ cx, cy, r, delayMs }: { cx: number; cy: number; r: number; delayMs: number }) {
  const t = useLoop(3000, { delayMs, native: false });
  const opacity = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.15, 1] });
  return <AnimatedCircle cx={cx} cy={cy} r={r} opacity={opacity} />;
}

// Dunkler Dschungel-Hintergrund der Startseite (füllt die Fläche, wird ggf. beschnitten).
export function JungleBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.skyTop} />
          <Stop offset="0.6" stopColor={colors.skyMid} />
          <Stop offset="1" stopColor={colors.skyBottom} />
        </LinearGradient>
        <RadialGradient id="glow" cx="0.5" cy="0.15" r="0.55">
          <Stop offset="0" stopColor={colors.accentLight} stopOpacity={0.22} />
          <Stop offset="1" stopColor={colors.accentLight} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={400} height={600} fill="url(#sky)" />
      <Rect width={400} height={600} fill="url(#glow)" />
      <G fill={colors.leafDark}>
        <Ellipse cx={30} cy={80} rx={120} ry={40} transform="rotate(25 30 80)" />
        <Ellipse cx={370} cy={70} rx={120} ry={40} transform="rotate(-25 370 70)" />
        <Ellipse cx={0} cy={330} rx={110} ry={45} transform="rotate(-30 0 330)" />
        <Ellipse cx={400} cy={300} rx={110} ry={45} transform="rotate(30 400 300)" />
      </G>
      <G fill={colors.leafMid}>
        <Path d="M0 600Q60 470 160 520Q90 540 0 600Z" />
        <Path d="M400 600Q340 460 230 520Q320 530 400 600Z" />
        <Path d="M60 600Q150 540 210 600Z" />
      </G>
      <G fill={colors.firefly} opacity={0.7}>
        <Firefly cx={70} cy={380} r={2} delayMs={0} />
        <Firefly cx={330} cy={380} r={1.8} delayMs={1200} />
        <Firefly cx={250} cy={460} r={2} delayMs={2100} />
        <Firefly cx={140} cy={200} r={1.6} delayMs={1200} />
      </G>
    </Svg>
  );
}
