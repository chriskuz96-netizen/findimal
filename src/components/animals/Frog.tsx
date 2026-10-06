import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { BlinkEye } from './BlinkEye';

const VB_W = 100;
const VB_H = 50;

// Frosch auf einem Seerosenblatt, blinzelt gelegentlich.
export function Frog({ width }: { width: number }) {
  const height = (width * VB_H) / VB_W;
  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox="290 305 100 50">
        <Ellipse cx={340} cy={343} rx={46} ry={11} transform="rotate(-6 340 343)" fill="#1E5A3C" />
        <G transform="translate(20,-180)">
          <Ellipse cx={318} cy={514} rx={17} ry={10} fill="#6E9E57" />
          <Ellipse cx={318} cy={518} rx={10} ry={5} fill="#B9D3A0" />
          <Circle cx={309} cy={504} r={6} fill="#6E9E57" />
          <Circle cx={325} cy={504} r={6} fill="#6E9E57" />
          <Circle cx={309} cy={503} r={3.4} fill="#F1EEDC" />
          <Circle cx={325} cy={503} r={3.4} fill="#F1EEDC" />
          <BlinkEye cx={309.5} cy={503.5} r={1.8} fill="#13261C" />
          <BlinkEye cx={325.5} cy={503.5} r={1.8} fill="#13261C" />
          <Path d="M312 512q6 4 12 0" stroke="#3E6A2E" strokeWidth={1.6} fill="none" strokeLinecap="round" />
        </G>
      </Svg>
    </View>
  );
}
