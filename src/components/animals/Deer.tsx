import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { useLoop } from '../../hooks/useLoop';
import { BlinkEye } from './BlinkEye';

const VB_W = 70;
const VB_H = 60;

// Reh im Gras, zuckt ab und zu mit dem Ohr.
export function Deer({ width }: { width: number }) {
  const height = (width * VB_H) / VB_W;
  const t = useLoop(5000, { delayMs: 1500 });
  const rotate = t.interpolate({
    inputRange: [0, 0.8, 0.84, 0.88, 0.92, 1],
    outputRange: ['0deg', '0deg', '-18deg', '0deg', '-18deg', '0deg'],
  });

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 70 60">
        {/* Beine */}
        <Path d="M21 36L20 56M26 37L27 56M41 37L40 56M45 36L46 56" stroke="#8A5430" strokeWidth={2.6} strokeLinecap="round" />
        {/* Körper, Hals, Kopf */}
        <Ellipse cx={33} cy={31} rx={17} ry={9} fill="#A8683A" />
        <Ellipse cx={16} cy={29} rx={3.5} ry={5} fill="#F3E7D3" />
        <Path d="M42 28Q45 18 50 13L57 17Q52 25 49 33Z" fill="#A8683A" />
        <Ellipse cx={55} cy={15} rx={7} ry={5} fill="#A8683A" transform="rotate(20 55 15)" />
        <Ellipse cx={60} cy={18.5} rx={3.6} ry={2.6} fill="#8A5430" />
        <Circle cx={62.6} cy={18.6} r={1.3} fill="#13261C" />
        <BlinkEye cx={54} cy={13.5} r={1.4} fill="#13261C" />
        {/* Gras */}
        <Path d="M10 58Q14 50 16 58M30 58Q33 49 36 58M52 58Q56 50 58 58" stroke="#3E8F5E" strokeWidth={2} fill="none" strokeLinecap="round" />
      </Svg>
      {/* Ohr, das zuckt */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <Svg width={width} height={height} viewBox="0 0 70 60">
          <Path d="M51 11L46 2L54 8Z" fill="#A8683A" />
          <Path d="M50.5 9L48 4L52.5 8Z" fill="#7A4A26" />
        </Svg>
      </Animated.View>
    </View>
  );
}
