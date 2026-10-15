import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdSlot } from '../components/AdSlot';
import { PlaceChip } from '../components/PlaceChip';
import { SEASON_LOOK, SeasonSky } from '../components/SeasonSky';
import { SeasonTop } from '../components/SeasonTop';
import { Find } from '../finds';
import { GroupIcon } from '../groups';
import { useI18n } from '../i18n';
import { loadRegionSeason } from '../regionSeason';
import { Phenomenon, Season, seasonFor, seasonId, seasonRange } from '../season';
import { colors, darkPalette, fonts, lightPalette, spacing } from '../theme';
import { hasOwnSeason, loadCountry } from '../zone';


// Zählt die App-Starts (einmal pro Start hochgezählt), damit das Naturschauspiel jedes Mal wechselt
const LAUNCH_KEY = 'findimal-launch';
let launchNumber: Promise<number> | null = null;
function useLaunchNumber(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    launchNumber ??= AsyncStorage.getItem(LAUNCH_KEY)
      .then((v) => {
        const next = (Number(v) || 0) + 1;
        AsyncStorage.setItem(LAUNCH_KEY, String(next)).catch(() => {});
        return next;
      })
      .catch(() => 0);
    launchNumber.then(setN);
  }, []);
  return n;
}
const GAP = 8;

// Funde aus der aktuellen Jahreszeit (neueste zuerst)
function seasonFinds(finds: Find[], { start, end }: { start: Date; end: Date }): Find[] {
  return finds
    .filter((f) => {
      const d = new Date(f.date);
      return d >= start && d < end;
    })
    .reverse();
}

