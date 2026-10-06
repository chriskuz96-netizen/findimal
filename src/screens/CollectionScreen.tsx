import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderBackground } from '../components/HeaderBackground';
import { FindsMap } from '../components/map/FindsMap';
import { Find, speciesKey, useFindPhoto } from '../finds';
import { GroupIcon, GroupId, groupOf, GROUPS } from '../groups';
import { useI18n } from '../i18n';
import { colors, darkPalette, fonts, lightPalette, Palette, spacing } from '../theme';

type Props = {
  finds: Find[];
  onOpen: (find: Find) => void;
  onDelete: (find: Find) => void;
  onDiscover: () => void;
};

// Sammlung als Fotoalbum: zuerst die eigenen Fotos, danach die Arten nach Gruppen.
export function CollectionScreen({ finds, onOpen, onDelete, onDiscover }: Props) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t, locale } = useI18n();
  const fmt = (n: number) => n.toLocaleString(locale);
  const [filter, setFilter] = useState<GroupId | null>(null);
  const [mode, setMode] = useState<'photos' | 'map'>('photos');
  // Kachelbreite fest ausrechnen (zwei Spalten) – Prozentwerte zeigt das iPhone hier nicht zuverlässig an
  const { width } = useWindowDimensions();
  const tileW = Math.floor((width - spacing.gutter * 2 - GAP) / 2);

  // Arten (pro Art der erste Fund) für Zähler und Gruppen-Übersicht
  const speciesKeys = new Set<string>();
  const speciesFinds: Find[] = [];
  for (const f of finds) {
    const k = speciesKey(f.animal);
    if (!speciesKeys.has(k)) {
      speciesKeys.add(k);
      speciesFinds.push(f);
    }
  }
  const groupsFound = new Set(speciesFinds.map((f) => groupOf(f.animal.gruppe)?.id).filter(Boolean));
  const inFilter = (f: Find) => !filter || groupOf(f.animal.gruppe)?.id === filter;
  const photos = finds.filter(inFilter).slice().reverse(); // alle eigenen Fotos, neueste zuerst

  const askDelete = (f: Find) =>
    Alert.alert(t('col.deleteTitle', { name: f.animal.name }), t('col.deleteText'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => onDelete(f) },
    ]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: p.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
      {/* Kopf mit Zählern */}
      <View style={[styles.hx, { paddingTop: insets.top + 30 }]}>
        <HeaderBackground />
        <Text style={styles.h2}>{t('col.title')}</Text>
        <View style={styles.stats}>
          <Stat value={String(finds.length)} label={t('col.photos')} />
          <Stat value={String(speciesKeys.size)} label={t('col.species')} />
          <Stat value={`${groupsFound.size}/${GROUPS.length}`} label={t('col.groups')} />
        </View>
      </View>

      {finds.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: p.card, borderColor: p.line }]}>
          <Text style={[styles.h3, { color: p.ink }]}>{t('col.emptyTitle')}</Text>
          <Text style={[styles.emptyText, { color: p.mute }]}>{t('col.emptyText')}</Text>
          <Pressable onPress={onDiscover} style={[styles.btn, { backgroundColor: p.moss }]}>
            <Text style={styles.btnText}>{t('col.go')}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Umschalter Fotos / Karte */}
          <View style={[styles.seg, { backgroundColor: p.card, borderColor: p.line }]}>
            {(['photos', 'map'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === m }}
                style={[styles.segBtn, mode === m && styles.segOn]}
              >
                <Text style={[styles.segText, { color: mode === m ? colors.accentLight : p.ink }]}>
                  {t(m === 'photos' ? 'col.photos' : 'col.map')}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Gruppen-Filter als kleine Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipRow}
            contentContainerStyle={styles.chips}
          >
            <Chip label={t('col.all')} on={!filter} onPress={() => setFilter(null)} p={p} />
            {GROUPS.filter((g) => finds.some((f) => groupOf(f.animal.gruppe)?.id === g.id)).map((g) => (
              <Chip
                key={g.id}
                label={t(`g.${g.id}`)}
                icon={g.id}
                on={filter === g.id}
                onPress={() => setFilter(filter === g.id ? null : g.id)}
                p={p}
              />
            ))}
          </ScrollView>

          {mode === 'photos' ? (
            <View style={styles.grid}>
              {photos.map((f) => (
                <PhotoTile
                  key={f.id}
                  find={f}
                  locale={locale}
                  width={tileW}
                  onPress={() => onOpen(f)}
                  onLongPress={() => askDelete(f)}
                />
              ))}
            </View>
          ) : photos.some((f) => f.coords) ? (
            <>
              <View style={styles.map}>
                <FindsMap finds={photos} locale={locale} onOpen={onOpen} />
              </View>
              <Text style={[styles.note, { color: p.mute }]}>{t('col.mapHint')}</Text>
            </>
          ) : (
            <View style={[styles.empty, { backgroundColor: p.card, borderColor: p.line }]}>
              <Text style={[styles.emptyText, { color: p.mute }]}>{t('col.noPlaces')}</Text>
            </View>
          )}

          {/* Danach: Arten nach Gruppen */}
          <View style={styles.section}>
            <Text style={[styles.h3, { color: p.ink }]}>{t('col.byGroup')}</Text>
            <Text style={[styles.sub, { color: p.mute }]}>{t('col.byGroupSub')}</Text>
          </View>
          <View style={styles.groups}>
            {GROUPS.map((g) => {
              const n = speciesFinds.filter((f) => groupOf(f.animal.gruppe)?.id === g.id).length;
              const on = filter === g.id;
              const share = Math.min(1, n / Math.min(g.total, 50)); // Balken: sichtbar wachsen, auch bei vielen Arten
              return (
                <Pressable
                  key={g.id}
                  onPress={() => setFilter(on ? null : g.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[
                    styles.group,
                    { backgroundColor: p.card, borderColor: on ? colors.accent : p.line },
                  ]}
                >
                  <View style={[styles.groupIcon, { backgroundColor: g.c1 }]}>
                    <GroupIcon id={g.id} size={22} color={colors.accentLight} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.groupHead}>
                      <Text style={[styles.groupName, { color: p.ink }]}>{t(`g.${g.id}`)}</Text>
                      <Text style={[styles.groupCount, { color: p.mute }]}>
                        {n} / {fmt(g.total)}
                      </Text>
                    </View>
                    <View style={[styles.groupBar, { backgroundColor: p.line }]}>
                      <View style={[styles.groupFill, { width: `${Math.max(n ? 6 : 0, share * 100)}%` }]} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.note, { color: p.mute }]}>{t('col.note')}</Text>
        </>
      )}
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

