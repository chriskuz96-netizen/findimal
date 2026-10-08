import { Image, Pressable, ScrollView, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdSlot } from '../components/AdSlot';
import { HeaderBackground } from '../components/HeaderBackground';
import { SeasonTop } from '../components/SeasonTop';
import { Find, useFindPhoto } from '../finds';
import { GroupIcon } from '../groups';
import { useI18n } from '../i18n';
import { Phenomenon, seasonFor } from '../season';
import { colors, darkPalette, fonts, lightPalette, spacing } from '../theme';

const DAY = 86400000;
const GAP = 8;

// Beginn und Ende der aktuellen Jahreszeit (Winter geht über den Jahreswechsel)
function seasonRange(now: Date): { start: Date; end: Date } {
  const y = now.getFullYear();
  const m = now.getMonth();
  const startMonth = m === 0 || m === 1 ? -1 : Math.floor((m - 2) / 3) * 3 + 2; // 2, 5, 8, 11 (Dezember = 11)
  const start = new Date(y, startMonth, 1);
  const end = new Date(y, startMonth + 3, 1);
  return { start, end };
}

// Funde aus der aktuellen Jahreszeit (neueste zuerst)
function seasonFinds(finds: Find[], now: Date): Find[] {
  const { start, end } = seasonRange(now);
  return finds
    .filter((f) => {
      const d = new Date(f.date);
      return d >= start && d < end;
    })
    .reverse();
}

// Passt ein Fund zu einem Saison-Tier? (gleiche Gattung im wissenschaftlichen Namen)
function findFor(ph: Phenomenon, finds: Find[]): Find | null {
  const genus = ph.sci.split(' ')[0].toLowerCase();
  return finds.find((f) => (f.animal.wissenschaftlicher_name || '').toLowerCase().startsWith(genus)) ?? null;
}

