import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { useLoop } from '../../hooks/useLoop';
import { BlinkEye } from './BlinkEye';

const VIEWBOX = '34 470 104 72';
const VB_W = 104;
const VB_H = 72;

// Igel im Gras, hebt ab und zu schnuppernd die Nase.
export function Hedgehog({ width }: { width: number }) {
  const height = (width * VB_H) / VB_W;
  const t = useLoop(4000);
  const rotate = t.interpolate({
    inputRange: [0, 0.8, 0.88, 1],
    outputRange: ['0deg', '0deg', '-2deg', '0deg'],
  });

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox={VIEWBOX}>
        <Ellipse cx={82} cy={534} rx={50} ry={8} fill="#1E5A3C" />
      </Svg>
      <Animated.View
        style={[StyleSheet.absoluteFill, { transformOrigin: 'left bottom', transform: [{ rotate }] }]}
      >
        <Svg width={width} height={height} viewBox={VIEWBOX}>
          <Path d="M48 506l-6-6 9 1-3-9 9 5 0-9 7 7 3-9 5 8 5-8 3 9 7-6-1 9 8-3-4 8z" fill="#5A3F2A" />
          <Path d="M46 520C44 498 62 486 80 488C92 489 100 496 104 506L104 526H50Z" fill="#5A3F2A" />
          <Ellipse cx={76} cy={522} rx={26} ry={9} fill="#7A5A3C" />
          <Ellipse cx={106} cy={518} rx={13} ry={9} fill="#D9B88F" />
          <Circle cx={118} cy={519} r={2.6} fill="#2A1E16" />
          <BlinkEye cx={105} cy={514} r={2} fill="#13261C" />
          <Circle cx={105.7} cy={513.3} r={0.6} fill="#fff" />
          <Path d="M62 529v4M74 530v4M92 528v4" stroke="#2A1E16" strokeWidth={3} strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}
