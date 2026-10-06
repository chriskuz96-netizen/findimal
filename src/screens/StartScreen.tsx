import { Alert, Pressable, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CameraButton } from '../components/CameraButton';
import { JungleBackground } from '../components/JungleBackground';
import { NearbyList } from '../components/NearbyList';
import { GroupIcon, GroupId } from '../groups';
import { BadgeId, XP } from '../progress';
import { Medal } from '../components/Medal';
import { Frog } from '../components/animals/Frog';
import { Hedgehog } from '../components/animals/Hedgehog';
import { Ladybug } from '../components/animals/Ladybug';
import { Squirrel } from '../components/animals/Squirrel';
import { colors, darkPalette, fonts, lightPalette, spacing } from '../theme';

// Spitznamen aus dem Entwurf; einer wird zufällig gewählt.
const NICKNAMES = [
  'Naturbursche',
  'Moosflüsterer',
  'Spürnase',
  'Pfützenforscher',
  'Fährtenleser',
  'Blätterdetektiv',
  'Wurzelwanderer',
];
const nickname = NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)];

function greeting(name: string | null): string {
  if (!name) return 'Was entdeckst du heute?';
  return `Willkommen zurück, ${name}, du ${nickname}!`;
}

type Props = {
  name: string | null;
  region: string;
  onChangeName: () => void;
  onChangeRegion: () => void;
  xp: number;
  avatar: BadgeId | null; // Abzeichen als Profilbild
  daily: { text: string; icon: GroupId | null; done: boolean };
  onOpenChallenges: () => void;
  onTakePhoto: () => void;
  onPickPhoto: () => void;
};

export function StartScreen({
  name,
  region,
  onChangeName,
  onChangeRegion,
  xp,
  avatar,
  daily,
  onOpenChallenges,
  onTakePhoto,
  onPickPhoto,
}: Props) {
  const insets = useSafeAreaInsets();
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const { width, height } = useWindowDimensions();
  // Wie im Entwurf: clamp(120px, 21vh, 168px)
  const camSize = Math.min(168, Math.max(120, height * 0.21));

  return (
    <View style={[styles.screen, { backgroundColor: p.bg }]}>
      <View style={styles.hero}>
        <JungleBackground />

        {/* Die vier Tiere in den Ecken */}
        <View style={[styles.animal, { left: width * 0.05, top: insets.top + 96 }]}>
          <Ladybug width={60} />
        </View>
        <View style={[styles.animal, { right: 0, top: insets.top + 82 }]}>
          <Squirrel width={74} />
        </View>
        <View style={[styles.animal, { right: width * 0.06, bottom: '8%' }]}>
          <Frog width={60} />
        </View>
        <View style={[styles.animal, { left: width * 0.05, bottom: '7%' }]}>
          <Hedgehog width={58} />
        </View>

        {/* Kreis mit dem Anfangsbuchstaben (später: Profil) */}
        <Pressable
          onPress={() =>
            Alert.alert(`Hallo, ${name ?? 'Forscher'}!`, `Deine Region: ${region || 'noch keine'}`, [
              { text: 'Namen ändern', onPress: onChangeName },
              { text: 'Region ändern', onPress: onChangeRegion },
              { text: 'Abbrechen', style: 'cancel' },
            ])
          }
          accessibilityRole="button"
          accessibilityLabel="Profil"
          style={[avatar ? styles.avatarMedal : styles.avatar, { top: insets.top + (avatar ? 6 : 12) }]}
        >
          {avatar ? (
            <Medal id={avatar} size={54} />
          ) : (
            <Text style={styles.avatarText}>{name ? name[0].toUpperCase() : '?'}</Text>
          )}
        </Pressable>
        <Text style={[styles.avatarXp, { top: insets.top + 60 }]}>{xp} XP</Text>

        <View style={[styles.center, { paddingTop: insets.top }]}>
          <Text style={styles.title}>Findimal</Text>
          <CameraButton size={camSize} onPress={onTakePhoto} />
          <Pressable onPress={onPickPhoto} accessibilityRole="button" hitSlop={10}>
            <Text style={styles.pickLink}>oder Foto auswählen</Text>
          </Pressable>
        </View>

        <View style={styles.greetingWrap} pointerEvents="none">
          <Text style={[styles.greeting, { width: Math.min(180, width * 0.48) }]}>{greeting(name)}</Text>
        </View>
      </View>
      {/* Tageschallenge (öffnet die Challenges) */}
      <Pressable
        onPress={onOpenChallenges}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.tease,
          { backgroundColor: p.card, borderColor: p.line, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <View style={styles.teaseIcon}>
          <GroupIcon id={daily.icon} size={22} color={colors.accentLight} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.teaseSmall, { color: p.mute }]}>Tageschallenge</Text>
          <Text style={[styles.teaseText, { color: p.ink }]}>{daily.text}</Text>
        </View>
        <Text style={[styles.teaseXp, daily.done && { backgroundColor: '#6FBF8A' }]}>
          {daily.done ? '✓ Geschafft' : `+${XP.daily} XP`}
        </Text>
      </Pressable>
      <NearbyList region={region} />
    </View>
  );
}

const styles = StyleSheet.create({
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
  avatar: {
    position: 'absolute',
    left: 14,
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.accentLight,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMedal: {
    position: 'absolute',
    left: 8,
    zIndex: 2,
  },
  avatarXp: {
    position: 'absolute',
    left: 7,
    width: 56,
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
  tease: {
    marginTop: 10,
    marginHorizontal: spacing.gutter,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  teaseIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#123826',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teaseXp: {
    backgroundColor: colors.accent,
    color: colors.ink,
    fontFamily: fonts.sansBold,
    fontSize: 12,
    borderRadius: 99,
    overflow: 'hidden',
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  teaseSmall: {
    fontFamily: fonts.sans,
    fontSize: 12,
  },
  teaseText: {
    fontFamily: fonts.serifBold,
    fontSize: 15,
  },
  avatarText: {
    fontFamily: fonts.serifBold,
    fontSize: 19,
    color: colors.ink,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 36,
    letterSpacing: 0.5,
    color: colors.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 18,
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
