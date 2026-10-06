import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderBackground } from '../components/HeaderBackground';
import { Find, useFindPhoto } from '../finds';
import { GroupIcon, groupOf } from '../groups';
import { useI18n } from '../i18n';
import { Phenomenon, Season, seasonFor, seasonId } from '../season';
import { colors, darkPalette, fonts, lightPalette, spacing } from '../theme';

const DAY = 86400000;
const HELP_KEY = 'findimal-help'; // erledigte Tipps, pro Saison und Jahr

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

// Hat man das Tier der Saison-Aktion in dieser Jahreszeit schon gefunden?
function eventDone(season: Season, finds: Find[]): boolean {
  return finds.some((f) => {
    const a = f.animal;
    const text = `${a.name} ${a.wissenschaftlicher_name} ${a.familie} ${a.klasse}`.toLowerCase();
    return season.event.match.some((w) => text.includes(w));
  });
}

// Saison: was gerade draußen los ist – zum Entdecken, Abhaken und Mithelfen.
export function SeasonScreen({ finds, onOpen }: { finds: Find[]; onOpen: (f: Find) => void }) {
  const dark = useColorScheme() === 'dark';
  const p = dark ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const now = new Date();
  const season = seasonFor(now, lang);
  const { start, end } = seasonRange(now);
  const recent = seasonFinds(finds, now);
  const done = eventDone(season, recent);
  const share = (now.getTime() - start.getTime()) / (end.getTime() - start.getTime());
  const daysLeft = Math.max(1, Math.ceil((end.getTime() - now.getTime()) / DAY));
  const matches = season.phenomena.map((ph) => findFor(ph, recent));

  // Erledigte Tipps merken (z. B. "autumn-2026": [0, 2])
  const helpKey = `${seasonId(now)}-${start.getFullYear()}`;
  const [helped, setHelped] = useState<number[]>([]);
  useEffect(() => {
    AsyncStorage.getItem(HELP_KEY)
      .then((raw) => setHelped((raw ? JSON.parse(raw)[helpKey] : null) ?? []))
      .catch(() => {});
  }, [helpKey]);
  const toggleHelp = (i: number) => {
    const next = helped.includes(i) ? helped.filter((x) => x !== i) : [...helped, i];
    setHelped(next);
    AsyncStorage.setItem(HELP_KEY, JSON.stringify({ [helpKey]: next })).catch(() => {});
  };

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

      {/* Saison-Tiere: vier Karten zum Abhaken, Tippen zeigt mehr */}
      <View style={styles.blk}>
        <View style={styles.bh}>
          <Text style={[styles.h3, { color: p.ink }]}>{t('sea.now')}</Text>
          <Text style={[styles.count, { color: p.mute }]}>
            {matches.filter(Boolean).length} / {matches.length}
          </Text>
        </View>
        <Text style={[styles.sub, { color: p.mute }]}>{t('sea.nowSub')}</Text>
        {season.phenomena.map((ph, i) => (
          <SeasonRow
            key={ph.title}
            ph={ph}
            found={matches[i]}
            last={i === season.phenomena.length - 1}
            onOpen={onOpen}
            dark={dark}
            p={p}
          />
        ))}
      </View>

      {/* Deine Funde in dieser Jahreszeit */}
      <View style={styles.blk}>
        <View style={styles.bh}>
          <Text style={[styles.h3, { color: p.ink }]}>{t('sea.yourFinds')}</Text>
          <Text style={[styles.count, { color: p.mute }]}>{recent.length}</Text>
        </View>
        {recent.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip} style={styles.stripBox}>
            {recent.slice(0, 20).map((f) => (
              <Thumb key={f.id} find={f} onPress={() => onOpen(f)} color={p.mute} />
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.sub, { color: p.mute }]}>{t('sea.noFinds')}</Text>
        )}
      </View>

      {/* So hilfst du – zum Abhaken */}
      <View style={[styles.help, { backgroundColor: 'rgba(31,110,71,0.09)' }]}>
        <View style={styles.bh}>
          <Text style={[styles.h3, { color: p.ink, flex: 1 }]}>{t('sea.help')}</Text>
          <Text style={[styles.count, { color: p.mute }]}>
            {helped.length} / {season.help.length}
          </Text>
        </View>
        <Text style={[styles.sub, { color: p.mute }]}>{t('sea.helpSub')}</Text>
        {season.help.map((h, i) => {
          const on = helped.includes(i);
          return (
            <Pressable
              key={h.title}
              onPress={() => toggleHelp(i)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={[styles.hi, i > 0 && { borderTopWidth: 1, borderTopColor: p.line }]}
            >
              <View style={[styles.check, on ? { backgroundColor: p.moss, borderColor: p.moss } : { borderColor: p.mute }]}>
                {on && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.hiTitle, { color: p.ink }, on && styles.hiDone]}>{h.title}</Text>
                <Text style={[styles.hiText, { color: p.mute }]}>{h.text}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

// Ein Saison-Tier mit ganzem Text; schon entdeckt = eigenes Foto und Haken
function SeasonRow({
  ph,
  found,
  last,
  onOpen,
  dark,
  p,
}: {
  ph: Phenomenon;
  found: Find | null;
  last: boolean;
  onOpen: (f: Find) => void;
  dark: boolean;
  p: typeof lightPalette;
}) {
  const { t } = useI18n();
  const uri = useFindPhoto(found?.id ?? '');
  return (
    <View style={[styles.zi, { borderBottomColor: p.line }, last && { borderBottomWidth: 0 }]}>
      <Pressable onPress={found ? () => onOpen(found) : undefined} disabled={!found} style={{ alignSelf: 'flex-start' }}>
        <View style={[styles.zIcon, found && styles.zIconFound]}>
          {found && uri ? (
            <Image source={{ uri }} style={styles.zImg} resizeMode="cover" />
          ) : (
            <GroupIcon id={ph.icon} size={24} color={colors.accentLight} />
          )}
        </View>
        {found && (
          <View style={styles.tick}>
            <Text style={styles.tickText}>✓</Text>
          </View>
        )}
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={[styles.ziTitle, { color: p.ink }]}>{ph.title}</Text>
        <Text style={[styles.sci, { color: p.mute }]}>{ph.sci}</Text>
        <Text style={[styles.ziText, { color: p.ink }]}>{ph.text}</Text>
        <View style={styles.tags}>
          <Text style={[styles.where, { color: dark ? colors.accent : colors.accentDark }]}>{ph.where}</Text>
          {found && <Text style={styles.foundTag}>✓ {t('sea.found')}</Text>}
        </View>
      </View>
    </View>
  );
}

function Thumb({ find, onPress, color }: { find: Find; onPress: () => void; color: string }) {
  const uri = useFindPhoto(find.id);
  const g = groupOf(find.animal.gruppe);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={find.animal.name}>
      <View style={[styles.thumb, { backgroundColor: g?.c1 ?? '#2F6B47' }]}>
        {uri ? (
          <Image source={{ uri }} style={styles.thumbImg} resizeMode="cover" />
        ) : (
          <GroupIcon id={g?.id ?? null} size={26} color={colors.accentLight} />
        )}
      </View>
      <Text style={[styles.thumbName, { color }]} numberOfLines={1}>
        {find.animal.rasse || find.animal.name}
      </Text>
    </Pressable>
  );
}

const THUMB = 84;

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
  bar: { height: 6, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 12, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.accent },
  barText: { fontFamily: fonts.sans, fontSize: 12, color: colors.white, opacity: 0.8, marginTop: 5 },
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
  bh: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  h3: { fontFamily: fonts.serifBold, fontSize: 20 },
  count: { fontFamily: fonts.sansBold, fontSize: 14 },
  sub: { fontFamily: fonts.sans, fontSize: 14, marginTop: 4, marginBottom: 4 },
  sci: { fontFamily: fonts.sans, fontStyle: 'italic', fontSize: 12 },
  zi: { flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  zIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#123826',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  zIconFound: { borderWidth: 2, borderColor: '#6FBF8A' },
  zImg: { position: 'absolute', left: 0, top: 0, width: 48, height: 48 },
  tick: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6FBF8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.ink },
  ziTitle: { fontFamily: fonts.serifBold, fontSize: 17 },
  ziText: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21, marginTop: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  foundTag: {
    backgroundColor: 'rgba(111,191,138,0.25)',
    color: '#2E7A4C',
    fontFamily: fonts.sansBold,
    fontSize: 12,
    borderRadius: 99,
    overflow: 'hidden',
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  where: {
    backgroundColor: 'rgba(232,131,58,0.16)',
    fontFamily: fonts.sansBold,
    fontSize: 12,
    borderRadius: 99,
    overflow: 'hidden',
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  stripBox: { marginHorizontal: -spacing.gutter, marginTop: 8 },
  strip: { gap: 10, paddingHorizontal: spacing.gutter },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImg: { position: 'absolute', left: 0, top: 0, width: THUMB, height: THUMB },
  thumbName: { width: THUMB, fontFamily: fonts.sans, fontSize: 11.5, marginTop: 4 },
  help: {
    marginTop: 26,
    marginHorizontal: spacing.gutter,
    borderRadius: 18,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  hi: { flexDirection: 'row', gap: 12, paddingVertical: 11 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: colors.white, fontFamily: fonts.sansBold, fontSize: 14, lineHeight: 16 },
  hiTitle: { fontFamily: fonts.sansBold, fontSize: 15 },
  hiDone: { textDecorationLine: 'line-through', opacity: 0.6 },
  hiText: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, marginTop: 2 },
});
