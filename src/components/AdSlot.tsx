import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '../i18n';
import { askForPlus, usePlus } from '../plus';
import { colors, fonts, Palette, spacing } from '../theme';

// Platz für eine native Anzeige (AdMob), gut als "Anzeige" gekennzeichnet.
// In Expo Go/Snack gibt es noch keine echte Werbung – dann steht hier ein Platzhalter.
// Später: nur für Gratis-Nutzer, familiengeeignet und nicht personalisiert.
type Placement = 'result' | 'details' | 'season' | 'challenges' | 'collection';

// compact: schmale Leiste (fest am unteren Rand der Sammlung)
export function AdSlot({ p, compact }: { p: Palette; placement: Placement; compact?: boolean }) {
  const { t } = useI18n();
  const { plus } = usePlus();
  if (plus) return null; // Plus: keine Werbung
  if (compact) {
    return (
      <View style={[styles.bar, { backgroundColor: p.card, borderColor: p.line }]} accessibilityLabel={t('ad.label')}>
        <View style={[styles.mediaSmall, { backgroundColor: p.line }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: p.mute, marginBottom: 1 }]}>{t('ad.label')}</Text>
          <Text style={[styles.title, { color: p.ink }]} numberOfLines={1}>
            {t('ad.placeholderTitle')}
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.card, { backgroundColor: p.card, borderColor: p.line }]} accessibilityLabel={t('ad.label')}>
      <Text style={[styles.label, { color: p.mute }]}>{t('ad.label')}</Text>
      <View style={styles.row}>
        <View style={[styles.media, { backgroundColor: p.line }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: p.ink }]}>{t('ad.placeholderTitle')}</Text>
          <Text style={[styles.text, { color: p.mute }]}>{t('ad.placeholderText')}</Text>
        </View>
      </View>
    </View>
  );
}

// Halbseitige Anzeige: schiebt sich von unten über die halbe Seite (ab dem 3. Foto des Tages,
// höchstens einmal am Tag, beim Tippen auf „Weiter“). Nach 2 Sekunden mit ✕ schließen.
const CLOSE_AFTER = 2; // Sekunden

export function AdSheet({ p, onClose }: { p: Palette; onClose: () => void }) {
  const { t } = useI18n();
  const { setPlus } = usePlus();
  const insets = useSafeAreaInsets();
  const height = Math.round(useWindowDimensions().height * 0.5);
  const slide = useRef(new Animated.Value(height)).current;
  const [wait, setWait] = useState(CLOSE_AFTER);

  useEffect(() => {
    Animated.timing(slide, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
    const timer = setInterval(() => setWait((w) => (w > 0 ? w - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [slide]);

  const close = () => {
    Animated.timing(slide, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(onClose);
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* abgedunkelter Hintergrund, fängt Tipps ab */}
      <View style={[StyleSheet.absoluteFill, styles.dim]} />
      <Animated.View
        style={[
          styles.sheet,
          {
            height,
            paddingBottom: insets.bottom + 12,
            backgroundColor: p.card,
            borderColor: p.line,
            transform: [{ translateY: slide }],
          },
        ]}
        accessibilityLabel={t('ad.label')}
      >
        <View style={styles.sheetHead}>
          <Text style={[styles.label, { color: p.mute, marginBottom: 0 }]}>{t('ad.label')}</Text>
          <Pressable
            onPress={close}
            disabled={wait > 0}
            hitSlop={12}
            style={[styles.close, { backgroundColor: p.line }]}
            accessibilityRole="button"
            accessibilityLabel={wait > 0 ? t('ad.closeIn', { n: wait }) : t('ad.close')}
          >
            <Text style={[styles.closeText, { color: p.ink }]}>{wait > 0 ? wait : '✕'}</Text>
          </Pressable>
        </View>
        {/* Platzhalter für Bild oder kurzes Video ohne Ton */}
        <View style={[styles.sheetMedia, { backgroundColor: p.line }]}>
          <Text style={{ fontSize: 30, color: colors.accent }}>▶</Text>
        </View>
        <Text style={[styles.title, { color: p.ink, marginTop: 12 }]}>{t('ad.placeholderTitle')}</Text>
        <Text style={[styles.text, { color: p.mute }]}>{t('ad.placeholderText')}</Text>
        {/* Ansporn für Plus */}
        <Pressable
          onPress={() => askForPlus(t, setPlus)}
          accessibilityRole="button"
          style={styles.plus}
        >
          <Text style={[styles.plusText, { color: p.moss }]}>{t('ad.noAds')}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: spacing.gutter,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  close: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontFamily: fonts.sansBold, fontSize: 17 },
  dim: { backgroundColor: 'rgba(0,0,0,0.35)' },
  plus: { alignSelf: 'center', marginTop: 10, paddingVertical: 6 },
  plusText: { fontFamily: fonts.sansBold, fontSize: 14 },
  sheetMedia: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    marginTop: 14,
    marginHorizontal: spacing.gutter,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  label: {
    alignSelf: 'flex-start',
    fontFamily: fonts.sansBold,
    fontSize: 10.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    paddingHorizontal: spacing.gutter,
    paddingVertical: 8,
  },
  mediaSmall: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  media: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  title: { fontFamily: fonts.sansBold, fontSize: 14 },
  text: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 2,
  },
});
