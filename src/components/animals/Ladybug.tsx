import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { useLoop } from '../../hooks/useLoop';

const VIEWBOX = '0 172 130 80';
const VB_W = 130;
const VB_H = 80;

// Marienkäfer auf einem Blatt, krabbelt langsam hin und her.
export function Ladybug({ width }: { width: number }) {
  const height = (width * VB_H) / VB_W;
  const unit = width / VB_W;
  const t = useLoop(9000);
  const translateX = t.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 10 * unit, 0],
    easing: Easing.inOut(Easing.ease),
  });

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox={VIEWBOX}>
        <Ellipse cx={62} cy={222} rx={64} ry={18} transform="rotate(-12 62 222)" fill="#1E5A3C" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <Svg width={width} height={height} viewBox={VIEWBOX}>
          <G transform="rotate(-12 70 196)">
            <Path d="M58 202l-5 4M64 205l-2 5M76 205l2 5M82 202l5 4" stroke="#2A1E16" strokeWidth={1.6} />
            <Circle cx={84} cy={196} r={6} fill="#2A1E16" />
            <Ellipse cx={70} cy={196} rx={14} ry={11} fill="#A9443A" />
            <Path d="M70 185v22" stroke="#2A1E16" strokeWidth={1.4} />
            <Circle cx={64} cy={192} r={2.3} fill="#2A1E16" />
            <Circle cx={76} cy={192} r={2.3} fill="#2A1E16" />
            <Circle cx={63} cy={200} r={2} fill="#2A1E16" />
            <Circle cx={77} cy={200} r={2} fill="#2A1E16" />
            <Circle cx={86} cy={194.5} r={0.9} fill="#F1EEDC" />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}
