import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { useI18n } from '../i18n';
import { colors, fonts } from '../theme';
import { levelTitle } from '../progress';

// Große Feier bei einer neuen Stufe: Konfetti, die neue Stufe springt groß auf, darunter der Rang.
// Verschwindet nach knapp 4 Sekunden von selbst (oder früher per Tippen).
// Jede Stufe wird nur einmal gefeiert (egal ob auf der Ergebnisseite oder bei Challenges)
const KEY = 'findimal-level-party';
export async function claimParty(level: number): Promise<boolean> {
  try {
    const last = Number((await AsyncStorage.getItem(KEY)) ?? 1) || 1;
    if (level <= last) return false;
    await AsyncStorage.setItem(KEY, String(level));
    return true;
  } catch {
    return false;
  }
}

const CONFETTI = ['#E8833A', '#F2B36B', '#6FBF8A', '#FFFFFF', '#F6D55C', '#8FD3A8'];

export function LevelUp({ level, onClose }: { level: number | null; onClose: () => void }) {
  const { t } = useI18n();
  const { width, height } = useWindowDimensions();
  const fade = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(0)).current;
  const rays = useRef(new Animated.Value(0)).current;
  const fall = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  // Konfetti: feste Zufallswerte pro Feier
  const pieces = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        x: Math.random() * width,
        drift: (Math.random() - 0.5) * 120,
        delay: Math.random() * 0.35,
        spin: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
        w: 6 + Math.random() * 6,
        h: 10 + Math.random() * 8,
        color: CONFETTI[i % CONFETTI.length],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [level],
  );

  useEffect(() => {
    if (level === null) return;
    fade.setValue(0);
    pop.setValue(0);
    fall.setValue(0);
    text.setValue(0);
    rays.setValue(0);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.sequence([Animated.delay(150), Animated.spring(pop, { toValue: 1, friction: 4, tension: 70, useNativeDriver: true })]),
      Animated.sequence([Animated.delay(450), Animated.timing(text, { toValue: 1, duration: 400, useNativeDriver: true })]),
      Animated.timing(fall, { toValue: 1, duration: 3200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.loop(Animated.timing(rays, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })),
    ]).start();
  }, [level, fade, pop, fall, text, rays]);

  // von selbst ausblenden, wenn das Konfetti unten ist
  const closing = useRef(false);
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(fade, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
      closing.current = false;
      onClose();
    });
  };
  useEffect(() => {
    if (level === null) return;
    const timer = setTimeout(close, 3800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  if (level === null) return null;
  const rise = text.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Modal visible transparent animationType="none" onRequestClose={close}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.back, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel={t('lvl.ok')} />
        {/* Konfetti fällt von oben */}
        {pieces.map((c, i) => {
          const start = Math.min(c.delay, 0.3);
          const y = fall.interpolate({ inputRange: [0, start, 1], outputRange: [-40, -40, height + 40] });
          const x = fall.interpolate({ inputRange: [0, 1], outputRange: [0, c.drift] });
          const r = fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${c.spin}deg`] });
          return (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: c.x,
                top: 0,
                width: c.w,
                height: c.h,
                borderRadius: 2,
                backgroundColor: c.color,
                transform: [{ translateY: y }, { translateX: x }, { rotate: r }],
              }}
            />
          );
        })}
        <View style={styles.center} pointerEvents="box-none">
          <View style={styles.medal}>
          {/* leuchtender Kranz hinter der Zahl, dreht sich langsam */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.rays,
              { transform: [{ scale: pop }, { rotate: rays.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] },
            ]}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <View key={i} style={[styles.ray, { transform: [{ rotate: `${i * 30}deg` }, { translateY: -78 }] }]} />
            ))}
          </Animated.View>
          <Animated.View style={[styles.badge, { transform: [{ scale: pop }] }]}>
            <Text style={styles.badgeNum}>{level}</Text>
          </Animated.View>
          </View>
          <Animated.View style={{ alignItems: 'center', opacity: text, transform: [{ translateY: rise }] }}>
            <Text style={styles.kicker}>{t('lvl.up')}</Text>
            <Text style={styles.caps}>{t('ch.level', { n: level })}</Text>
            <Text style={styles.name}>{levelTitle(level, t)}</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  back: { backgroundColor: 'rgba(10,36,24,0.95)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  medal: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  rays: { position: 'absolute', left: -50, top: -50, width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  ray: { position: 'absolute', width: 8, height: 34, borderRadius: 4, backgroundColor: 'rgba(242,179,107,0.55)' },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accent,
    borderWidth: 5,
    borderColor: '#F6D55C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F2B36B',
    shadowOpacity: 0.8,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  badgeNum: { fontFamily: fonts.serifBold, fontSize: 60, color: colors.white, marginTop: -4 },
  kicker: { fontFamily: fonts.serifBold, fontSize: 30, color: colors.white, textAlign: 'center' },
  caps: { fontFamily: fonts.sansBold, fontSize: 14, letterSpacing: 2, color: colors.accentLight, marginTop: 14, textTransform: 'uppercase' },
  name: { fontFamily: fonts.serifBold, fontSize: 28, color: colors.white, marginTop: 2, textAlign: 'center' },
});
