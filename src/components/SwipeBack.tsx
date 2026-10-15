import { ComponentProps, createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, NativeGesture } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

// Scrollen der Seite: läuft gleichzeitig mit der Wischgeste, statt auf sie zu warten (sonst ruckelt es).
// Sobald das Zurückwischen erkannt ist, steht das Scrollen still (locked).
const ScrollGesture = createContext<{ native: NativeGesture; locked: boolean } | null>(null);

// ScrollView für Seiten in SwipeBack – scrollt flüssig, auch wenn man leicht schräg wischt
export function SwipeScrollView(props: ComponentProps<typeof ScrollView>) {
  const ctx = useContext(ScrollGesture);
  if (!ctx) return <ScrollView {...props} />;
  return (
    <GestureDetector gesture={ctx.native}>
      <ScrollView {...props} scrollEnabled={!ctx.locked && props.scrollEnabled !== false} />
    </GestureDetector>
  );
}

// Nach rechts wischen = zurück, irgendwo auf dem Bildschirm (nicht nur am Rand).
// Die Geste und die Bewegung laufen direkt auf dem Bildschirm-Thread (nicht über JavaScript),
// deshalb folgt die Seite dem Finger ohne Ruckeln. Weit genug oder schnell genug gewischt -> onBack.
export function SwipeBack({ onBack, enabled = true, children }: { onBack: () => void; enabled?: boolean; children: ReactNode }) {
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  // immer die aktuelle Funktion nutzen
  const back = useRef(onBack);
  back.current = onBack;
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );

  const done = () => {
    back.current();
    // Seite bleibt draußen, bis sie verschwunden ist – sonst blitzt sie kurz wieder auf.
    // Nur wenn sie danach noch da ist (z. B. wegen einer Anzeige), zurückholen.
    setTimeout(() => {
      if (mounted.current) x.value = 0;
    }, 400);
  };

  const native = useMemo(() => Gesture.Native(), []);
  const [locked, setLocked] = useState(false);
  const scroll = useMemo(() => ({ native, locked }), [native, locked]);
  const pan = Gesture.Pan()
    .enabled(enabled)
    .simultaneousWithExternalGesture(native)
    // nur klar waagerechte Bewegungen nach rechts – senkrechtes Scrollen und Tippen bleiben ungestört
    .activeOffsetX(18)
    .failOffsetX(-12)
    .failOffsetY([-14, 14])
    // Zurückwischen erkannt: Seite nicht mehr hoch und runter scrollen lassen
    .onStart(() => {
      scheduleOnRN(setLocked, true);
    })
    .onFinalize(() => {
      scheduleOnRN(setLocked, false);
    })
    .onUpdate((e) => {
      x.value = Math.max(0, e.translationX);
    })
    .onEnd((e) => {
      const dx = Math.max(0, e.translationX);
      if (dx > width * 0.33 || (dx > 30 && e.velocityX > 500)) {
        // Rest der Strecke weich weggleiten (schneller gewischt = schneller weg)
        const duration = Math.max(90, Math.min(260, ((width - dx) / Math.max(e.velocityX, 1200)) * 1000));
        x.value = withTiming(width, { duration, easing: Easing.out(Easing.cubic) }, (finished) => {
          if (finished) scheduleOnRN(done);
        });
      } else {
        x.value = withSpring(0, { damping: 28, stiffness: 320, overshootClamping: true });
      }
    });

  const moving = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.page, moving]}>
        {/* schmaler Schatten links neben der Seite – nur beim Wischen sichtbar, kostet fast nichts */}
        <View pointerEvents="none" style={styles.shadow}>
          <Svg width={16} height="100%">
            <Defs>
              <LinearGradient id="swipeShadow" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#000" stopOpacity={0} />
                <Stop offset="1" stopColor="#000" stopOpacity={0.16} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={16} height="100%" fill="url(#swipeShadow)" />
          </Svg>
        </View>
        <ScrollGesture.Provider value={scroll}>{children}</ScrollGesture.Provider>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  shadow: { position: 'absolute', top: 0, bottom: 0, left: -16, width: 16 },
});
