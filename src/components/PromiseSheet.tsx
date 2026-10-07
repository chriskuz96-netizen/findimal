import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { useI18n } from '../i18n';
import { colors, darkPalette, fonts, lightPalette } from '../theme';
import { Explorer } from './Explorer';

const RULES = [
  ['🔭', 'promise.r1'],
  ['🤲', 'promise.r2'],
  ['🪺', 'promise.r3'],
  ['🤫', 'promise.r4'],
] as const;

// Das Findimal-Ehrenwort: erscheint einmal vor dem ersten Foto. Tiere sollen nicht gestört werden.
export function PromiseSheet({ onDone }: { onDone: () => void }) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const { t } = useI18n();
  return (
    <View style={[StyleSheet.absoluteFill, styles.dim]}>
      <View style={[styles.card, { backgroundColor: p.card }]} accessibilityViewIsModal>
        <Explorer size={64} />
        <Text style={[styles.title, { color: p.ink }]}>{t('promise.title')}</Text>
        <Text style={[styles.intro, { color: p.mute }]}>{t('promise.intro')}</Text>
        <View style={styles.rules}>
          {RULES.map(([icon, key]) => (
            <View key={key} style={styles.rule}>
              <Text style={styles.icon}>{icon}</Text>
              <Text style={[styles.ruleText, { color: p.ink }]}>{t(key)}</Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={onDone}
          style={({ pressed }) => [styles.button, { backgroundColor: p.button, opacity: pressed ? 0.85 : 1 }]}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{t('promise.ok')}</Text>
        </Pressable>
        <Text style={[styles.small, { color: p.mute }]}>{t('promise.later')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.accent,
    padding: 22,
    alignItems: 'center',
  },
  title: { fontFamily: fonts.serifBold, fontSize: 23, marginTop: 10, textAlign: 'center' },
  intro: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, textAlign: 'center', marginTop: 6 },
  rules: { alignSelf: 'stretch', marginTop: 16, gap: 12 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { fontSize: 24, width: 32, textAlign: 'center' },
  ruleText: { flex: 1, fontFamily: fonts.sansBold, fontSize: 15, lineHeight: 20 },
  button: { alignSelf: 'stretch', marginTop: 20, borderRadius: 99, paddingVertical: 14, alignItems: 'center' },
  buttonText: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.white },
  small: { fontFamily: fonts.sans, fontSize: 12.5, marginTop: 10, textAlign: 'center' },
});
