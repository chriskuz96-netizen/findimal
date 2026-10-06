import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderBackground } from '../components/HeaderBackground';
import { Find, speciesKey, useFindPhoto } from '../finds';
import { GroupIcon, GroupId, groupOf, GROUPS } from '../groups';
import { colors, darkPalette, fonts, lightPalette, Palette, spacing } from '../theme';

type Props = {
  finds: Find[];
  onOpen: (find: Find) => void;
  onDelete: (find: Find) => void;
  onDiscover: () => void;
};

const fmt = (n: number) => n.toLocaleString('de-DE');

function shortDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

// Sammlung: alle entdeckten Arten, filterbar nach Tiergruppe.
export function CollectionScreen({ finds, onOpen, onDelete, onDiscover }: Props) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<GroupId | null>(null);

  // Pro Art nur der erste Fund, mit fortlaufender Nummer
  const species: { find: Find; no: number }[] = [];
  const seen = new Set<string>();
  for (const f of finds) {
    const k = speciesKey(f.animal);
    if (!seen.has(k)) {
      seen.add(k);
      species.push({ find: f, no: species.length + 1 });
    }
  }
  const groupsFound = new Set(species.map((s) => groupOf(s.find.animal.gruppe)?.id).filter(Boolean));
  const active = filter ? GROUPS.find((g) => g.id === filter)! : null;
  const list = species
    .filter((s) => !filter || groupOf(s.find.animal.gruppe)?.id === filter)
    .reverse(); // neueste zuerst

  const askDelete = (f: Find) =>
    Alert.alert(`${f.animal.name} löschen?`, 'Der Fund wird aus deiner Sammlung entfernt.', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => onDelete(f) },
    ]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: p.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={[styles.hx, { paddingTop: insets.top + 34 }]}>
        <HeaderBackground />
        <Text style={styles.h2}>Sammlung</Text>
        <View style={styles.stats}>
          <Stat value={String(species.length)} label="Arten" />
          <Stat value={`${groupsFound.size} / ${GROUPS.length}`} label="Gruppen" />
        </View>
      </View>

      {/* Gruppen-Kacheln, ragen in den Kopfbereich hinein */}
      <View style={styles.tiles}>
        {GROUPS.map((g) => {
          const n = species.filter((s) => groupOf(s.find.animal.gruppe)?.id === g.id).length;
          const on = filter === g.id;
          return (
            <Pressable
              key={g.id}
              onPress={() => setFilter(on ? null : g.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[
                styles.tile,
                on
                  ? { backgroundColor: '#123826', borderColor: colors.accent }
                  : { backgroundColor: p.card, borderColor: p.line },
              ]}
            >
              <GroupIcon id={g.id} size={28} color={colors.accent} />
              <Text style={[styles.tileName, { color: on ? colors.accentLight : p.ink }]}>{g.name}</Text>
              <Text style={[styles.tileCount, { color: on ? colors.accentLight : p.mute }]}>
                {n} / {fmt(g.total)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.chd}>
        <Text style={[styles.h3, { color: p.ink }]}>{active ? active.name : 'Alle'}</Text>
        {active && (
          <Pressable onPress={() => setFilter(null)} hitSlop={10}>
            <Text style={[styles.link, { color: p.moss }]}>Alle</Text>
          </Pressable>
        )}
      </View>

      {species.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: p.card, borderColor: p.line }]}>
          <Text style={[styles.h3, { color: p.ink }]}>Noch keine Funde</Text>
          <Text style={[styles.emptyText, { color: p.mute }]}>
            Fotografiere dein erstes Tier, dann landet es hier in deiner Sammlung.
          </Text>
          <Pressable onPress={onDiscover} style={[styles.btn, { backgroundColor: p.moss }]}>
            <Text style={styles.btnText}>Los geht’s</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.grid}>
          {list.map(({ find, no }) => (
            <Card key={find.id} find={find} no={no} p={p} onPress={() => onOpen(find)} onLongPress={() => askDelete(find)} />
          ))}
          <View style={[styles.card, styles.more, { borderColor: p.mute }]}>
            {active && <GroupIcon id={active.id} size={40} color={p.mute} />}
            <Text style={[styles.moreText, { color: p.mute }]}>
              {active
                ? `+ ca. ${fmt(Math.max(0, active.total - list.length))} weitere`
                : 'Noch viele Arten zu entdecken'}
            </Text>
          </View>
        </View>
      )}

      <Text style={[styles.note, { color: p.mute }]}>
        Artenzahlen: ungefähre Werte für Deutschland. Lange drücken, um einen Fund zu löschen.
      </Text>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Card({
  find,
  no,
  p,
  onPress,
  onLongPress,
}: {
  find: Find;
  no: number;
  p: Palette;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const g = groupOf(find.animal.gruppe);
  const photoUri = useFindPhoto(find.id);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: p.card, borderColor: p.line, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.ph, { backgroundColor: g?.c1 ?? '#2F6B47' }]}>
        {photoUri && (
          <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        )}
        <Text style={styles.no}>#{String(no).padStart(3, '0')}</Text>
        <View style={styles.badge}>
          <GroupIcon id={g?.id ?? null} size={16} color={colors.accentLight} />
        </View>
      </View>
      <View style={styles.tx}>
        <Text style={[styles.cardName, { color: p.ink }]} numberOfLines={2}>
          {find.animal.name}
        </Text>
        <Text style={[styles.cardSci, { color: p.mute }]} numberOfLines={1}>
          {find.animal.wissenschaftlicher_name}
        </Text>
        <Text style={[styles.cardDate, { color: p.mute }]}>{shortDate(find.date)}</Text>
      </View>
    </Pressable>
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
    marginBottom: 14,
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,210,168,0.25)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.serifBold,
    fontSize: 26,
    color: colors.accentLight,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.white,
    opacity: 0.8,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -26,
    marginHorizontal: spacing.gutter,
  },
  tile: {
    width: '31.5%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  tileName: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    marginTop: 4,
  },
  tileCount: {
    fontFamily: fonts.sans,
    fontSize: 11,
  },
  chd: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginHorizontal: spacing.gutter,
  },
  h3: {
    fontFamily: fonts.serifBold,
    fontSize: 20,
  },
  link: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 12,
    marginHorizontal: spacing.gutter,
  },
  card: {
    width: '47.5%',
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  ph: {
    height: 130,
  },
  no: {
    position: 'absolute',
    top: 7,
    left: 9,
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  badge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(10,30,20,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tx: {
    paddingTop: 9,
    paddingHorizontal: 10,
    paddingBottom: 11,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
  },
  cardName: {
    fontFamily: fonts.serifBold,
    fontSize: 15,
    lineHeight: 18,
  },
  cardSci: {
    fontFamily: fonts.sans,
    fontStyle: 'italic',
    fontSize: 12,
  },
  cardDate: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 2,
  },
  more: {
    minHeight: 200,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  moreText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    textAlign: 'center',
  },
  empty: {
    marginTop: 12,
    marginHorizontal: spacing.gutter,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    marginTop: 4,
  },
  btn: {
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
  note: {
    marginTop: 10,
    marginHorizontal: spacing.gutter,
    fontFamily: fonts.sans,
    fontSize: 12,
  },
});
