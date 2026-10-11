import { ActivityIndicator, Image, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '../i18n';
import { colors, darkPalette, fonts, lightPalette, spacing } from '../theme';
import { Explorer } from './Explorer';

// Foto ist gewählt und wird noch verkleinert: sieht schon aus wie die Ergebnisseite beim Laden,
// damit nicht kurz die Startseite durchblitzt und der Wechsel nahtlos ist.
export function Preparing({ uri }: { uri: string }) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: p.bg }]}>
      <View style={[styles.hero, { height: 300 + insets.top }]}>
        {!!uri && <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
        <View style={styles.loading}>
          <Explorer size={64} />
          <Text style={styles.title}>{t('res.wait')}</Text>
          <Text style={styles.text}>{t('res.preparing')}</Text>
          <ActivityIndicator color={colors.accentLight} style={{ marginTop: 10 }} />
        </View>
      </View>
    </View>
  );
}

// gleiche Maße wie der Kopf der Ergebnisseite
const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#17462F',
    borderBottomLeftRadius: spacing.radiusHero,
    borderBottomRightRadius: spacing.radiusHero,
    overflow: 'hidden',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12,42,28,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
  },
  title: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.white, marginTop: 10 },
  text: { fontFamily: fonts.sans, fontSize: 15, color: colors.accentLight, marginTop: 2, textAlign: 'center', paddingHorizontal: 28 },
});
