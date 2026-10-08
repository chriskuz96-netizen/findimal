import { ReactNode, useRef } from 'react';
import { Animated, PanResponder, useWindowDimensions } from 'react-native';

// Nach rechts wischen = zurück, irgendwo auf dem Bildschirm (nicht nur am Rand).
// Die Seite folgt dem Finger ein Stück; weit genug oder schnell genug gewischt -> onBack.
export function SwipeBack({ onBack, enabled = true, children }: { onBack: () => void; enabled?: boolean; children: ReactNode }) {
  const { width } = useWindowDimensions();
  const x = useRef(new Animated.Value(0)).current;
  // immer die aktuellen Werte nutzen (der PanResponder wird nur einmal angelegt)
  const state = useRef({ onBack, enabled, width });
  state.current = { onBack, enabled, width };

  const reset = () => Animated.spring(x, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();

  const pan = useRef(
    PanResponder.create({
      // nur klar waagerechte Bewegungen nach rechts – senkrechtes Scrollen und Tippen bleiben ungestört.
      // "Capture": die Seite prüft die Bewegung vor Knöpfen und Listen darin.
      onMoveShouldSetPanResponderCapture: (_, g) =>
        state.current.enabled && g.dx > 18 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => x.setValue(Math.max(0, g.dx) * 0.6),
      onPanResponderRelease: (_, g) => {
        if (g.dx > state.current.width * 0.28 || (g.dx > 40 && g.vx > 0.6)) {
          Animated.timing(x, { toValue: state.current.width, duration: 160, useNativeDriver: true }).start(() => {
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
    <Animated.View style={{ flex: 1, transform: [{ translateX: x }] }} {...pan.panHandlers}>
      {children}
    </Animated.View>
  );
}
