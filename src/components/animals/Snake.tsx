import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { useLoop } from '../../hooks/useLoop';

const VB_W = 80;
const VB_H = 30;

// Ringelnatter (gelbe Flecken am Kopf), züngelt ab und zu.
export function Snake({ width }: { width: number }) {
  const height = (width * VB_H) / VB_W;
  const t = useLoop(3800, { delayMs: 400 });
  const opacity = t.interpolate({
    inputRange: [0, 0.5, 0.53, 0.58, 0.61, 0.66, 0.69, 1],
    outputRange: [0, 0, 1, 1, 0, 0, 1, 0],
  });

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 80 30">
        <Path d="M4 24Q14 12 25 21T46 20T62 16" stroke="#56634A" strokeWidth={6} fill="none" strokeLinecap="round" />
        <Path d="M4 24Q14 12 25 21T46 20T62 16" stroke="#6F7D5E" strokeWidth={2} fill="none" strokeLinecap="round" strokeDasharray="2 4" />
        <Circle cx={61} cy={16} r={3.4} fill="#F2D04B" />
        <Ellipse cx={67} cy={15} rx={5.5} ry={3.8} fill="#56634A" />
        <Circle cx={68.5} cy={13.8} r={1.1} fill="#13261C" />
      </Svg>
      {/* Zunge */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
        <Svg width={width} height={height} viewBox="0 0 80 30">
          <Path d="M72 15.5L76 15.5M76 15.5L78.5 14M76 15.5L78.5 17" stroke="#C8343A" strokeWidth={1} strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}
