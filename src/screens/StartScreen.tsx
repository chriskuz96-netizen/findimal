import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdSlot } from '../components/AdSlot';
import { AppLogo } from '../components/AppLogo';
import { CameraButton } from '../components/CameraButton';
import { Explorer } from '../components/Explorer';
import { JungleBackground } from '../components/JungleBackground';
import { NearbyList } from '../components/NearbyList';
import { Avatar } from '../components/Avatar';
import { Icon } from '../components/Icon';
import { LanguageButton } from '../components/LanguageButton';
import { useI18n } from '../i18n';
import { usePlus } from '../plus';
import { Snail } from '../components/animals/Snail';
import { Frog } from '../components/animals/Frog';
import { Hedgehog } from '../components/animals/Hedgehog';
import { Ladybug } from '../components/animals/Ladybug';
import { Robin } from '../components/animals/Robin';
import { Squirrel } from '../components/animals/Squirrel';
import { colors, darkPalette, fonts, lightPalette, spacing } from '../theme';
import { usePane } from '../layout';
import { daysUsed, START_AD_FROM_DAY } from '../usage';


type Props = {
  name: string | null;
  region: string;
  onSetRegion: (place: string) => void;
  onTypeRegion: () => void;
  onOpenProfile: () => void;
  xp: number;
  avatar: string | null; // Abzeichen oder Plus-Tier als Profilbild
  freeLeft: number; // Gratis-Fotos, die heute noch übrig sind
  videosLeft: number; // Extra-Fotos per Video, die heute noch gehen
  onWatchVideo: () => void; // Video direkt starten
  onTakePhoto: () => void;
  onPickPhoto: () => void;
  firstVisit?: boolean; // gerade erst eingerichtet
  quizOpen?: boolean; // Forscher-Quiz heute noch nicht gespielt
  streak?: number; // Quiz-Serie in Tagen (0 = keine)
  onOpenQuiz?: () => void; // zur Challenges-Seite
};

// größte bisher gebrauchte Höhe von „Jetzt in deiner Nähe“ (bleibt beim Tab-Wechsel erhalten)
let maxNearby = 0;

