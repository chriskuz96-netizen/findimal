import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

// Dunkelgrüner Verlauf für Kopfbereiche (wie .top / .hx in der Vorlage).
export function HeaderBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="hdr" x1="0.3" y1="0" x2="0.7" y2="1">
          <Stop offset="0" stopColor="#1F5639" />
          <Stop offset="1" stopColor="#0C2A1C" />
        </LinearGradient>
      </Defs>
      <Rect width={100} height={100} fill="url(#hdr)" />
    </Svg>
  );
}
