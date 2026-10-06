import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useLoop } from '../../hooks/useLoop';

const VB_W = 50;
const VB_H = 34;

// Weinbergschnecke auf einem Blatt, bewegt ganz langsam die Fühler.
export function Snail({ width }: { width: number }) {
  const height = (width * VB_H) / VB_W;
  const t = useLoop(7000);
  const rotate = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['0deg', '-5deg', '0deg'] });

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 50 34">
        <Path d="M2 31Q25 26 48 30" stroke="#1E5A3C" strokeWidth={3} fill="none" strokeLinecap="round" />
        {/* Körper */}
        <Path d="M6 29Q6 25 12 25L38 25Q44 24 45 19L46 16Q49 18 48 22Q46 29 38 29Z" fill="#C9AE8A" />
        {/* Haus mit Spirale */}
        <Circle cx={22} cy={17} r={10} fill="#A8784A" />
        <Path d="M22 17m-1.5 0a1.5 1.5 0 1 1 3 0a4 4 0 1 1 -7 1a6.5 6.5 0 1 1 13 -2" stroke="#6B4A2A" strokeWidth={1.4} fill="none" strokeLinecap="round" />
      </Svg>
      {/* Fühler */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <Svg width={width} height={height} viewBox="0 0 50 34">
          <Path d="M45 17L43 8M47 17L49 9" stroke="#C9AE8A" strokeWidth={1.4} strokeLinecap="round" />
          <Circle cx={43} cy={8} r={1.3} fill="#5A4A3A" />
          <Circle cx={49} cy={9} r={1.3} fill="#5A4A3A" />
        </Svg>
      </Animated.View>
    </View>
  );
}
