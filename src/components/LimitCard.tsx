import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Translate, useI18n } from '../i18n';
import { askForPlus, PLUS_AVATARS, usePlus } from '../plus';
import { colors, darkPalette, fonts, lightPalette, Palette } from '../theme';
import { FREE_PHOTOS_PER_DAY, VIDEOS_PER_DAY, videosToday } from '../usage';
import { AdSlot } from './AdSlot';
import { PlusCard } from './PlusCard';
import { Avatar } from './Avatar';
import { Explorer } from './Explorer';

const GOLD = '#E8B53A';

// Werbevideos gibt es erst in der fertigen App (nicht in Expo Go/Snack).
// Belohnungs-Video starten: gibt es erst in der fertigen App (kommt mit AdMob).
// Danach: addVideoToday() und direkt die Kamera öffnen.
export function watchVideo(t: Translate) {
  Alert.alert(t('lim.title'), t('lim.soon'));
}

// Fenster, wenn die Gratis-Fotos für heute aufgebraucht sind:
// Video ansehen (+1 Foto) als Hauptweg, Findimal Plus als zweiter, „morgen weiter“ als ruhiger Ausweg.
export function LimitSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { setPlus } = usePlus();
  // Videos heute schon angesehen: sind alle weg, gibt es nur noch Plus (und morgen neue Fotos)
  const [videos, setVideos] = useState<number | null>(null); // null = wird geladen
  useEffect(() => {
    if (visible) videosToday().then(setVideos);
    else setVideos(null);
  }, [visible]);
  if (videos === null) return null;
  if (videos >= VIDEOS_PER_DAY) return <DoneSheet visible={visible} onClose={onClose} />;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.dim} onPress={onClose} accessibilityLabel={t('ad.close')} />
      <View style={[styles.sheet, { backgroundColor: p.card, paddingBottom: insets.bottom + 14 }]}>
        {/* Kopf: Forscher und freundliche Überschrift */}
        <View style={styles.hero}>
          <Explorer size={58} />
          <Text style={styles.heroTitle}>{t('lim.head')}</Text>
          <Text style={styles.heroText}>{t('lim.used', { n: FREE_PHOTOS_PER_DAY })}</Text>
          <View style={styles.dots}>
            {Array.from({ length: FREE_PHOTOS_PER_DAY }, (_, i) => (
              <View key={i} style={styles.dot}>
                <Text style={styles.dotText}>✓</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.body}>
          {/* Hauptweg: Video ansehen */}
          <Pressable
            onPress={() => watchVideo(t)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.video, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <View style={styles.play}>
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Path d="M8 5.5v13l10.5-6.5z" fill={colors.accent} />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.videoTitle}>{t('lim.videoTitle')}</Text>
              <Text style={styles.videoSub}>{t('lim.videoSub')}</Text>
            </View>
            <View style={styles.bonus}>
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" fill="none" stroke={colors.ink} strokeWidth={2} strokeLinejoin="round" />
                <Circle cx={12} cy={13.2} r={3.2} fill="none" stroke={colors.ink} strokeWidth={2} />
              </Svg>
              <Text style={styles.bonusText}>+1</Text>
            </View>
          </Pressable>
          <Text style={[styles.videoMax, { color: p.mute }]}>{t('lim.videoLeft', { n: VIDEOS_PER_DAY - (videos ?? 0) })}</Text>

          {/* Zweiter Weg: Findimal Plus */}
          <View style={styles.plus}>
            <View style={[styles.plusHead, { marginBottom: 4 }]}>
              <Text style={styles.plusTitle}>★ {t('plus.title')}</Text>
              <View style={styles.plusAvatars}>
                {PLUS_AVATARS.slice(0, 3).map((a) => (
                  <Avatar key={a.id} id={a.id} name="" size={26} />
                ))}
              </View>
            </View>
            {(['plus.b1', 'plus.b2', 'plus.b3'] as const).map((k) => (
              <Text key={k} style={styles.plusPerks}>
                <Text style={styles.plusCheck}>✓ </Text>
                {t(k)}
              </Text>
            ))}
            <Pressable
              onPress={() => {
                onClose();
                askForPlus(t, setPlus);
              }}
              accessibilityRole="button"
              style={({ pressed }) => [styles.plusBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={styles.plusBtnText}>{t('lim.plusBtn')}</Text>
            </Pressable>
            <Text style={styles.plusYear}>{t('lim.plusYear')}</Text>
          </View>

          {/* Ruhiger Ausweg */}
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" style={styles.later}>
            <Text style={[styles.laterText, { color: p.mute }]}>{t('lim.tomorrow')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Alles aufgebraucht (auch die Videos): ein netter Spruch, Findimal Plus wie im Profil, darunter Werbung
function DoneSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  // jeden Tag ein anderer Spruch
  const n = (Math.floor(Date.now() / 86_400_000) % 3) + 1;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.dimShort} onPress={onClose} accessibilityLabel={t('ad.close')} />
      <View style={[styles.sheet, styles.sheetTall, { backgroundColor: p.bg }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
          <View style={styles.hero}>
            <Explorer size={58} />
            <Text style={styles.heroTitle}>{t(`lim.done${n}` as 'lim.done1')}</Text>
            <Text style={styles.heroText}>{t(`lim.doneSub${n}` as 'lim.doneSub1')}</Text>
          </View>
          <PlusCard name="" style={{ marginTop: 16 }} onGet={onClose} />
          <View style={{ marginTop: 4 }}>
            <AdSlot p={p} placement="limit" />
          </View>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" style={styles.later}>
            <Text style={[styles.laterText, { color: p.mute }]}>{t('lim.tomorrow')}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

// Auf der Ergebnisseite: kurze Karte, die dasselbe Fenster öffnet
export function LimitCard({ p, style }: { p: Palette; style?: ViewStyle }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.card, { backgroundColor: p.card }, style]}>
      <Text style={[styles.title, { color: p.ink }]}>{t('lim.head')}</Text>
      <Text style={[styles.text, { color: p.mute }]}>{t('lim.used', { n: FREE_PHOTOS_PER_DAY })}</Text>
      <Pressable onPress={() => setOpen(true)} style={styles.cardBtn} accessibilityRole="button">
        <Text style={styles.cardBtnText}>{t('lim.more')}</Text>
      </Pressable>
      <LimitSheet visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  dimShort: { height: '8%', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheetTall: { flex: 1 },
  sheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden' },
  hero: { backgroundColor: '#17462F', alignItems: 'center', paddingTop: 22, paddingBottom: 18, paddingHorizontal: 24 },
  heroTitle: { fontFamily: fonts.serifBold, fontSize: 23, color: colors.white, marginTop: 10, textAlign: 'center' },
  heroText: { fontFamily: fonts.sans, fontSize: 14.5, color: colors.accentLight, marginTop: 4, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 8, marginTop: 12 },
  dot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#6FBF8A', alignItems: 'center', justifyContent: 'center' },
  dotText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.white },
  body: { paddingHorizontal: 18, paddingTop: 16 },
  video: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.accent,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  play: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  videoTitle: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.ink },
  videoSub: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.ink, opacity: 0.8, marginTop: 1 },
  bonus: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.white, borderRadius: 14, paddingHorizontal: 9, paddingVertical: 6 },
  bonusText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  videoMax: { fontFamily: fonts.sans, fontSize: 12.5, textAlign: 'center', marginTop: 6 },
  plus: { marginTop: 14, backgroundColor: '#123826', borderRadius: 18, borderWidth: 1.5, borderColor: GOLD, padding: 14 },
  plusHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  plusTitle: { fontFamily: fonts.serifBold, fontSize: 19, color: '#FFD45E' },
  plusAvatars: { flexDirection: 'row', gap: 4 },
  plusPerks: { fontFamily: fonts.sans, fontSize: 14, color: colors.white, marginTop: 4, lineHeight: 20 },
  plusCheck: { fontFamily: fonts.sansBold, color: '#FFD45E' },
  plusBtn: { marginTop: 12, backgroundColor: GOLD, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  plusBtnText: { fontFamily: fonts.sansBold, fontSize: 15.5, color: '#13261C' },
  plusYear: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.accentLight, textAlign: 'center', marginTop: 6 },
  later: { alignSelf: 'center', paddingVertical: 12, marginTop: 2 },
  laterText: { fontFamily: fonts.sans, fontSize: 14, textDecorationLine: 'underline' },
  card: { marginTop: 14, marginHorizontal: 18, borderRadius: 20, padding: 16, borderWidth: 2, borderColor: colors.accent },
  title: { fontFamily: fonts.serifBold, fontSize: 18 },
  text: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 20, marginTop: 4 },
  cardBtn: { marginTop: 12, backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  cardBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
});