// Saison: was gerade draußen los ist und wie man Tieren helfen kann.
export function SeasonScreen({ finds, onOpen }: { finds: Find[]; onOpen: (f: Find) => void }) {
  const dark = useColorScheme() === 'dark';
  const p = dark ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const now = new Date();
  const season = seasonFor(now, lang);
  const { start, end } = seasonRange(now);
  const recent = seasonFinds(finds, now);
  const share = (now.getTime() - start.getTime()) / (end.getTime() - start.getTime());
  const daysLeft = Math.max(1, Math.ceil((end.getTime() - now.getTime()) / DAY));
  const matches = season.phenomena.map((ph) => findFor(ph, recent));
  // Breite eines Viertels (zwei nebeneinander ergeben den Kreis)
  const quarter = Math.floor((Math.min(useWindowDimensions().width, 520) - spacing.gutter * 2 - GAP) / 2);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: p.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Kopf: Monat, Jahreszeit und wie lange sie noch dauert */}
      <View style={[styles.hx, { paddingTop: insets.top + 34 }]}>
        <HeaderBackground />
        <Text style={styles.h2}>{t(`month.${now.getMonth()}` as 'month.0')}</Text>
        <Text style={styles.season}>{season.name}</Text>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${Math.round(share * 100)}%` }]} />
        </View>
        <Text style={styles.barText}>{t('sea.daysLeft', { n: daysLeft })}</Text>
      </View>

      {/* Saison-Tiere als Kreis aus vier Vierteln – alles auf einen Blick */}
      <View style={styles.blk}>
        <View style={styles.bh}>
          <Text style={[styles.h3, { color: p.ink }]}>{t('sea.now')}</Text>
          <Text style={[styles.count, { color: p.mute }]}>
            {matches.filter(Boolean).length} / {matches.length} {t('sea.found')}
          </Text>
        </View>
        <Text style={[styles.sub, { color: p.mute }]}>{t('sea.nowSub')}</Text>
        <View style={[styles.circle, { width: quarter * 2 + GAP }]}>
          {/* Reihenfolge im Uhrzeigersinn: oben links, oben rechts, unten rechts, unten links */}
          {[0, 1, 3, 2].map((i) => (
            <Quarter
              key={season.phenomena[i].title}
              ph={season.phenomena[i]}
              found={matches[i]}
              corner={(['tl', 'tr', 'br', 'bl'] as const)[i]}
              width={quarter}
              onOpen={onOpen}
              dark={dark}
              p={p}
            />
          ))}
        </View>
      </View>

      {/* Beliebteste Tiere der Saison bei allen Entdeckern (ab 20 Funden) */}
      <SeasonTop finds={recent} p={p} />

      {/* Anzeigen-Platz unter den Saison-Tieren */}
      <AdSlot p={p} placement='season' />

      {/* So hilfst du */}
      <View style={[styles.help, { backgroundColor: 'rgba(31,110,71,0.09)' }]}>
        <Text style={[styles.h3, { color: p.ink }]}>{t('sea.help')}</Text>
        <Text style={[styles.sub, { color: p.mute }]}>{t('sea.helpSub')}</Text>
        {season.help.map((h, i) => (
          <View key={h.title} style={[styles.hi, i > 0 && { borderTopWidth: 1, borderTopColor: p.line }]}>
            <View style={[styles.num, { backgroundColor: p.button }]}>
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

// Ein Viertel des Kreises: Saison-Tier mit Titel, Text und Ort.
// Die äußere Ecke ist stark abgerundet, zusammen ergeben die vier Viertel einen Kreis.
function Quarter({
  ph,
  found,
  corner,
  width,
  onOpen,
  dark,
  p,
}: {
  ph: Phenomenon;
  found: Find | null;
  corner: 'tl' | 'tr' | 'br' | 'bl';
  width: number;
  onOpen: (f: Find) => void;
  dark: boolean;
  p: typeof lightPalette;
}) {
  const uri = useFindPhoto(found?.id ?? '');
  const R = Math.round(width * 0.45);
  const round = {
    tl: { borderTopLeftRadius: R, paddingLeft: 20, paddingTop: 24 },
    tr: { borderTopRightRadius: R, paddingRight: 20, paddingTop: 24 },
    br: { borderBottomRightRadius: R, paddingRight: 20, paddingBottom: 24 },
    bl: { borderBottomLeftRadius: R, paddingLeft: 20, paddingBottom: 24 },
  }[corner];
  return (
    <Pressable
      onPress={found ? () => onOpen(found) : undefined}
      disabled={!found}
      style={[
        styles.quarter,
        { width, minHeight: width * 1.05, backgroundColor: p.card, borderColor: found ? '#6FBF8A' : p.line },
        round,
      ]}
    >
      <View style={styles.qHead}>
        <View style={[styles.qIcon, found && { borderWidth: 2, borderColor: '#6FBF8A' }]}>
          {found && uri ? (
            <Image source={{ uri }} style={styles.qImg} resizeMode="cover" />
          ) : (
            <GroupIcon id={ph.icon} size={18} color={colors.accentLight} />
          )}
        </View>
        {found && <Text style={styles.qTick}>✓</Text>}
      </View>
      <Text style={[styles.qTitle, { color: p.ink }]}>{ph.title}</Text>
      <Text style={[styles.qText, { color: p.ink }]}>{ph.text}</Text>
      <Text style={[styles.qWhere, { color: dark ? colors.accent : colors.accentDark }]}>{ph.where}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hx: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: 24,
    borderBottomLeftRadius: spacing.radiusHero,
    borderBottomRightRadius: spacing.radiusHero,
    overflow: 'hidden',
  },
  h2: { fontFamily: fonts.serifBold, fontSize: 28, color: colors.white },
  season: { fontFamily: fonts.sans, fontSize: 15, color: colors.accentLight, marginTop: 2 },
  bar: { height: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 12, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.accent },
  barText: { fontFamily: fonts.sans, fontSize: 12, color: colors.white, opacity: 0.8, marginTop: 5 },
  small: { fontFamily: fonts.sans, fontSize: 12 },
  blk: { marginTop: 26, marginHorizontal: spacing.gutter },
  bh: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  h3: { fontFamily: fonts.serifBold, fontSize: 20 },
  count: { fontFamily: fonts.sansBold, fontSize: 14 },
  sub: { fontFamily: fonts.sans, fontSize: 14, marginTop: 4, marginBottom: 4 },
  circle: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginTop: 10, alignSelf: 'center' },
  quarter: { borderWidth: 1.5, borderRadius: 16, padding: 12 },
  qHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#123826',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  qImg: { position: 'absolute', left: 0, top: 0, width: 32, height: 32 },
  qTick: { fontFamily: fonts.sansBold, fontSize: 13, color: '#2E7A4C' },
  qTitle: { fontFamily: fonts.serifBold, fontSize: 15, lineHeight: 18, marginTop: 6 },
  qText: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17, marginTop: 3 },
  qWhere: { fontFamily: fonts.sansBold, fontSize: 11.5, lineHeight: 15, marginTop: 5 },
  help: {
    marginTop: 26,
    marginHorizontal: spacing.gutter,
    borderRadius: 18,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  hi: { flexDirection: 'row', gap: 12, paddingVertical: 11 },
  num: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.white },
  hiTitle: { fontFamily: fonts.sansBold, fontSize: 15 },
  hiText: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, marginTop: 2 },
});
