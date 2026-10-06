import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { useLoop } from '../../hooks/useLoop';
import { BlinkEye } from './BlinkEye';

const VB_W = 60;
const VB_H = 40;

// Rotkehlchen auf einem Zweig, pickt ab und zu nach vorne.
export function Robin({ width }: { width: number }) {
  const height = (width * VB_H) / VB_W;
  const t = useLoop(4200, { delayMs: 800 });
  const rotate = t.interpolate({
    inputRange: [0, 0.6, 0.66, 0.72, 0.78, 1],
    outputRange: ['0deg', '0deg', '-14deg', '0deg', '-14deg', '0deg'],
  });

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 60 40">
        <Path d="M0 35Q30 30 60 34" stroke="#3A2A1C" strokeWidth={3} fill="none" strokeLinecap="round" />
        <Path d="M30 31L29 34M34 31L35 34" stroke="#3A2A1C" strokeWidth={1.4} strokeLinecap="round" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <Svg width={width} height={height} viewBox="0 0 60 40">
          <Path d="M40 21L55 16L53 23Z" fill="#6B5440" />
          <Ellipse cx={32} cy={22} rx={13} ry={10} fill="#7A6048" />
          <Ellipse cx={25} cy={23} rx={8} ry={8} fill="#E0703A" />
          <Ellipse cx={31} cy={28} rx={7} ry={3.5} fill="#EFE6D8" />
          <Circle cx={22} cy={15} r={7} fill="#7A6048" />
          <Circle cx={20} cy={17.5} r={5} fill="#E0703A" />
          <BlinkEye cx={19.5} cy={14} r={1.5} fill="#13261C" />
          <Path d="M15 15L10 16.5L15 17.5Z" fill="#2A2A2A" />
        </Svg>
      </Animated.View>
    </View>
  );
}
