import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SERVER_URL } from '../config';
import { Find } from '../finds';
import { useI18n } from '../i18n';
import { colors, fonts, Palette, spacing } from '../theme';

type Top = { total: number; top: { sci: string; name: string; count: number }[] };

const MIN_FINDS = 20; // erst zeigen, wenn genug gezählt wurde
const SHOW = 3;

// Die beliebtesten Tiere der Saison bei allen Findimal-Entdeckern (anonym gezählt auf dem Server).
// Schon selbst gefundene Arten bekommen ein Häkchen.
export function SeasonTop({ finds, p }: { finds: Find[]; p: Palette }) {
  const { t, lang } = useI18n();
  const [data, setData] = useState<Top | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${SERVER_URL.replace(/\/$/, '')}/saison-top?l=${lang}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Top | null) => alive && d && Array.isArray(d.top) && setData(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [lang]);

  if (!data || data.total < MIN_FINDS || !data.top.length) return null;
  const mine = new Set(finds.map((f) => (f.animal.wissenschaftlicher_name || f.animal.name).trim().toLowerCase()));

  return (
    <View style={[styles.card, { backgroundColor: p.card, borderColor: p.line }]}>
      <Text style={[styles.h3, { color: p.ink }]}>🏆 {t('sea.top')}</Text>
      <Text style={[styles.sub, { color: p.mute }]}>{t('sea.topSub')}</Text>
      {data.top.slice(0, SHOW).map((a, i) => {
        const found = mine.has(a.sci);
        return (
          <View key={a.sci} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: p.line }]}>
            <View style={[styles.rank, i === 0 && { backgroundColor: colors.accent }]}>
              <Text style={[styles.rankText, i === 0 && { color: colors.ink }]}>{i + 1}</Text>
            </View>
            <Text style={[styles.name, { color: p.ink }]} numberOfLines={1}>
              {a.name}
            </Text>
            <Text style={[styles.state, { color: found ? p.moss : p.mute }]}>
              {found ? `✓ ${t('sea.topFound')}` : t('sea.topOpen')}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 18, marginHorizontal: spacing.gutter, borderWidth: 1, borderRadius: 20, padding: 16 },
  h3: { fontFamily: fonts.serifBold, fontSize: 19 },
  sub: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, marginTop: 2, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9 },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#123826',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.accentLight },
  name: { flex: 1, fontFamily: fonts.sansBold, fontSize: 16 },
  state: { fontFamily: fonts.sansBold, fontSize: 13 },
});
