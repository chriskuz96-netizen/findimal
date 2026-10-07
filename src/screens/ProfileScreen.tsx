import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderBackground } from '../components/HeaderBackground';
import { Medal } from '../components/Medal';
import { Find, speciesKey } from '../finds';
import { LanguageChips } from '../components/LanguageButton';
import { useI18n } from '../i18n';
import { BadgeId, Progress } from '../progress';
import { colors, darkPalette, fonts, lightPalette, Palette, spacing } from '../theme';

type Props = {
  name: string;
  region: string;
  avatar: BadgeId | null;
  progress: Progress;
  finds: Find[];
  onBack: () => void;
  onRename: (name: string) => void;
  onChangeRegion: () => void;
  onSelectAvatar: (id: string) => void;
  onReset: () => void;
};

// Profil: Name, Profilbild, Stufe, Statistik, Region und Zurücksetzen.
export function ProfileScreen(props: Props) {
  const { name, region, avatar, progress, finds, onBack, onRename, onChangeRegion, onSelectAvatar, onReset } = props;
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [newName, setNewName] = useState(name);
  const earned = progress.badges.filter((b) => b.earned);
  const species = new Set(finds.map((f) => speciesKey(f.animal))).size;
  const share = progress.nextLevelXp
    ? (progress.xp - progress.levelStart) / (progress.nextLevelXp - progress.levelStart)
    : 1;

  const confirmReset = () =>
    Alert.alert(
      t('pro.resetTitle'),
      t('pro.resetText'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('pro.resetYes'), style: 'destructive', onPress: onReset },
      ],
    );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: p.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
      <View style={[styles.hx, { paddingTop: insets.top + 10 }]}>
        <HeaderBackground />
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" style={styles.back}>
          <Text style={styles.backText}>{t('pro.back')}</Text>
        </Pressable>
        <View style={styles.pr}>
          {avatar ? (
            <Medal id={avatar} size={84} />
          ) : (
            <View style={styles.letter}>
              <Text style={styles.letterText}>{name[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.nick}>
              {t('ch.levelLine', { n: progress.level, name: t(`level.${progress.level - 1}` as 'level.0') })}
            </Text>
          </View>
        </View>
      </View>

      {/* Stufe und Statistik */}
      <Card p={p} style={{ marginTop: -24 }}>
        <View style={[styles.prog, { backgroundColor: p.line, marginTop: 4 }]}>
          <View style={[styles.progFill, { width: `${Math.min(100, Math.round(share * 100))}%` }]} />
        </View>
        <Text style={[styles.sub, { color: p.mute }]}>
          {progress.nextLevelXp ? `${progress.xp} / ${progress.nextLevelXp} XP` : `${progress.xp} XP`}
        </Text>
        <View style={styles.stats}>
          <Stat p={p} value={finds.length} label={t('pro.finds')} />
          <Stat p={p} value={species} label={t('col.species')} />
          <Stat p={p} value={earned.length} label={t('ch.badges')} />
        </View>
      </Card>

      {/* Profilbild */}
      <Card p={p}>
        <Text style={[styles.h3, { color: p.ink }]}>{t('pro.avatar')}</Text>
        <Text style={[styles.sub, { color: p.mute }]}>
          {earned.length ? t('pro.avatarHint') : t('pro.avatarNone')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pick}>
          <Pressable onPress={() => onSelectAvatar('')} style={[styles.pickItem, !avatar && styles.pickOn]}>
            <View style={[styles.letter, { width: 56, height: 56, borderRadius: 28 }]}>
              <Text style={[styles.letterText, { fontSize: 24 }]}>{name[0]?.toUpperCase()}</Text>
            </View>
          </Pressable>
          {earned.map((b) => (
            <Pressable key={b.id} onPress={() => onSelectAvatar(b.id)} style={[styles.pickItem, avatar === b.id && styles.pickOn]}>
              <Medal id={b.id} size={60} />
            </Pressable>
          ))}
        </ScrollView>
      </Card>

      {/* Name */}
      <Card p={p}>
        <Text style={[styles.h3, { color: p.ink }]}>{t('pro.name')}</Text>
        <View style={styles.row}>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            maxLength={24}
            autoCapitalize="words"
            style={[styles.input, { borderColor: p.line, backgroundColor: p.bg, color: p.ink }]}
          />
          <SmallButton
            label={t('common.save')}
            disabled={!newName.trim() || newName.trim() === name}
            onPress={() => {
              onRename(newName.trim());
              Alert.alert(t('pro.saved'), t('pro.hello', { name: newName.trim() }));
            }}
            p={p}
          />
        </View>
      </Card>

      {/* Region */}
      <Card p={p}>
        <Text style={[styles.h3, { color: p.ink }]}>{t('pro.region')}</Text>
        <View style={styles.row}>
          <Text style={[styles.region, { color: region ? p.ink : p.mute }]}>{region || t('pro.noRegion')}</Text>
          <SmallButton label={t('pro.change')} onPress={onChangeRegion} p={p} />
        </View>
      </Card>

      {/* Sprache */}
      <Card p={p}>
        <Text style={[styles.h3, { color: p.ink }]}>{t('pro.language')}</Text>
        <LanguageChips />
      </Card>

      <Pressable onPress={confirmReset} style={[styles.reset, { borderColor: p.line }]} accessibilityRole="button">
        <Text style={[styles.resetText, { color: colors.coral }]}>{t('pro.reset')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Card({ p, style, children }: { p: Palette; style?: object; children: React.ReactNode }) {
  return <View style={[styles.card, { backgroundColor: p.card, borderColor: p.line }, style]}>{children}</View>;
}

function Stat({ p, value, label }: { p: Palette; value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: colors.accent }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: p.mute }]}>{label}</Text>
    </View>
  );
}

