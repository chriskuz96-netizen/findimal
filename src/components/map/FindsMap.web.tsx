import { StyleSheet, Text, View } from 'react-native';

import { Find } from '../../finds';

// In der Web-Vorschau gibt es keine Karte (react-native-maps läuft nur auf dem Handy).
export function FindsMap({ finds }: { finds: Find[]; locale: string; onOpen: (f: Find) => void }) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.box]}>
      <Text style={styles.text}>Karte nur auf dem Handy · {finds.filter((f) => f.coords).length} Fundorte</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#cfdccb', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#13261C', fontWeight: '700' },
});
