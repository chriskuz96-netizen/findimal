import { StyleSheet, View } from 'react-native';

// Dunkelgrüner Hintergrund für Kopfbereiche (wie .top / .hx in der Vorlage).
// Bewusst eine volle Farbe statt SVG-Verlauf: der Verlauf wurde auf dem iPhone
// nicht über den ganzen Bereich gestreckt.
export function HeaderBackground() {
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: '#17462F' }]} />;
}