function SmallButton({ label, onPress, disabled, p }: { label: string; onPress: () => void; disabled?: boolean; p: Palette }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.small, { backgroundColor: p.moss, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }]}
    >
      <Text style={styles.smallText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hx: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: 44,
    borderBottomLeftRadius: spacing.radiusHero,
    borderBottomRightRadius: spacing.radiusHero,
    overflow: 'hidden',
  },
  back: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 10 },
  backText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.accentLight },
  pr: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  letter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.accentLight,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: { fontFamily: fonts.serifBold, fontSize: 34, color: colors.ink },
  name: { fontFamily: fonts.serifBold, fontSize: 26, color: colors.white },
  nick: { fontFamily: fonts.sans, fontSize: 14, color: colors.accentLight, marginTop: 2 },
  card: {
    marginTop: 12,
    marginHorizontal: spacing.gutter,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  h3: { fontFamily: fonts.serifBold, fontSize: 18 },
  sub: { fontFamily: fonts.sans, fontSize: 14, marginTop: 2 },
  prog: { height: 8, borderRadius: 9, marginTop: 10, marginBottom: 4, overflow: 'hidden' },
  progFill: { height: '100%', backgroundColor: colors.accent },
  stats: { flexDirection: 'row', marginTop: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: fonts.serifBold, fontSize: 24 },
  statLabel: { fontFamily: fonts.sans, fontSize: 12 },
  pick: { gap: 10, paddingTop: 12, paddingRight: 4 },
  pickItem: { padding: 3, borderRadius: 40, borderWidth: 2.5, borderColor: 'transparent' },
  pickOn: { borderColor: colors.accent },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  input: {
    flex: 1,
    minWidth: 0,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    fontFamily: fonts.sansBold,
    fontSize: 15,
  },
  region: { flex: 1, fontFamily: fonts.sansBold, fontSize: 15 },
  small: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  smallText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.white },
  reset: {
    marginTop: 20,
    marginHorizontal: spacing.gutter,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  resetText: { fontFamily: fonts.sansBold, fontSize: 16 },
});
