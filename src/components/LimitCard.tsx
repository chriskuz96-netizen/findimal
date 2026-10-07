import { Alert, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Translate, useI18n } from '../i18n';
import { colors, fonts, Palette } from '../theme';
import { FREE_PHOTOS_PER_DAY } from '../usage';

// Werbevideo und Findimal Plus gibt es erst in der fertigen App (nicht in Expo Go/Snack).
function soon(t: Translate) {
  Alert.alert(t('lim.title'), t('lim.soon'));
}

// Hinweis vor dem Fotografieren, wenn die Gratis-Fotos für heute aufgebraucht sind
export function showLimit(t: Translate) {
  Alert.alert(t('lim.title'), t('lim.text', { n: FREE_PHOTOS_PER_DAY }), [
    { text: t('lim.video'), onPress: () => soon(t) },
    { text: t('lim.plus'), onPress: () => soon(t) },
    { text: t('common.cancel'), style: 'cancel' },
  ]);
}

// Dieselbe Auswahl als Karte auf der Ergebnisseite
export function LimitCard({ p, style }: { p: Palette; style?: ViewStyle }) {
  const { t } = useI18n();
  return (
    <View style={[styles.card, { backgroundColor: p.card }, style]}>
      <Text style={[styles.title, { color: p.ink }]}>{t('lim.title')}</Text>
      <Text style={[styles.text, { color: p.mute }]}>{t('lim.text', { n: FREE_PHOTOS_PER_DAY })}</Text>
      <View style={styles.row}>
        <Pressable onPress={() => soon(t)} style={[styles.btn, { backgroundColor: colors.accent }]} accessibilityRole="button">
          <Text style={[styles.btnText, { color: colors.ink }]}>{t('lim.video')}</Text>
        </Pressable>
        <Pressable onPress={() => soon(t)} style={[styles.btn, { backgroundColor: p.button }]} accessibilityRole="button">
          <Text style={[styles.btnText, { color: colors.white }]}>{t('lim.plus')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 14, marginHorizontal: 18, borderRadius: 20, padding: 16, borderWidth: 2, borderColor: colors.accent },
  title: { fontFamily: fonts.serifBold, fontSize: 18 },
  text: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 20, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: { flex: 1, borderRadius: 14, paddingVertical: 11, paddingHorizontal: 8, alignItems: 'center' },
  btnText: { fontFamily: fonts.sansBold, fontSize: 14, textAlign: 'center' },
});
