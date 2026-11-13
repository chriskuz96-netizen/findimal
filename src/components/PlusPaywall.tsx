import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SERVER_URL } from '../config';
import { useI18n } from '../i18n';
import { isActive, revenueCat } from '../plus';
import { colors, fonts } from '../theme';

// Kaufseite für Explorimal Plus (Jahres- oder Monatsabo aus dem RevenueCat-Angebot „default“).
// Apple verlangt hier: Preis und Laufzeit, Hinweis auf die automatische Verlängerung,
// „Käufe wiederherstellen“ sowie Links zu Nutzungsbedingungen und Datenschutz.

const EULA = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const GOLD = '#E8B53A';

type Pkg = {
  identifier: string;
  packageType: string;
  product: { priceString: string; price: number; pricePerMonthString?: string | null };
};

export function PlusPaywall({ visible, onClose, onActive }: { visible: boolean; onClose: () => void; onActive: () => void }) {
  const { t, lang } = useI18n();
  const insets = useSafeAreaInsets();
  const [year, setYear] = useState<Pkg | null>(null);
  const [month, setMonth] = useState<Pkg | null>(null);
  const [pick, setPick] = useState<'year' | 'month'>('year');
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'busy'>('loading');

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setState('loading');
    revenueCat()
      .then(async (rc) => {
        if (!rc) throw new Error('no rc');
        const cur = (await rc.getOfferings()).current;
        if (!alive) return;
        const y = (cur?.annual ?? null) as Pkg | null;
        const m = (cur?.monthly ?? null) as Pkg | null;
        if (!y && !m) throw new Error('no packages');
        setYear(y);
        setMonth(m);
        setPick(y ? 'year' : 'month');
        setState('ready');
      })
      .catch(() => alive && setState('error'));
    return () => {
      alive = false;
    };
  }, [visible]);

  const chosen = pick === 'year' ? year : month;
  const save =
    year && month && month.product.price > 0 ? Math.round((1 - year.product.price / (month.product.price * 12)) * 100) : 0;

  const done = (msg: string) => {
    onActive();
    onClose();
    Alert.alert(t('plus.title'), msg);
  };

  const buy = async () => {
    const rc = await revenueCat();
    if (!rc || !chosen) return;
    setState('busy');
    try {
      const { customerInfo } = await rc.purchasePackage(chosen as never);
      if (isActive(customerInfo)) return done(t('pw.thanks'));
      setState('ready');
    } catch (e) {
      setState('ready');
      if (!(e as { userCancelled?: boolean })?.userCancelled) Alert.alert(t('plus.title'), t('pw.error'));
    }
  };

  const restore = async () => {
    const rc = await revenueCat();
    if (!rc) return;
    setState('busy');
    try {
      const info = await rc.restorePurchases();
      if (isActive(info)) return done(t('pw.restored'));
      setState('ready');
      Alert.alert(t('plus.title'), t('pw.nothing'));
    } catch {
      setState('ready');
      Alert.alert(t('plus.title'), t('pw.error'));
    }
  };

  const privacy = `${SERVER_URL.replace(/\/$/, '')}/datenschutz${lang === 'de' ? '' : `?l=${lang}`}`;
  const busy = state === 'busy';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.dim} onPress={busy ? undefined : onClose} accessibilityLabel={t('pw.close')} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 14 }]}>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          <View style={styles.head}>
            <Text style={styles.title}>★ {t('plus.title')}</Text>
            <Pressable onPress={onClose} disabled={busy} hitSlop={10} style={styles.close} accessibilityRole="button" accessibilityLabel={t('pw.close')}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.sub}>{t('plus.sub')}</Text>
          {(['plus.b1', 'plus.b2', 'plus.b6', 'plus.b3', 'plus.b4', 'plus.b5'] as const).map((k) => (
            <View key={k} style={styles.row}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.text}>{t(k)}</Text>
            </View>
          ))}

          {state === 'loading' && <ActivityIndicator color={GOLD} style={{ marginVertical: 28 }} />}
          {state === 'error' && <Text style={styles.error}>{t('pw.unavailable')}</Text>}

          {(state === 'ready' || busy) && (
            <View style={styles.options}>
              {year && (
                <Option
                  on={pick === 'year'}
                  onPress={() => setPick('year')}
                  title={t('pw.year')}
                  price={t('pw.perYear', { price: year.product.priceString })}
                  note={year.product.pricePerMonthString ? t('pw.monthly', { price: year.product.pricePerMonthString }) : undefined}
                  badge={save >= 5 ? t('pw.save', { n: save }) : undefined}
                />
              )}
              {month && (
                <Option
                  on={pick === 'month'}
                  onPress={() => setPick('month')}
                  title={t('pw.month')}
                  price={t('pw.perMonth', { price: month.product.priceString })}
                />
              )}
              <Pressable
                onPress={buy}
                disabled={busy || !chosen}
                style={({ pressed }) => [styles.buy, { opacity: pressed || busy ? 0.8 : 1 }]}
                accessibilityRole="button"
              >
                {busy ? <ActivityIndicator color="#13261C" /> : <Text style={styles.buyText}>{t('pw.buy')}</Text>}
              </Pressable>
            </View>
          )}

          <Pressable onPress={restore} disabled={busy || state === 'loading'} style={styles.restore} accessibilityRole="button">
            <Text style={styles.restoreText}>{t('pw.restore')}</Text>
          </Pressable>
          <Text style={styles.terms}>{t('pw.terms')}</Text>
          <View style={styles.links}>
            <Text style={styles.link} onPress={() => Linking.openURL(EULA)} accessibilityRole="link">
              {t('pw.eula')}
            </Text>
            <Text style={styles.terms}>·</Text>
            <Text style={styles.link} onPress={() => Linking.openURL(privacy)} accessibilityRole="link">
              {t('pw.privacy')}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Option({
  on,
  onPress,
  title,
  price,
  note,
  badge,
}: {
  on: boolean;
  onPress: () => void;
  title: string;
  price: string;
  note?: string;
  badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, on && styles.optionOn]}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
    >
      <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.dot} />}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optTitle}>{title}</Text>
        <Text style={styles.optPrice}>{price}</Text>
        {note && <Text style={styles.optNote}>{note}</Text>}
      </View>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    maxHeight: '92%',
    backgroundColor: '#123826',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderColor: GOLD,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.serifBold, fontSize: 23, color: '#FFD45E' },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  closeText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.white },
  sub: { fontFamily: fonts.sans, fontSize: 14.5, color: colors.accentLight, marginTop: 2, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginTop: 6 },
  check: { fontFamily: fonts.sansBold, fontSize: 15, color: '#FFD45E' },
  text: { flex: 1, fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, color: colors.white },
  error: { fontFamily: fonts.sans, fontSize: 14.5, color: colors.accentLight, textAlign: 'center', marginVertical: 24 },
  options: { marginTop: 16, gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    padding: 14,
  },
  optionOn: { borderColor: GOLD, backgroundColor: 'rgba(232,181,58,0.12)' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: GOLD },
  dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: GOLD },
  optTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.white },
  optPrice: { fontFamily: fonts.sans, fontSize: 14.5, color: colors.white, marginTop: 1 },
  optNote: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.accentLight, marginTop: 1 },
  badge: { backgroundColor: GOLD, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 12, color: '#13261C' },
  buy: { marginTop: 4, backgroundColor: GOLD, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  buyText: { fontFamily: fonts.sansBold, fontSize: 17, color: '#13261C' },
  restore: { alignSelf: 'center', paddingVertical: 10, marginTop: 6 },
  restoreText: { fontFamily: fonts.sans, fontSize: 14, color: colors.accentLight, textDecorationLine: 'underline' },
  terms: { fontFamily: fonts.sans, fontSize: 11.5, lineHeight: 16, color: 'rgba(255,255,255,0.65)', textAlign: 'center' },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 6, marginBottom: 4 },
  link: { fontFamily: fonts.sans, fontSize: 12, color: colors.accentLight, textDecorationLine: 'underline' },
});
