import { Pressable, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo } from '../components/AppLogo';
import { CameraButton } from '../components/CameraButton';
import { JungleBackground } from '../components/JungleBackground';
import { NearbyList } from '../components/NearbyList';
import { Avatar } from '../components/Avatar';
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


type Props = {
  name: string | null;
  region: string;
  onOpenProfile: () => void;
  xp: number;
  avatar: string | null; // Abzeichen oder Plus-Tier als Profilbild
  freeLeft: number; // Gratis-Fotos, die heute noch übrig sind
  onTakePhoto: () => void;
  onPickPhoto: () => void;
};

export function StartScreen({
  name,
  region,
  onOpenProfile,
  xp,
  avatar,
  freeLeft,
  onTakePhoto,
  onPickPhoto,
}: Props) {
  const insets = useSafeAreaInsets();
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const { t, nickname } = useI18n();
  const { plus } = usePlus();
  const greeting = name ? t('start.welcome', { name, nick: nickname }) : t('start.hello');
  const { width, height } = useWindowDimensions();
  // Wie im Entwurf: clamp(120px, 21vh, 168px)
  const camSize = Math.min(168, Math.max(120, height * 0.21));

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

        {/* Sprache oben rechts zum Aufklappen */}
        <LanguageButton top={insets.top + 18} />

        {/* Schriftzug klein oben in der Mitte, mit dem Fuchs-Symbol */}
        <View style={[styles.brand, { top: insets.top + 18 }]} pointerEvents="none">
          <AppLogo size={30} />
          <Text style={styles.title}>Findimal</Text>
        </View>

        <View style={[styles.center, { paddingTop: insets.top }]}>
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
          <Text style={styles.freeLeft}>
            {plus
              ? t('start.plus')
              : freeLeft === 0
                ? t('start.freeNone')
                : t(freeLeft === 1 ? 'start.freeOne' : 'start.free', { n: freeLeft })}
          </Text>
        </View>

        <View style={styles.greetingWrap} pointerEvents="none">
          <Text style={[styles.greeting, { width: Math.min(180, width * 0.48) }]}>{greeting}</Text>
        </View>
      </View>
      <NearbyList region={region} />
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