function Chip({
  label,
  icon,
  on,
  onPress,
  p,
}: {
  label: string;
  icon?: GroupId;
  on: boolean;
  onPress: () => void;
  p: Palette;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={[styles.chip, on ? { backgroundColor: '#1F5639', borderColor: '#1F5639' } : { backgroundColor: p.card, borderColor: p.line }]}
    >
      {icon && <GroupIcon id={icon} size={16} color={on ? colors.accentLight : colors.accent} />}
      <Text style={[styles.chipText, { color: on ? colors.accentLight : p.ink }]}>{label}</Text>
    </Pressable>
  );
}

const GAP = 10;

// Großes Foto-Kärtchen mit Name und Datum auf dem Bild
function PhotoTile({
  find,
  locale,
  width,
  onPress,
  onLongPress,
}: {
  find: Find;
  locale: string;
  width: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const uri = useFindPhoto(find.id);
  const g = groupOf(find.animal.gruppe);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={find.animal.name}
      style={[styles.tile, { width, height: Math.round(width / 0.85), backgroundColor: g?.c1 ?? '#2F6B47' }]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ position: 'absolute', left: 0, top: 0, width, height: Math.round(width / 0.85) }}
          resizeMode="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.tilePlaceholder]}>
          <GroupIcon id={g?.id ?? null} size={40} color={colors.accentLight} />
        </View>
      )}
      <View style={styles.badge}>
        <GroupIcon id={g?.id ?? null} size={14} color={colors.accentLight} />
      </View>
      <View style={styles.caption}>
        <Text style={styles.captionName} numberOfLines={2}>
          {find.animal.name}
        </Text>
        <Text style={styles.captionDate}>{new Date(find.date).toLocaleDateString(locale)}</Text>
      </View>
      {/* dünner Rand in Akzentfarbe unten, wie die Karten der Vorlage */}
      <View style={styles.tileLine} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hx: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: 22,
    borderBottomLeftRadius: spacing.radiusHero,
    borderBottomRightRadius: spacing.radiusHero,
    overflow: 'hidden',
  },
  h2: { fontFamily: fonts.serifBold, fontSize: 28, color: colors.white, marginBottom: 12 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,210,168,0.25)',
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statValue: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.accentLight },
  statLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.white, opacity: 0.8 },
  seg: {
    flexDirection: 'row',
    borderRadius: 99,
    borderWidth: 1,
    padding: 3,
    marginTop: 14,
    marginHorizontal: spacing.gutter,
  },
  segBtn: { flex: 1, borderRadius: 99, paddingVertical: 8, alignItems: 'center' },
  segOn: { backgroundColor: '#1F5639' },
  segText: { fontFamily: fonts.sansBold, fontSize: 14 },
  chipRow: { flexGrow: 0 },
  chips: { gap: 8, paddingHorizontal: spacing.gutter, paddingTop: 12, paddingBottom: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipText: { fontFamily: fonts.sansBold, fontSize: 14 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    marginTop: 12,
    marginHorizontal: spacing.gutter,
  },
  tile: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  tilePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(10,30,20,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 18,
    paddingBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  captionName: { fontFamily: fonts.serifBold, fontSize: 14.5, lineHeight: 17, color: colors.white },
  captionDate: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.white, opacity: 0.85 },
  tileLine: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: colors.accent },
  map: {
    height: 420,
    marginTop: 12,
    marginHorizontal: spacing.gutter,
    borderRadius: 22,
    overflow: 'hidden',
  },
  section: { marginTop: 28, marginHorizontal: spacing.gutter },
  h3: { fontFamily: fonts.serifBold, fontSize: 20 },
  sub: { fontFamily: fonts.sans, fontSize: 13.5, marginTop: 2 },
  groups: { marginTop: 10, marginHorizontal: spacing.gutter, gap: 8 },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  groupIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  groupHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  groupName: { fontFamily: fonts.sansBold, fontSize: 15 },
  groupBar: { height: 6, borderRadius: 6, marginTop: 6, overflow: 'hidden' },
  groupFill: { height: '100%', backgroundColor: colors.accent },
  groupCount: { fontFamily: fonts.sansBold, fontSize: 13 },
  empty: {
    marginTop: 14,
    marginHorizontal: spacing.gutter,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  emptyText: { fontFamily: fonts.sans, fontSize: 14.5, marginTop: 4 },
  btn: { marginTop: 12, borderRadius: 16, padding: 14, alignItems: 'center' },
  btnText: { color: colors.white, fontFamily: fonts.sansBold, fontSize: 17 },
  note: { marginTop: 10, marginHorizontal: spacing.gutter, fontFamily: fonts.sans, fontSize: 12 },
});
