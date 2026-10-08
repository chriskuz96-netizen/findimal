import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { useI18n } from '../i18n';
import { askForPlus, PLUS_AVATARS, usePlus } from '../plus';
import { colors, fonts, spacing } from '../theme';
import { Avatar } from './Avatar';

// Findimal Plus: was dazugehört (gleiches Design im Profil und im Fenster „Fotos aufgebraucht“)
export function PlusCard({ name, style, onGet }: { name: string; style?: ViewStyle; onGet?: () => void }) {
  const { t } = useI18n();
  const { plus, setPlus } = usePlus();
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>★ {t('plus.title')}</Text>
      <Text style={styles.sub}>{plus ? t('plus.active') : t('plus.sub')}</Text>
      {(['plus.b1', 'plus.b2', 'plus.b3', 'plus.b4', 'plus.b5'] as const).map((k) => (
        <View key={k} style={styles.row}>
          <Text style={styles.check}>✓</Text>
          <Text style={styles.text}>{t(k)}</Text>
        </View>
      ))}
      {/* ein paar der Plus-Profilbilder als Vorgeschmack */}
      <View style={styles.preview}>
        {PLUS_AVATARS.slice(0, 5).map((a) => (
          <Avatar key={a.id} id={a.id} name={name} size={44} />
        ))}
      </View>
      {plus ? (
        <Pressable onPress={() => setPlus(false)} style={styles.end} accessibilityRole="button">
          <Text style={styles.endText}>{t('plus.end')}</Text>
        </Pressable>
      ) : (
        <>
          <Pressable
            onPress={() => {
              onGet?.();
              askForPlus(t, setPlus);
            }}
            style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]}
            accessibilityRole="button"
          >
            <Text style={styles.btnText}>{t('plus.get')}</Text>
          </Pressable>
          <Text style={styles.price}>{t('plus.price')}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    marginHorizontal: spacing.gutter,
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#123826',
    borderColor: '#E8B53A',
    borderWidth: 1.5,
  },
  title: { fontFamily: fonts.serifBold, fontSize: 20, color: '#FFD45E' },
  sub: { fontFamily: fonts.sans, fontSize: 14, color: colors.accentLight, marginTop: 2, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginTop: 5 },
  check: { fontFamily: fonts.sansBold, fontSize: 15, color: '#FFD45E' },
  text: { flex: 1, fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 20, color: colors.white },
  preview: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
  btn: { marginTop: 14, backgroundColor: '#E8B53A', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  btnText: { fontFamily: fonts.sansBold, fontSize: 16, color: '#13261C' },
  price: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.accentLight, textAlign: 'center', marginTop: 6 },
  end: { marginTop: 12, alignSelf: 'center', paddingVertical: 6 },
  endText: { fontFamily: fonts.sans, fontSize: 13, color: colors.accentLight, textDecorationLine: 'underline' },
});