// Saison: was gerade draußen los ist und wie man Tieren helfen kann.
export function SeasonScreen({
  finds,
  place,
  onChangePlace,
}: {
  finds: Find[];
  place: string; // eingestellter Ort ('' = keiner)
  onChangePlace: () => void;
}) {
  const dark = useColorScheme() === 'dark';
  const p = dark ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const now = new Date();
  // Außerhalb Mitteleuropas: Saison für das eigene Land (vom Server, einmal pro Monat)
  const [region, setRegion] = useState<Season | null | 'loading'>(null);
  useEffect(() => {
    let alive = true;
    loadCountry().then((cc) => {
      if (!alive || !cc || hasOwnSeason(cc)) return setRegion(null);
      setRegion('loading');
      loadRegionSeason(cc, lang).then((s) => alive && setRegion(s));
    });
    return () => {
      alive = false;
    };
  }, [lang, place]);
  const season = region && region !== 'loading' ? region : seasonFor(now, lang);
  const mood = season.mood ?? seasonId(now);
  const look = SEASON_LOOK[mood];
  const { start, end } = season.range ?? seasonRange(now);
  const recent = seasonFinds(finds, { start, end });
  const share = Math.min(1, (now.getTime() - start.getTime()) / (end.getTime() - start.getTime()));
  const daysLeft = Math.max(1, Math.ceil((end.getTime() - now.getTime()) / 86400000));
  // Breite eines Viertels (zwei nebeneinander ergeben den Kreis)
  const launch = useLaunchNumber();
  const [showSpec, setShowSpec] = useState(false);
  const loading = region === 'loading';
  const spec = !loading && season.spectacle.length ? season.spectacle[launch % season.spectacle.length] : null;
  const quarter = Math.floor((Math.min(useWindowDimensions().width, 520) - spacing.gutter * 2 - GAP) / 2);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: p.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Kopf: Monat, Jahreszeit und wie lange sie noch dauert */}
      <View style={[styles.hx, { paddingTop: insets.top + 34 }]}>
        {/* Farbe, Symbol und Teilchen passend zur Jahreszeit */}
        {loading ? <View style={[StyleSheet.absoluteFill, { backgroundColor: SEASON_LOOK.summer.bg }]} /> : <SeasonSky season={mood} />}
        <View style={styles.headRow}>
          <Text style={styles.h2}>{t(`month.${now.getMonth()}` as 'month.0')}</Text>
          {/* Naturschauspiel als kleine Marke – wechselt bei jedem App-Start, Antippen zeigt mehr */}
          {spec && (
            <Pressable
              onPress={() => setShowSpec(true)}
              hitSlop={8}
              style={({ pressed }) => [styles.specPill, { opacity: pressed ? 0.75 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={spec.title}
            >
              <Text style={styles.specPillText} numberOfLines={1}>
                {spec.short}
              </Text>
              <View style={styles.specInfo}>
                <Text style={styles.specInfoText}>i</Text>
              </View>
            </Pressable>
          )}
        </View>
        <Text style={[styles.season, { color: look.light }]}>{loading ? '…' : season.name}</Text>
        <View style={styles.bar}>
          {!loading && <View style={[styles.barFill, { width: `${Math.round(share * 100)}%`, backgroundColor: look.accent }]} />}
        </View>
        <View style={styles.barRow}>
          <Text style={[styles.barText, { flex: 1 }]} numberOfLines={1}>
            {loading ? ' ' : t('sea.daysLeft', { n: daysLeft })}
          </Text>
          {/* Die Seite richtet sich nach dem Ort – klein daneben, antippen zum Ändern */}
          <PlaceChip
            label={place || t('sea.placeNone')}
            onPress={onChangePlace}
            accessibilityLabel={place ? t('sea.placeFor', { place }) : t('sea.placeNone')}
            style={styles.placeLink}
          />
        </View>
      </View>

      {/* Saison fürs eigene Land wird zum ersten Mal geschrieben (danach sofort da) */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={p.moss} />
          <Text style={[styles.sub, { color: p.mute, textAlign: 'center' }]}>{t('sea.loadingRegion')}</Text>
        </View>
      ) : (
      <>
      {/* Beliebteste Tiere der Saison bei allen Entdeckern (ab 20 Funden) – nur für Mitteleuropa */}
      {!region && <SeasonTop finds={recent} p={p} first />}

      {/* Saison-Tiere als Kreis aus vier Vierteln – alles auf einen Blick */}
      <View style={styles.blk}>
        <View style={styles.bh}>
          <Text style={[styles.h3, { color: p.ink }]}>{t('sea.now')}</Text>
        </View>
        <Text style={[styles.sub, { color: p.mute }]}>{t('sea.nowSub')}</Text>
        <View style={[styles.circle, { width: quarter * 2 + GAP }]}>
          {/* Reihenfolge im Uhrzeigersinn: oben links, oben rechts, unten rechts, unten links */}
          {[0, 1, 3, 2].map((i) => (
            <Quarter
              key={season.phenomena[i].title}
              ph={season.phenomena[i]}
              corner={(['tl', 'tr', 'br', 'bl'] as const)[i]}
              width={quarter}
              dark={dark}
              p={p}
            />
          ))}
        </View>
      </View>

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
      </>
      )}
      {/* Infofeld zum Naturschauspiel */}
      <Modal visible={showSpec} transparent animationType="fade" onRequestClose={() => setShowSpec(false)}>
        <Pressable style={styles.specDim} onPress={() => setShowSpec(false)}>
          <Pressable style={[styles.specBox, { backgroundColor: p.card }]} onPress={() => {}}>
            <Text style={[styles.specSmall, { color: p.mute }]}>🔭 {t('sea.spectacle')}</Text>
            <Text style={[styles.specBoxTitle, { color: p.ink }]}>{spec?.title}</Text>
            <Text style={[styles.specText, { color: p.ink }]}>{spec?.text}</Text>
            <Text style={[styles.specWhere, { color: dark ? colors.accent : colors.accentDark }]}>{spec?.where}</Text>
            <Pressable
              onPress={() => setShowSpec(false)}
              style={({ pressed }) => [styles.specOk, { backgroundColor: p.button, opacity: pressed ? 0.85 : 1 }]}
              accessibilityRole="button"
            >
              <Text style={styles.specOkText}>OK</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

// Ein Viertel des Kreises: Saison-Tier mit Titel, Text und Ort.
// Die äußere Ecke ist stark abgerundet, zusammen ergeben die vier Viertel einen Kreis.
function Quarter({
  ph,
  corner,
  width,
  dark,
  p,
}: {
  ph: Phenomenon;
  corner: 'tl' | 'tr' | 'br' | 'bl';
  width: number;
  dark: boolean;
  p: typeof lightPalette;
}) {
  const R = Math.round(width * 0.45);
  const round = {
    tl: { borderTopLeftRadius: R, paddingLeft: 20, paddingTop: 22 },
    tr: { borderTopRightRadius: R, paddingRight: 20, paddingTop: 22 },
    // unten mehr Abstand, damit der Text nicht in die Rundung läuft
    br: { borderBottomRightRadius: R, paddingRight: 22, paddingBottom: 22 },
    bl: { borderBottomLeftRadius: R, paddingLeft: 28, paddingBottom: 22 },
  }[corner];
  return (
    <View style={[styles.quarter, { width, backgroundColor: p.card, borderColor: p.line }, round]}>
      <View style={styles.qHead}>
        <View style={styles.qIcon}>
          <GroupIcon id={ph.icon} size={18} color={colors.accentLight} />
        </View>
        {/* Überschrift direkt neben dem Symbol – spart Höhe */}
        <Text style={[styles.qTitle, { color: p.ink }]}>{ph.title}</Text>
      </View>
      <Text style={[styles.qText, { color: p.ink }]}>{ph.text}</Text>
      <Text style={[styles.qWhere, { color: dark ? colors.accent : colors.accentDark }]}>{ph.where}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 5 },
  placeLink: { maxWidth: '45%' },
  loadingBox: { alignItems: 'center', gap: 10, paddingVertical: 60, paddingHorizontal: 40 },
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
  barText: { fontFamily: fonts.sans, fontSize: 12, color: colors.white, opacity: 0.8 },
  small: { fontFamily: fonts.sans, fontSize: 12 },
  blk: { marginTop: 26, marginHorizontal: spacing.gutter },
  bh: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  h3: { fontFamily: fonts.serifBold, fontSize: 20 },
  count: { fontFamily: fonts.sansBold, fontSize: 14 },
  sub: { fontFamily: fonts.sans, fontSize: 14, marginTop: 4, marginBottom: 4 },
  circle: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, marginTop: 10, alignSelf: 'center' },
  quarter: { borderWidth: 1.5, borderRadius: 16, padding: 12 },
  qHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  qTitle: { flex: 1, fontFamily: fonts.serifBold, fontSize: 14.5, lineHeight: 17 },
  qText: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17, marginTop: 6 },
  qWhere: { fontFamily: fonts.sansBold, fontSize: 11.5, lineHeight: 15, marginTop: 5 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  specPill: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingLeft: 11,
    paddingRight: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  specPillText: { flexShrink: 1, fontFamily: fonts.sansBold, fontSize: 13, color: colors.white },
  specInfo: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specInfoText: { fontFamily: fonts.serifBold, fontSize: 12, color: '#123826', marginTop: -1 },
  specDim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  specBox: { width: '100%', maxWidth: 380, borderRadius: 20, padding: 20 },
  specSmall: { fontFamily: fonts.sansBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  specBoxTitle: { fontFamily: fonts.serifBold, fontSize: 21, marginTop: 4 },
  specText: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, marginTop: 6 },
  specWhere: { fontFamily: fonts.sansBold, fontSize: 13, marginTop: 8 },
  specOk: { marginTop: 16, borderRadius: 99, paddingVertical: 11, alignItems: 'center' },
  specOkText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.white },
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
