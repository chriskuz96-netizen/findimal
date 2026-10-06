import { Animated, Easing } from 'react-native';
import { Ellipse } from 'react-native-svg';

import { useLoop } from '../../hooks/useLoop';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

type Props = { cx: number; cy: number; r: number; fill: string };

// Ein Auge, das alle 6 Sekunden kurz blinzelt (wie .eye im Entwurf).
export function BlinkEye({ cx, cy, r, fill }: Props) {
  const t = useLoop(6000, { native: false, easing: Easing.linear });
  const ry = t.interpolate({
    inputRange: [0, 0.9, 0.94, 1],
    outputRange: [r, r, r * 0.1, r],
  });
  return <AnimatedEllipse cx={cx} cy={cy} rx={r} ry={ry} fill={fill} />;
}
