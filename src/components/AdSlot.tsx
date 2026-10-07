import { StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../i18n';
import { colors, fonts, Palette, spacing } from '../theme';

// Platz für eine native Anzeige (AdMob), gut als "Anzeige" gekennzeichnet.
// In Expo Go/Snack gibt es noch keine echte Werbung – dann steht hier ein Platzhalter.
// Später: nur für Gratis-Nutzer, familiengeeignet und nicht personalisiert.
export function AdSlot({ p }: { p: Palette; placement: 'result' | 'details' }) {
  const { t } = useI18n();
  return (
    <View style={[styles.card, { backgroundColor: p.card, borderColor: p.line }]} accessibilityLabel={t('ad.label')}>
      <Text style={[styles.label, { color: p.mute }]}>{t('ad.label')}</Text>
      <View style={styles.row}>
        <View style={[styles.media, { backgroundColor: p.line }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: p.ink }]}>{t('ad.placeholderTitle')}</Text>
          <Text style={[styles.text, { color: p.mute }]}>{t('ad.placeholderText')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 14, marginHorizontal: spacing.gutter, borderWidth: 1, borderRadius: 16, padding: 12 },
  label: {
    alignSelf: 'flex-start',
    fontFamily: fonts.sansBold,
    fontSize: 10.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  media: { width: 64, height: 64, borderRadius: 12, borderWidth: 1, borderColor: colors.accent, borderStyle: 'dashed' },
  title: { fontFamily: fonts.sansBold, fontSize: 14 },
  text: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17, marginTop: 2 },
});
