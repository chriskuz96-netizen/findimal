import { Image, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Explorer } from '../components/Explorer';
import { Photo } from '../camera';
import { colors, darkPalette, fonts, lightPalette, spacing } from '../theme';

type Props = { photo: Photo; onBack: () => void };

// Ergebnisseite nach dem Foto. Die echte Tierbestimmung kommt im nächsten Schritt.
export function ResultScreen({ photo, onBack }: Props) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      {/* Dunkler Kopfbereich mit dem Forscher und seiner Sprechblase */}
      <View style={[styles.top, { paddingTop: insets.top + 24 }]}>
        <View style={styles.guide}>
          <Explorer size={72} />
          <View style={styles.bubble}>
            <Text style={styles.bubbleTitle}>Tolles Foto!</Text>
            <Text style={styles.bubbleSub}>Wer ist das wohl?</Text>
            <Text style={styles.bubbleText}>
              Bald sage ich dir hier, welches Tier du gefunden hast.
            </Text>
          </View>
        </View>
      </View>

      <Image source={{ uri: photo.uri }} style={styles.photo} accessibilityLabel="Dein Foto" />

      <View style={[styles.sheet, { backgroundColor: p.card, borderColor: p.line }]}>
        <Text style={[styles.h4, { color: p.ink }]}>Wie geht es weiter?</Text>
        <Text style={[styles.p, { color: p.ink }]}>
          Die Tierbestimmung bauen wir im nächsten Schritt ein. Dann erscheinen hier Name, Steckbrief
          und spannende Fakten zu deinem Fund.
        </Text>
      </View>

      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        style={({ pressed }) => [styles.btn, { backgroundColor: p.moss, opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.btnText}>Weiter entdecken</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  top: {
    backgroundColor: '#164730',
    paddingHorizontal: spacing.gutter,
    paddingBottom: 22,
    borderBottomLeftRadius: spacing.radiusHero,
    borderBottomRightRadius: spacing.radiusHero,
  },
  guide: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  bubble: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bubbleTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 21,
    lineHeight: 24,
    color: colors.white,
  },
  bubbleSub: {
    fontFamily: fonts.sans,
    fontStyle: 'italic',
    fontSize: 15,
    color: colors.accentLight,
    marginTop: 2,
    marginBottom: 6,
  },
  bubbleText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.white,
  },
  photo: {
    margin: spacing.gutter,
    height: 240,
    borderRadius: 22,
    backgroundColor: '#5a4a33',
  },
  sheet: {
    marginHorizontal: spacing.gutter,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  h4: {
    fontFamily: fonts.serifBold,
    fontSize: 15,
    marginBottom: 2,
  },
  p: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    lineHeight: 21,
  },
  btn: {
    marginHorizontal: spacing.gutter,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  btnText: {
    color: colors.white,
    fontFamily: fonts.sansBold,
    fontSize: 17,
  },
});
