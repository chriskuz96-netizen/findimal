import { ReactNode, useRef } from 'react';
import { Animated, Easing, PanResponder, StyleSheet, useWindowDimensions } from 'react-native';

// Nach rechts wischen = zurück, irgendwo auf dem Bildschirm (nicht nur am Rand).
// Die Seite folgt dem Finger ein Stück; weit genug oder schnell genug gewischt -> onBack.
export function SwipeBack({ onBack, enabled = true, children }: { onBack: () => void; enabled?: boolean; children: ReactNode }) {
  const { width } = useWindowDimensions();
  const x = useRef(new Animated.Value(0)).current;
  // immer die aktuellen Werte nutzen (der PanResponder wird nur einmal angelegt)
  const state = useRef({ onBack, enabled, width });
  state.current = { onBack, enabled, width };

  const reset = () => Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 18 }).start();

  const pan = useRef(
    PanResponder.create({
      // nur klar waagerechte Bewegungen nach rechts – senkrechtes Scrollen und Tippen bleiben ungestört.
      // "Capture": die Seite prüft die Bewegung vor Knöpfen und Listen darin.
      onMoveShouldSetPanResponderCapture: (_, g) =>
        state.current.enabled && g.dx > 18 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
      onPanResponderTerminationRequest: () => false,
      // die Seite folgt dem Finger genau
      onPanResponderMove: (_, g) => x.setValue(Math.max(0, g.dx)),
      onPanResponderRelease: (_, g) => {
        const w = state.current.width;
        if (g.dx > w * 0.33 || (g.dx > 30 && g.vx > 0.5)) {
          // Rest der Strecke weich weggleiten (schneller gewischt = schneller weg)
          const left = w - Math.max(0, g.dx);
          const duration = Math.max(90, Math.min(260, left / Math.max(g.vx, 1.2)));
          Animated.timing(x, { toValue: w, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
            state.current.onBack();
            x.setValue(0); // falls die Seite bleibt (z. B. wegen einer Anzeige)
          });
        } else {
          reset();
        }
      },
      onPanResponderTerminate: reset,
    }),
  ).current;

  return (
    <Animated.View style={[styles.page, { transform: [{ translateX: x }] }]} {...pan.panHandlers}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // leichter Schatten an der linken Kante, während die Seite zur Seite gleitet
  page: {
    flex: 1,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: -4, height: 0 },
  },
});
