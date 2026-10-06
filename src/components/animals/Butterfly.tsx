import { Animated, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { useLoop } from '../../hooks/useLoop';

// Zitronenfalter, der mit den Flügeln schlägt und leicht schwebt.
export function Butterfly({ width }: { width: number }) {
  const height = width * 0.8;
  const flap = useLoop(500);
  const float = useLoop(4000);
  const scaleX = flap.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.25, 1] });
  const translateY = float.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -8, 0] });

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Animated.View style={{ transform: [{ translateY }] }}>
        <Animated.View style={{ position: 'absolute', transform: [{ scaleX }] }}>
          <Svg width={width} height={height} viewBox="0 0 30 24">
            <Path d="M15 12Q6 0 2 4Q0 10 15 13Z" fill="#F2D94B" />
            <Path d="M15 13Q4 14 5 20Q9 24 15 14Z" fill="#E8C83A" />
            <Path d="M15 12Q24 0 28 4Q30 10 15 13Z" fill="#F2D94B" />
            <Path d="M15 13Q26 14 25 20Q21 24 15 14Z" fill="#E8C83A" />
            <Circle cx={8} cy={7} r={1.2} fill="#E0703A" />
            <Circle cx={22} cy={7} r={1.2} fill="#E0703A" />
          </Svg>
        </Animated.View>
        <Svg width={width} height={height} viewBox="0 0 30 24">
          <Ellipse cx={15} cy={13} rx={1.2} ry={5} fill="#3A2A1C" />
          <Path d="M14.5 8L12.5 4M15.5 8L17.5 4" stroke="#3A2A1C" strokeWidth={0.6} strokeLinecap="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}