export function StartScreen({
  name,
  region,
  onSetRegion,
  onTypeRegion,
  onOpenProfile,
  xp,
  avatar,
  freeLeft,
  videosLeft,
  onWatchVideo,
  onTakePhoto,
  onPickPhoto,
  firstVisit,
  quizOpen,
  onOpenQuiz,
  streak = 0,
}: Props) {
  const insets = useSafeAreaInsets();
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const { t, nickname } = useI18n();
  const { plus } = usePlus();
  // direkt nach der Einrichtung „Willkommen“, danach „Willkommen zurück“
  const greeting = name ? t(firstVisit ? 'start.welcomeNew' : 'start.welcome', { name, nick: nickname }) : t('start.hello');
  const { width, height } = usePane(); // bei zwei Seiten (Duo quer) nur die linke Hälfte
  const [nearbyHeight, setNearbyHeight] = useState(maxNearby);
  // Wie im Entwurf: clamp(120px, 21vh, 168px)
  const hint = !!quizOpen && !!onOpenQuiz;
  // feste Werbeleiste unten erst ab dem 3. Tag (nie mit Plus)
  const [adBar, setAdBar] = useState(false);
  useEffect(() => {
    if (plus) return setAdBar(false);
    let alive = true;
    daysUsed().then((n) => alive && setAdBar(n >= START_AD_FROM_DAY));
    return () => {
      alive = false;
    };
  }, [plus]);
  // kleine iPhones: mit Quiz-Hinweis etwas kleinere Kamera, damit oben und unten Luft bleibt
  // mit Werbeleiste auf kleinen iPhones ebenfalls etwas kleiner
  const small = height < 760 && (hint || adBar);
  const camSize = Math.min(168, Math.max(small ? 108 : 120, height * 0.21 - (small ? 26 : 0)));

  return (
    <View style={[styles.screen, { backgroundColor: p.bg }]}>
      <View style={styles.hero}>
        <JungleBackground />

        {/* Die vier Tiere in den Ecken */}
        <View style={[styles.animal, { right: 0, top: insets.top + 82 }]}>
          <Squirrel width={58} />
        </View>
        <View style={[styles.animal, { right: width * 0.06, bottom: '8%' }]}>
          <Frog width={46} />
        </View>
        <View style={[styles.animal, { left: width * 0.05, bottom: '7%' }]}>
          <Hedgehog width={46} />
        </View>
        {/* weitere kleine Tiere, die man draußen finden kann */}
        <View style={[styles.animal, { left: width * 0.03, top: '36%' }]}>
          <Robin width={40} />
        </View>
        <View style={[styles.animal, { right: width * 0.03, top: '52%' }]}>
          <Snail width={40} />
        </View>

        {/* Profilbild: Anfangsbuchstabe oder Abzeichen, öffnet das Profil */}
        <Pressable
          onPress={onOpenProfile}
          accessibilityRole="button"
          accessibilityLabel={t('a11y.profile')}
          style={[styles.avatarMedal, { top: insets.top + 4 }]}
        >
          <Avatar id={avatar} name={name ?? '?'} size={AVATAR} />
        </Pressable>
        <Text style={[styles.avatarXp, { top: insets.top + AVATAR + 4 }]}>{xp} XP</Text>
        {/* Quiz-Serie (wie in den Challenges): Flamme mit Tagen, antippen öffnet die Challenges */}
        {streak > 0 && (
          <Pressable
            onPress={onOpenQuiz}
            disabled={!onOpenQuiz}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${streak} ${t(streak === 1 ? 'fq.streakDay' : 'fq.streakDays')}`}
            style={[styles.avatarStreak, { top: insets.top + AVATAR + 26 }]}
          >
            <Icon name="flame" size={12} color={colors.accent} />
            <Text style={styles.avatarStreakText}>{streak}</Text>
          </Pressable>
        )}

        {/* Sprache oben rechts zum Aufklappen */}
        <LanguageButton top={insets.top + 18} />

        {/* Schriftzug klein oben in der Mitte, mit dem Fuchs-Symbol */}
        <View style={[styles.brand, { top: insets.top + 18 }]} pointerEvents="none">
          <AppLogo size={30} />
          <Text style={styles.title}>Explorimal</Text>
        </View>

        {/* ganz kleiner Hinweis: das Forscher-Quiz ist heute noch offen (führt zu den Challenges) */}
        {hint && (
          <View style={[styles.quizHintWrap, { top: insets.top + 58 }]} pointerEvents="box-none">
            <QuizHint label={t('start.quiz')} onPress={onOpenQuiz!} />
          </View>
        )}

        {/* mit Quiz-Hinweis oben etwas mehr Platz, damit er die Kamera nicht berührt */}
        <View style={[styles.center, { paddingTop: insets.top + (hint ? 34 : 0) }]}>
          <CameraButton size={camSize} onPress={onTakePhoto} label={t('a11y.takePhoto')} />
          {/* "oder Foto auswählen", links daneben der Marienkäfer */}
          <View style={styles.pickRow}>
            <View style={[styles.animal, { left: width * 0.06, top: 4 }]} pointerEvents="none">
              <Ladybug width={46} />
            </View>
            <Pressable onPress={onPickPhoto} accessibilityRole="button" hitSlop={10}>
              <Text style={styles.pickLink}>{t('start.pick')}</Text>
            </Pressable>
          </View>
          <View style={{ alignItems: 'center' }}>
          <Text style={styles.freeLeft}>
            {plus
              ? t('start.plus')
              : freeLeft === 0
                ? t('start.freeNone')
                : t(freeLeft === 1 ? 'start.freeOne' : 'start.free', { n: freeLeft })}
          </Text>
          {/* keine Gratis-Fotos mehr: Antippen startet direkt das Video (die Kamera öffnet das Fenster) */}
          {/* alle Videos auch schon weg: Hinweis auf Explorimal Plus */}
          {!plus && freeLeft === 0 && (
            <Pressable onPress={videosLeft > 0 ? onWatchVideo : onTakePhoto} hitSlop={8} accessibilityRole="button">
              <View style={styles.freeVideoRow}>
                <Icon name={videosLeft > 0 ? 'play' : 'star'} size={12} color={videosLeft > 0 ? colors.accentLight : '#FFD45E'} />
                <Text style={[styles.freeVideo, videosLeft === 0 && { color: '#FFD45E' }]}>
                  {videosLeft > 0 ? t('start.freeVideo') : t('start.freePlus')}
                </Text>
              </View>
            </Pressable>
          )}
          </View>
        </View>

        {/* kleine iPhones mit Werbeleiste: kein Platz für den Gruß (würde die Gratis-Fotos überdecken) */}
        {!(adBar && height < 760) && (
          <View style={styles.greetingWrap} pointerEvents="none">
            <Text style={[styles.greeting, { width: Math.min(180, width * 0.48) }]}>{greeting}</Text>
          </View>
        )}
      </View>
      {/* Platz für „Jetzt in deiner Nähe“ wächst nur: sonst springt der grüne Bereich, z. B. beim Sprachwechsel */}
      <View
        style={{ minHeight: nearbyHeight }}
        onLayout={(e) => {
          const h = Math.ceil(e.nativeEvent.layout.height);
          if (h > nearbyHeight) setNearbyHeight((maxNearby = h));
        }}
      >
        <NearbyList region={region} onSetRegion={onSetRegion} onTypeRegion={onTypeRegion} />
      </View>
      {/* Werbeleiste ganz unten, mit Abstand zu den Foto-Knöpfen (unter „In deiner Nähe“) */}
      {adBar && <AdSlot p={p} placement='start' compact />}
    </View>
  );
}

// Größe des Profilbilds oben links
const AVATAR = 78;

const styles = StyleSheet.create({
  pickRow: { alignSelf: 'stretch', alignItems: 'center' },
  screen: {
    flex: 1,
  },
  hero: {
    flex: 1,
    overflow: 'hidden',
    borderBottomLeftRadius: spacing.radiusHero,
    borderBottomRightRadius: spacing.radiusHero,
    backgroundColor: colors.skyMid,
  },
  animal: {
    position: 'absolute',
  },
  avatarMedal: {
    position: 'absolute',
    left: 8,
    zIndex: 2,
  },
  avatarXp: {
    position: 'absolute',
    left: 8 + (AVATAR - 60) / 2,
    width: 60,
    zIndex: 2,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    color: colors.accentLight,
    fontFamily: fonts.sansBold,
    fontSize: 11,
    borderRadius: 99,
    overflow: 'hidden',
    paddingVertical: 2,
  },
  avatarStreak: {
    position: 'absolute',
    left: 8 + (AVATAR - 60) / 2,
    width: 60,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 99,
    paddingVertical: 2,
  },
  avatarStreakText: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.white, fontVariant: ['tabular-nums'] },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  brand: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 22,
    letterSpacing: 0.5,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  quizHintWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 2 },
  quizHint: { flexDirection: 'row', alignItems: 'center' },
  quizFig: { zIndex: 1, borderRadius: 99, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  // Sprechblase mit kleiner Spitze zum Forscher hin
  quizTail: { width: 0, height: 0, marginLeft: -2, borderTopWidth: 5, borderBottomWidth: 5, borderRightWidth: 7, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#FFF6EA' },
  quizBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF6EA',
    borderRadius: 12,
    paddingLeft: 9,
    paddingRight: 7,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  quizHintText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.ink },
  quizArrow: { fontFamily: fonts.sansBold, fontSize: 15, lineHeight: 16, color: colors.accentDark },
  freeVideoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  freeVideo: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.accentLight,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  freeLeft: {
    marginTop: -6,
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.white,
    opacity: 0.75,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  pickLink: {
    marginTop: 10,
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.accentLight,
    textDecorationLine: 'underline',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  greetingWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: 'center',
  },
  greeting: {
    textAlign: 'center',
    fontFamily: fonts.sansBold,
    fontSize: 11.5,
    lineHeight: 15.5,
    color: colors.white,
    opacity: 0.92,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
});

// Kleiner Forscher mit Sprechblase: das Forscher-Quiz ist heute noch offen. Wippt ab und zu kurz,
// damit man sieht, dass man draufdrücken kann (nicht bei „Bewegung reduzieren“).
function QuizHint({ label, onPress }: { label: string; onPress: () => void }) {
  const nod = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (!alive || reduce) return;
        loop = Animated.loop(
          Animated.sequence([
            Animated.delay(3500),
            Animated.timing(nod, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(nod, { toValue: -1, duration: 220, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(nod, { toValue: 0, duration: 160, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ]),
        );
        loop.start();
      });
    return () => {
      alive = false;
      loop?.stop();
    };
  }, [nod]);
  const rotate = nod.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] });
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.quizHint, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}
    >
      <Animated.View style={[styles.quizFig, { transform: [{ rotate }] }]}>
        <Explorer size={30} />
      </Animated.View>
      <View style={styles.quizTail} />
      <View style={styles.quizBubble}>
        <Text style={styles.quizHintText}>{label}</Text>
        <Text style={styles.quizArrow}>›</Text>
      </View>
    </Pressable>
  );
}
