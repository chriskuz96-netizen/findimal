import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { HeaderBackground } from '../components/HeaderBackground';
import { Find, useFindPhoto } from '../finds';
import { GroupIcon, groupOf } from '../groups';
import { useI18n } from '../i18n';
import { Phenomenon, Season, seasonFor } from '../season';
import { colors, darkPalette, fonts, lightPalette, spacing } from '../theme';

const DAY = 86400000;
const RING = 0.34; // Radius des Kreises im Verhältnis zur Breite
const NODE = 56; // Größe der runden Symbole
const NODE_W = 104; // Breite inkl. Titel

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
  const [sel, setSel] = useState(0);
  // Kreis so groß wie möglich, aber nicht riesig
  const size = Math.min(useWindowDimensions().width - spacing.gutter * 2, 300);

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

      {/* Saison-Tiere im Kreis: alle auf einen Blick, angetipptes Tier darunter mit Text */}
      <View style={styles.blk}>
        <Text style={[styles.h3, { color: p.ink }]}>{t('sea.now')}</Text>
        <Text style={[styles.sub, { color: p.mute }]}>{t('sea.nowSub')}</Text>
        <View style={{ alignItems: 'center', marginTop: 4 }}>
          <View style={{ width: size, height: size + 26 }}>
            <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={size * RING}
                stroke={p.line}
                strokeWidth={2}
                strokeDasharray="6 7"
                fill="none"
              />
            </Svg>
            {/* Mitte: wie viele schon entdeckt */}
            <View style={[styles.center, { left: size / 2 - 60, top: size / 2 - 22 }]}>
              <Text style={[styles.centerCount, { color: colors.accent }]}>
                {matches.filter(Boolean).length} / {matches.length}
              </Text>
              <Text style={[styles.small, { color: p.mute }]}>{t('sea.found')}</Text>
            </View>
            {season.phenomena.map((ph, i) => {
              const a = -Math.PI / 2 + (i * Math.PI * 2) / season.phenomena.length;
              const x = size / 2 + Math.cos(a) * size * RING;
              const y = size / 2 + Math.sin(a) * size * RING;
              return (
                <Node
                  key={ph.title}
                  ph={ph}
                  found={matches[i]}
                  selected={sel === i}
                  onPress={() => setSel(i)}
                  style={{ left: x - NODE_W / 2, top: y - NODE / 2 }}
                  p={p}
                />
              );
            })}
          </View>
        </View>
        <SeasonRow ph={season.phenomena[sel]} found={matches[sel]} onOpen={onOpen} dark={dark} p={p} />
      </View>

      {/* So hilfst du */}
      <View style={[styles.help, { backgroundColor: 'rgba(31,110,71,0.09)' }]}>
        <Text style={[styles.h3, { color: p.ink }]}>{t('sea.help')}</Text>
        <Text style={[styles.sub, { color: p.mute }]}>{t('sea.helpSub')}</Text>
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

// Ein Tier auf dem Kreis: rundes Symbol (oder eigenes Foto) mit kurzem Titel
function Node({
  ph,
  found,
  selected,
  onPress,
  style,
  p,
}: {
  ph: Phenomenon;
  found: Find | null;
  selected: boolean;
  onPress: () => void;
  style: { left: number; top: number };
  p: typeof lightPalette;
}) {
  const uri = useFindPhoto(found?.id ?? '');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={ph.title}
      style={[styles.node, style]}
    >
      <View
        style={[
          styles.nodeDot,
          { borderColor: selected ? colors.accent : found ? '#6FBF8A' : p.bg },
          selected && styles.nodeSel,
        ]}
      >
        {found && uri ? (
          <Image source={{ uri }} style={styles.nodeImg} resizeMode="cover" />
        ) : (
          <GroupIcon id={ph.icon} size={24} color={colors.accentLight} />
        )}
      </View>
      {found && (
        <View style={styles.nodeTick}>
          <Text style={styles.tickText}>✓</Text>
        </View>
      )}
      <Text style={[styles.nodeTitle, { color: selected ? p.ink : p.mute }]} numberOfLines={2}>
        {ph.title}
      </Text>
    </Pressable>
  );
}

// Text zum angetippten Saison-Tier; schon entdeckt = eigenes Foto und Haken
function SeasonRow({
  ph,
  found,
  onOpen,
  dark,
  p,
}: {
  ph: Phenomenon;
  found: Find | null;
  onOpen: (f: Find) => void;
  dark: boolean;
  p: typeof lightPalette;
}) {
  const { t } = useI18n();
  const uri = useFindPhoto(found?.id ?? '');
  return (
    <View style={[styles.zi, { marginTop: 6, backgroundColor: p.card, borderColor: found ? '#6FBF8A' : p.line }]}>
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
  zi: { flexDirection: 'row', gap: 12, padding: 14, borderWidth: 1.5, borderRadius: 20 },
  center: { position: 'absolute', width: 120, alignItems: 'center' },
  centerCount: { fontFamily: fonts.serifBold, fontSize: 26, lineHeight: 30 },
  node: { position: 'absolute', width: NODE_W, alignItems: 'center' },
  nodeDot: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    backgroundColor: '#123826',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nodeSel: { transform: [{ scale: 1.08 }] },
  nodeImg: { position: 'absolute', left: 0, top: 0, width: NODE, height: NODE },
  nodeTick: {
    position: 'absolute',
    top: 0,
    left: NODE_W / 2 + NODE / 2 - 16,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6FBF8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeTitle: { fontFamily: fonts.sansBold, fontSize: 12, lineHeight: 15, textAlign: 'center', marginTop: 4 },
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
