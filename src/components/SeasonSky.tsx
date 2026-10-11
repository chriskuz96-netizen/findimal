import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import { SeasonId } from '../season';

// Kopf der Saison-Seite: Farbe, großes Symbol und sanft fallende Teilchen passend zur Jahreszeit.
// Volle Farben statt Verläufe (Verläufe wurden auf dem iPhone nicht ganz gestreckt).
export const SEASON_LOOK: Record<SeasonId, { bg: string; accent: string; light: string }> = {
  spring: { bg: '#2B6340', accent: '#F49CBB', light: '#FFD9E6' },
  summer: { bg: '#1E5A3C', accent: '#F6C945', light: '#FFE9A8' },
  autumn: { bg: '#5E3A1C', accent: '#E8833A', light: '#FFD2A8' },
  winter: { bg: '#1D3F57', accent: '#8FCDEB', light: '#D6EEFA' },
};

const COUNT = 9;

export function SeasonSky({ season }: { season: SeasonId }) {
  const look = SEASON_LOOK[season];
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: look.bg }]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {/* großes Symbol rechts, halb durchsichtig */}
      <View style={styles.big}>
        <BigIcon season={season} color={look.accent} />
      </View>
      {size.w > 0 && Array.from({ length: COUNT }, (_, i) => <Particle key={`${season}-${i}`} i={i} season={season} w={size.w} h={size.h} />)}
    </View>
  );
}

// Ein Teilchen: Blüte, Pollen, Blatt oder Schneeflocke – fällt (Sommer: steigt) langsam und schwingt leicht
function Particle({ i, season, w, h }: { i: number; season: SeasonId; w: number; h: number }) {
  const t = useRef(new Animated.Value(0)).current;
  const cfg = useMemo(() => {
    const r = (n: number) => ((Math.sin((i + 1) * n) + 1) / 2); // feste „Zufallswerte“ pro Teilchen
    return {
      x: r(12.9898) * w,
      size: 9 + r(78.233) * 9,
      dur: 7000 + r(3.7) * 6000,
      delay: r(5.1) * 6000,
      sway: 10 + r(9.3) * 18,
      spin: (r(2.2) < 0.5 ? -1 : 1) * (120 + r(4.4) * 240),
    };
  }, [i, w]);
  useEffect(() => {
    t.setValue(0);
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: cfg.dur, easing: Easing.linear, useNativeDriver: true }));
    const start = setTimeout(() => loop.start(), cfg.delay);
    return () => {
      clearTimeout(start);
      loop.stop();
    };
  }, [t, cfg]);
  const up = season === 'summer';
  const y = t.interpolate({ inputRange: [0, 1], outputRange: up ? [h + 10, -20] : [-20, h + 10] });
  const x = t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, cfg.sway, 0, -cfg.sway, 0] });
  const rot = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${cfg.spin}deg`] });
  const opacity = t.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 0.9, 0.9, 0] });
  return (
    <Animated.View
      style={{ position: 'absolute', left: cfg.x, top: 0, opacity, transform: [{ translateY: y }, { translateX: x }, { rotate: rot }] }}
    >
      <Bit season={season} size={cfg.size} i={i} />
    </Animated.View>
  );
}

const LEAVES = ['#E8833A', '#C9533B', '#F2B84B', '#A8642A'];

function Bit({ season, size, i }: { season: SeasonId; size: number; i: number }) {
  const look = SEASON_LOOK[season];
  if (season === 'autumn')
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 2C18 6 20 14 12 22 4 14 6 6 12 2Z" fill={LEAVES[i % LEAVES.length]} />
        <Path d="M12 6v16" stroke="rgba(0,0,0,0.25)" strokeWidth={1.2} />
      </Svg>
    );
  if (season === 'winter')
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <G stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round">
          {[0, 60, 120].map((a) => (
            <Line key={a} x1={12} y1={3} x2={12} y2={21} transform={`rotate(${a} 12 12)`} />
          ))}
        </G>
      </Svg>
    );
  if (season === 'spring')
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        {[0, 72, 144, 216, 288].map((a) => (
          <Circle key={a} cx={12} cy={6.5} r={4.2} fill={i % 2 ? '#FFFFFF' : look.accent} transform={`rotate(${a} 12 12)`} />
        ))}
        <Circle cx={12} cy={12} r={2.6} fill="#F6C945" />
      </Svg>
    );
  // Sommer: kleine leuchtende Pollen
  return (
    <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11} fill={look.accent} opacity={0.35} />
      <Circle cx={12} cy={12} r={5} fill={look.light} />
    </Svg>
  );
}

function BigIcon({ season, color }: { season: SeasonId; color: string }) {
  const s = 150;
  if (season === 'summer')
    return (
      <Svg width={s} height={s} viewBox="0 0 100 100" opacity={0.3}>
        <Circle cx={50} cy={50} r={22} fill={color} />
        <G stroke={color} strokeWidth={6} strokeLinecap="round">
          {Array.from({ length: 10 }, (_, k) => (
            <Line key={k} x1={50} y1={10} x2={50} y2={20} transform={`rotate(${k * 36} 50 50)`} />
          ))}
        </G>
      </Svg>
    );
  if (season === 'winter')
    return (
      <Svg width={s} height={s} viewBox="0 0 100 100" opacity={0.25}>
        <G stroke={color} strokeWidth={5} strokeLinecap="round">
          {[0, 60, 120].map((a) => (
            <G key={a} transform={`rotate(${a} 50 50)`}>
              <Line x1={50} y1={8} x2={50} y2={92} />
              <Line x1={50} y1={22} x2={40} y2={12} />
              <Line x1={50} y1={22} x2={60} y2={12} />
              <Line x1={50} y1={78} x2={40} y2={88} />
              <Line x1={50} y1={78} x2={60} y2={88} />
            </G>
          ))}
        </G>
      </Svg>
    );
  if (season === 'spring')
    return (
      <Svg width={s} height={s} viewBox="0 0 100 100" opacity={0.3}>
        {[0, 72, 144, 216, 288].map((a) => (
          <Circle key={a} cx={50} cy={27} r={17} fill={color} transform={`rotate(${a} 50 50)`} />
        ))}
        <Circle cx={50} cy={50} r={11} fill="#F6C945" />
      </Svg>
    );
  return (
    <Svg width={s} height={s} viewBox="0 0 100 100" opacity={0.28}>
      <Path d="M50 6C78 22 86 58 50 94 14 58 22 22 50 6Z" fill={color} />
      <Path d="M50 22v72M50 44l-14-10M50 44l14-10M50 62l-16-10M50 62l16-10" stroke="rgba(0,0,0,0.35)" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  big: { position: 'absolute', right: -28, top: 12, transform: [{ rotate: '-12deg' }] },
});
