import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

// Liefert true, wenn auf dem Gerät "Bewegung reduzieren" aktiv ist.
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

// Ein Wert, der endlos von 0 bis 1 läuft (wie eine CSS-Animation mit "infinite").
// Mit interpolate() werden daraus die Keyframes gebaut.
export function useLoop(
  durationMs: number,
  options: { delayMs?: number; easing?: (t: number) => number; native?: boolean } = {},
): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();
  const { delayMs = 0, easing = Easing.linear, native = true } = options;

  useEffect(() => {
    if (reduce) {
      value.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.timing(value, {
        toValue: 1,
        duration: durationMs,
        easing,
        useNativeDriver: native,
      }),
    );
    const timer = setTimeout(() => anim.start(), delayMs);
    return () => {
      clearTimeout(timer);
      anim.stop();
    };
  }, [reduce, durationMs, delayMs, easing, native, value]);

  return value;
}
