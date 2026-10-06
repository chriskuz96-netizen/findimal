import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderBackground } from '../components/HeaderBackground';
import { Find } from '../finds';
import { GroupIcon } from '../groups';
import { useI18n } from '../i18n';
import { Season, seasonFor, seasonId } from '../season';
import { colors, darkPalette, fonts, lightPalette, spacing } from '../theme';

// Hat man das Saison-Tier in dieser Jahreszeit schon gefunden?
function eventDone(season: Season, finds: Find[], now: Date): boolean {
  return finds.some((f) => {
    const d = new Date(f.date);
    if (seasonId(d) !== season.id || now.getTime() - d.getTime() > 120 * 86400000) return false;
    const a = f.animal;
    const text = `${a.name} ${a.wissenschaftlicher_name} ${a.familie} ${a.klasse}`.toLowerCase();
    return season.event.match.some((w) => text.includes(w));
  });
}

// Saison: was gerade in der Natur los ist und wie man Tieren helfen kann.
export function SeasonScreen({ finds }: { finds: Find[] }) {
  const dark = useColorScheme() === 'dark';
  const p = dark ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const now = new Date();
  const season = seasonFor(now, lang);
  const done = eventDone(season, finds, now);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: p.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={[styles.hx, { paddingTop: insets.top + 34 }]}>
        <HeaderBackground />
        <Text style={styles.h2}>{t(`month.${now.getMonth()}` as 'month.0')}</Text>
        <Text style={styles.season}>{season.name}</Text>
      </View>

      {/* Saison-Aktion */}
      <View style={[styles.mis, { backgroundColor: p.card }]}>
        <View style={styles.mi}>
          <GroupIcon id={season.event.icon} size={30} color={colors.accentLight} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.small, { color: p.mute }]}>{t('sea.event')}</Text>
          <Text style={[styles.misText, { color: p.ink }]}>{season.event.title}</Text>
        </View>
        {done && (
          <View style={styles.done}>
            <Text style={styles.doneText}>✓ {t('ch.done')}</Text>
          </View>
        )}
      </View>

      {/* Was jetzt los ist */}
      <View style={styles.blk}>
        <Text style={[styles.h3, { color: p.ink }]}>{t('sea.now')}</Text>
        {season.phenomena.map((ph, i) => (
          <View
            key={ph.title}
            style={[styles.zi, { borderBottomColor: p.line }, i === season.phenomena.length - 1 && { borderBottomWidth: 0 }]}
          >
            <View style={styles.zIcon}>
              <GroupIcon id={ph.icon} size={24} color={colors.accentLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.ziTitle, { color: p.ink }]}>{ph.title}</Text>
              <Text style={[styles.sci, { color: p.mute }]}>{ph.sci}</Text>
              <Text style={[styles.ziText, { color: p.ink }]}>{ph.text}</Text>
              <Text style={[styles.where, { color: dark ? colors.accent : colors.accentDark }]}>{ph.where}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* So hilfst du */}
      <View style={[styles.help, { backgroundColor: 'rgba(31,110,71,0.09)' }]}>
        <Text style={[styles.h3, { color: p.ink }]}>{t('sea.help')}</Text>
        <Text style={[styles.sub, { color: p.mute }]}>
          {t('sea.helpSub')}
        </Text>
        {season.help.map((h, i) => (
          <View key={h.title} style={[styles.hi, i > 0 && { borderTopWidth: 1, borderTopColor: p.line }]}>
            <View style={[styles.num, { backgroundColor: p.moss }]}>
              <Text style={styles.numText}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.hiTitle, { color: p.ink }]}>{h.title}</Text>
              <Text style={[styles.hiText, { color: p.mute }]}>{h.text}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
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
  h2: { fontFamily: fonts.serifBold, fontSize: 28, color: colors.white },
  season: { fontFamily: fonts.sans, fontSize: 15, color: colors.accentLight, marginTop: 2 },
  mis: {
    marginTop: -24,
    marginHorizontal: spacing.gutter,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
  },
  mi: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#123826',
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: { fontFamily: fonts.sans, fontSize: 12 },
  misText: { fontFamily: fonts.serifBold, fontSize: 17, lineHeight: 21 },
  done: { backgroundColor: '#6FBF8A', borderRadius: 99, paddingVertical: 4, paddingHorizontal: 9 },
  doneText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.ink },
  blk: { marginTop: 26, marginHorizontal: spacing.gutter },
  h3: { fontFamily: fonts.serifBold, fontSize: 20 },
  sub: { fontFamily: fonts.sans, fontSize: 14, marginTop: 4, marginBottom: 4 },
  zi: { flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  zIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#123826',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ziTitle: { fontFamily: fonts.serifBold, fontSize: 17 },
  sci: { fontFamily: fonts.sans, fontStyle: 'italic', fontSize: 12 },
  ziText: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21, marginTop: 4 },
  where: {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: 'rgba(232,131,58,0.16)',
    fontFamily: fonts.sansBold,
    fontSize: 12,
    borderRadius: 99,
    overflow: 'hidden',
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  help: {
    marginTop: 20,
    marginHorizontal: spacing.gutter,
    borderRadius: 18,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  hi: { flexDirection: 'row', gap: 10, paddingVertical: 10 },
  num: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.white },
  hiTitle: { fontFamily: fonts.sansBold, fontSize: 15 },
  hiText: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, marginTop: 2 },
});
