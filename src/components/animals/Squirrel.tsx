import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { useLoop } from '../../hooks/useLoop';

const VIEWBOX = '250 135 150 75';
const VB_W = 150;
const VB_H = 75;

// Eichhörnchen auf einem Ast, macht ab und zu einen kleinen Hüpfer.
export function Squirrel({ width }: { width: number }) {
  const height = (width * VB_H) / VB_W;
  const unit = width / VB_W;
  const t = useLoop(3500);
  const translateY = t.interpolate({
    inputRange: [0, 0.7, 0.78, 0.86, 1],
    outputRange: [0, 0, -6 * unit, 0, 0],
  });

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox={VIEWBOX}>
        <Path d="M250 205Q320 192 400 190" stroke="#3A2A1C" strokeWidth={7} fill="none" strokeLinecap="round" />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY }] }]}>
        <Svg width={width} height={height} viewBox={VIEWBOX}>
          <Path d="M306 197C284 186 280 152 298 146C314 141 320 160 307 167C300 172 300 184 312 190Z" fill="#8F5733" />
          <Ellipse cx={322} cy={182} rx={12} ry={15} fill="#A8653B" />
          <Ellipse cx={325} cy={187} rx={6} ry={8} fill="#D9B08C" />
          <Circle cx={331} cy={165} r={9} fill="#A8653B" />
          <Path d="M326 158l1-9 6 6z" fill="#A8653B" />
          <Circle cx={334} cy={164} r={2.2} fill="#13261C" />
          <Circle cx={334.8} cy={163.3} r={0.7} fill="#fff" />
          <Circle cx={339.5} cy={167.5} r={1.4} fill="#3A2A1C" />
          <Path d="M316 196l-2 5M326 196l2 5" stroke="#3A2A1C" strokeWidth={2.5} />
        </Svg>
      </Animated.View>
    </View>
  );
}
