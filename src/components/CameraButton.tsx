import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useLoop } from '../hooks/useLoop';
import { colors } from '../theme';

const ICON = 78; // Größe des Kamera-Symbols

type Props = { size: number; onPress: () => void };

// Großer runder Kamera-Knopf mit pulsierendem Ring.
export function CameraButton({ size, onPress }: Props) {
  const t = useLoop(2600, { easing: Easing.out(Easing.ease) });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.15] });
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const ring = size + 28;
  const halo = size + 20;
  const inner = size - 10; // Fläche innerhalb des 5px-Rands

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Pulsierender Ring */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.pulse,
          { width: ring, height: ring, borderRadius: ring / 2, opacity, transform: [{ scale }] },
        ]}
      />
      {/* Heller Schein rund um den Knopf */}
      <View
        pointerEvents="none"
        style={[styles.halo, { width: halo, height: halo, borderRadius: halo / 2 }]}
      />
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Foto aufnehmen"
        style={({ pressed }) => [
          styles.button,
          { width: size, height: size, borderRadius: size / 2, transform: [{ scale: pressed ? 0.96 : 1 }] },
        ]}
      >
        {/* Hintergrund-Verlauf und Kamera-Symbol in einer Grafik */}
        <Svg width={inner} height={inner} viewBox={`0 0 ${inner} ${inner}`}>
          <Defs>
            <RadialGradient id="camBg" cx="0.35" cy="0.3" r="0.75">
              <Stop offset="0" stopColor={colors.camInner} />
              <Stop offset="1" stopColor={colors.camOuter} />
            </RadialGradient>
          </Defs>
          <Rect width={inner} height={inner} fill="url(#camBg)" />
          <G
            transform={`translate(${(inner - ICON) / 2} ${(inner - ICON) / 2}) scale(${ICON / 24})`}
            fill="none"
            stroke={colors.accentLight}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
            <Circle cx={12} cy={13.2} r={3.8} />
          </G>
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pulse: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  halo: {
    position: 'absolute',
    backgroundColor: 'rgba(255,210,168,0.16)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 17,
    shadowOffset: { width: 0, height: 14 },
  },
  button: {
    overflow: 'hidden',
    borderWidth: 5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
