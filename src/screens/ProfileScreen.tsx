import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { HeaderBackground } from '../components/HeaderBackground';
import { Avatar } from '../components/Avatar';
import { Medal } from '../components/Medal';
import { Find, speciesKey } from '../finds';
import { LanguageChips } from '../components/LanguageButton';
import { SERVER_URL } from '../config';
import { useI18n } from '../i18n';
import { disableTips, enableTips, loadTips, testTip } from '../notify';
import { loadZone } from '../zone';
import { askForPlus, PLUS_AVATARS, usePlus } from '../plus';
import { Progress } from '../progress';
import { colors, darkPalette, fonts, lightPalette, Palette, spacing } from '../theme';

type Props = {
  name: string;
  region: string;
  avatar: string | null; // Abzeichen oder Plus-Tier
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
  const { t, lang } = useI18n();
  const { plus, setPlus } = usePlus();
  const [newName, setNewName] = useState(name);
  const [editing, setEditing] = useState(false);
  const saveName = () => {
    const n = newName.trim();
    setEditing(false);
    if (n && n !== name) onRename(n);
  };
  const [tips, setTips] = useState(false);
  const [europe, setEurope] = useState(true); // Natur-Tipps gibt es nur für Europa
  useEffect(() => {
    loadTips().then((on) => setTips(!!on));
    loadZone().then((z) => setEurope(z !== 'other'));
  }, [region]);
  const toggleTips = async (on: boolean) => {
    setTips(on);
    if (!on) return disableTips();
    if (await enableTips(lang)) return;
    // iOS erlaubt keine Mitteilungen: in den Einstellungen einschalten
    setTips(false);
    Alert.alert(t('tips.title'), t('tips.denied'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('tips.settings'), onPress: () => Linking.openSettings() },
    ]);
  };
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
          <Avatar id={avatar} name={name} size={84} />
          <View style={{ flex: 1 }}>
            {/* Name: Stift antippen zum Ändern */}
            {editing ? (
              <View style={styles.nameRow}>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  maxLength={24}
                  autoCapitalize="words"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                  style={styles.nameInput}
                  accessibilityLabel={t('pro.name')}
                />
                <Pressable onPress={saveName} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.save')} style={styles.nameOk}>
                  <Text style={styles.nameOkText}>✓</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  setNewName(name);
                  setEditing(true);
                }}
                hitSlop={8}
                style={styles.nameRow}
                accessibilityRole="button"
                accessibilityLabel={t('pro.name')}
              >
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path d="M4 20h4L19 9l-4-4L4 16v4Z" fill="none" stroke={colors.accentLight} strokeWidth={2} strokeLinejoin="round" />
                  <Path d="M13.5 6.5l4 4" stroke={colors.accentLight} strokeWidth={2} />
                </Svg>
              </Pressable>
            )}
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

      {/* Findimal Plus: was dazugehört */}
      <View style={[styles.card, styles.plusCard]}>
        <Text style={styles.plusTitle}>★ {t('plus.title')}</Text>
        <Text style={styles.plusSub}>{plus ? t('plus.active') : t('plus.sub')}</Text>
        {(['plus.b1', 'plus.b2', 'plus.b3', 'plus.b4', 'plus.b5'] as const).map((k) => (
          <View key={k} style={styles.plusRow}>
            <Text style={styles.plusCheck}>✓</Text>
            <Text style={styles.plusText}>{t(k)}</Text>
          </View>
        ))}
        {/* ein paar der Plus-Profilbilder als Vorgeschmack */}
        <View style={styles.plusPreview}>
          {PLUS_AVATARS.slice(0, 5).map((a) => (
            <Avatar key={a.id} id={a.id} name={name} size={44} />
          ))}
        </View>
        {plus ? (
          <Pressable onPress={() => setPlus(false)} style={styles.plusEnd} accessibilityRole="button">
            <Text style={styles.plusEndText}>{t('plus.end')}</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={() => askForPlus(t, setPlus)}
              style={({ pressed }) => [styles.plusBtn, { opacity: pressed ? 0.85 : 1 }]}
              accessibilityRole="button"
            >
              <Text style={styles.plusBtnText}>{t('plus.get')}</Text>
            </Pressable>
            <Text style={styles.plusPrice}>{t('plus.price')}</Text>
          </>
        )}
      </View>

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

        {/* Plus-Profilbilder: ohne Plus mit Schloss */}
        <Text style={[styles.h4, { color: p.ink }]}>★ {t('pro.plusAvatars')}</Text>
        <Text style={[styles.sub, { color: p.mute }]}>{t('pro.plusAvatarsHint')}</Text>
        {/* eine Reihe zum Wischen statt eines großen Rasters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pick}>
          {PLUS_AVATARS.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => (plus ? onSelectAvatar(a.id) : askForPlus(t, setPlus))}
              style={[styles.pickItem, avatar === a.id && styles.pickOn]}
              accessibilityRole="button"
            >
              <View style={{ opacity: plus ? 1 : 0.45 }}>
                <Avatar id={a.id} name={name} size={56} />
              </View>
              {!plus && <Text style={styles.lock}>🔒</Text>}
            </Pressable>
          ))}
        </ScrollView>
      </Card>

      {/* Region */}
      <Card p={p}>
        <Text style={[styles.h3, { color: p.ink }]}>{t('pro.region')}</Text>
        <View style={styles.row}>
          <Text style={[styles.region, { color: region ? p.ink : p.mute }]}>{region || t('pro.noRegion')}</Text>
          <SmallButton label={t('pro.change')} onPress={onChangeRegion} p={p} />
        </View>
      </Card>

      {/* Natur-Tipps als Mitteilung (einmal pro Woche): hervorgehoben, mit Glocke */}
      <View style={[styles.card, styles.tipsCard, { backgroundColor: p.card }]}>
        <View style={styles.tipsHead}>
          <View style={styles.bell}>
            <Svg width={24} height={24} viewBox="0 0 24 24">
              <Path d="M12 3a6 6 0 0 0-6 6v4.2L4.2 16.5h15.6L18 13.2V9a6 6 0 0 0-6-6Z" fill={colors.accentLight} />
              <Path d="M9.8 18.5a2.2 2.2 0 0 0 4.4 0Z" fill={colors.accentLight} />
            </Svg>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tipsKind, { color: colors.accent }]}>{t('tips.kind')}</Text>
            <Text style={[styles.h3, { color: p.ink }]}>{t('tips.title')}</Text>
          </View>
          {europe && <Switch value={tips} onValueChange={toggleTips} trackColor={{ true: p.button }} />}
        </View>
        <Text style={[styles.sub, { color: p.mute, marginTop: 10 }]}>{t(europe ? 'tips.hint' : 'tips.europe')}</Text>
        {/* nur beim Ausprobieren in Expo Go sichtbar */}
        {__DEV__ && tips && europe && (
          <Pressable onPress={() => testTip(lang)} hitSlop={8} style={{ marginTop: 8 }} accessibilityRole="button">
            <Text style={[styles.sub, { color: p.moss, fontFamily: fonts.sansBold }]}>{t('tips.test')} ›</Text>
          </Pressable>
        )}
      </View>

      {/* Sprache */}
      <Card p={p}>
        <Text style={[styles.h3, { color: p.ink }]}>{t('pro.language')}</Text>
        <LanguageChips />
      </Card>

      <Pressable onPress={confirmReset} style={[styles.reset, { borderColor: p.line }]} accessibilityRole="button">
        <Text style={[styles.resetText, { color: colors.coral }]}>{t('pro.reset')}</Text>
      </Pressable>

      {/* Hilfe sowie Datenschutz und Impressum (Webseiten des Findimal-Servers) */}
      <View style={styles.links}>
        {(
          [
            ['hilfe', 'pro.help'],
            ['datenschutz', 'pro.privacy'],
          ] as const
        ).map(([page, label]) => (
          <Pressable
            key={page}
            onPress={() => Linking.openURL(`${SERVER_URL.replace(/\/$/, '')}/${page}${lang === 'de' ? '' : `?l=${lang}`}`)}
            accessibilityRole="link"
            style={styles.privacy}
          >
            <Text style={[styles.privacyText, { color: p.mute }]}>{t(label)}</Text>
          </Pressable>
        ))}
      </View>
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
      style={({ pressed }) => [styles.small, { backgroundColor: p.button, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }]}
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
  name: { flexShrink: 1, fontFamily: fonts.serifBold, fontSize: 26, color: colors.white },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.serifBold,
    fontSize: 22,
    color: colors.white,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    paddingVertical: 2,
  },
  nameOk: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameOkText: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.ink },
  nick: { fontFamily: fonts.sans, fontSize: 14, color: colors.accentLight, marginTop: 2 },
  card: {
    marginTop: 12,
    marginHorizontal: spacing.gutter,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  h3: { fontFamily: fonts.serifBold, fontSize: 18 },
  h4: { fontFamily: fonts.serifBold, fontSize: 16, marginTop: 16 },
  lock: { position: 'absolute', right: 2, bottom: 2, fontSize: 14 },
  plusCard: { backgroundColor: '#123826', borderColor: '#E8B53A', borderWidth: 1.5 },
  plusTitle: { fontFamily: fonts.serifBold, fontSize: 20, color: '#FFD45E' },
  plusSub: { fontFamily: fonts.sans, fontSize: 14, color: colors.accentLight, marginTop: 2, marginBottom: 8 },
  plusRow: { flexDirection: 'row', gap: 8, marginTop: 5 },
  plusCheck: { fontFamily: fonts.sansBold, fontSize: 15, color: '#FFD45E' },
  plusText: { flex: 1, fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 20, color: colors.white },
  plusPreview: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
  plusBtn: { marginTop: 14, backgroundColor: '#E8B53A', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  plusBtnText: { fontFamily: fonts.sansBold, fontSize: 16, color: '#13261C' },
  plusPrice: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.accentLight, textAlign: 'center', marginTop: 6 },
  plusEnd: { marginTop: 12, alignSelf: 'center', paddingVertical: 6 },
  plusEndText: { fontFamily: fonts.sans, fontSize: 13, color: colors.accentLight, textDecorationLine: 'underline' },
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
  tipsCard: { borderWidth: 2, borderColor: colors.accent, marginTop: 20 },
  tipsHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#123826',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsKind: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
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
  links: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 14 },
  privacy: { padding: 6 },
  privacyText: { fontFamily: fonts.sans, fontSize: 13.5, textDecorationLine: 'underline' },
});
