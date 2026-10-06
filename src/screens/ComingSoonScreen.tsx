import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Explorer } from '../components/Explorer';
import { HeaderBackground } from '../components/HeaderBackground';
import { colors, darkPalette, fonts, lightPalette, spacing } from '../theme';

// Platzhalter für Bereiche, die noch gebaut werden (Challenges, Saison).
export function ComingSoonScreen({ title, text }: { title: string; text: string }) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={[styles.hx, { paddingTop: insets.top + 34 }]}>
        <HeaderBackground />
        <Text style={styles.h2}>{title}</Text>
      </View>
      <View style={[styles.card, { backgroundColor: p.card }]}>
        <Explorer size={56} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.h3, { color: p.ink }]}>Kommt bald</Text>
          <Text style={[styles.text, { color: p.mute }]}>{text}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hx: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: 40,
    borderBottomLeftRadius: spacing.radiusHero,
    borderBottomRightRadius: spacing.radiusHero,
    overflow: 'hidden',
  },
  h2: {
    fontFamily: fonts.serifBold,
    fontSize: 28,
    color: colors.white,
  },
  card: {
    marginTop: -24,
    marginHorizontal: spacing.gutter,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  h3: {
    fontFamily: fonts.serifBold,
    fontSize: 17,
  },
  text: {
    fontFamily: fonts.sans,
    fontSize: 14,
    marginTop: 2,
  },
});
