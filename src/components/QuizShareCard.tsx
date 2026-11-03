import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Translate } from '../i18n';
import { colors, fonts } from '../theme';
import { AppLogo } from './AppLogo';
import { Explorer } from './Explorer';
import { Icon } from './Icon';
import { ViewRef } from './ShareCard';

// Größe auf dem Bildschirm (unsichtbar) – gespeichert wird in 1080 × 1350 (wie die Fund-Karte)
const W = 360;
const H = 450;

type Props = { t: Translate; correct: number; total: number; days: number; xp: number; facts: string[] };

// Teilen-Bild fürs Forscher-Quiz: Forscher, Ergebnis, Serie und bis zu 3 Kurz-Fakten.
// Wird außerhalb des Bildschirms gezeichnet und mit shareCard() aus ShareCard.tsx fotografiert.
export const QuizShareCard = forwardRef<ViewRef, Props>(function QuizShareCard({ t, correct, total, days, xp, facts }, ref) {
  return (
    <View ref={ref} collapsable={false} style={styles.card} pointerEvents="none">
      <View style={styles.top}>
        <Explorer size={84} />
        <Text style={styles.title}>{t('fq.title')}</Text>
        <Text style={styles.score}>
          {correct} / {total}
        </Text>
        <View style={styles.chips}>
          <View style={styles.xp}>
            <Text style={styles.xpText}>+{xp} XP</Text>
          </View>
          <View style={styles.chip}>
            <Icon name="flame" size={13} color={colors.accent} />
            <Text style={styles.chipText}>{days === 1 ? t('fq.days1') : t('fq.days', { n: days })}</Text>
          </View>
        </View>
      </View>
      <View style={styles.facts}>
        {facts.map((k, i) => {
          const cut = k.search(/[:：]/);
          return (
            <Text key={i} style={styles.fact} numberOfLines={2}>
              <Text style={styles.dot}>• </Text>
              {cut > 0 ? (
                <>
                  <Text style={styles.factHead}>{k.slice(0, cut + 1)}</Text>
                  {k.slice(cut + 1)}
                </>
              ) : (
                k
              )}
            </Text>
          );
        })}
      </View>
      <View style={styles.foot}>
        <AppLogo size={22} />
        <Text style={styles.brand}>Findimal</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { position: 'absolute', left: -10000, top: 0, width: W, height: H, backgroundColor: '#17462F', padding: 20 },
  top: { alignItems: 'center' },
  title: { fontFamily: fonts.serifBold, fontSize: 18, color: colors.accentLight, marginTop: 8 },
  score: { fontFamily: fonts.serifBold, fontSize: 46, color: colors.white, marginTop: 2 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 4 },
  xp: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  xpText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.ink },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.white },
  facts: { flex: 1, justifyContent: 'center', gap: 8, paddingVertical: 10 },
  fact: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 20, color: colors.white, opacity: 0.95 },
  dot: { color: colors.accentLight },
  factHead: { fontFamily: fonts.sansBold },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  brand: { fontFamily: fonts.serifBold, fontSize: 15, color: colors.white },
});
