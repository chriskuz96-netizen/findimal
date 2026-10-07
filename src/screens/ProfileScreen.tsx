import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
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
import Svg, { Circle, Path } from 'react-native-svg';

import { HeaderBackground } from '../components/HeaderBackground';
import { Avatar } from '../components/Avatar';
import { AvatarSheet } from '../components/AvatarSheet';
import { LanguageChips } from '../components/LanguageButton';
import { Find, speciesKey } from '../finds';
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
  const [picking, setPicking] = useState(false); // Auswahlfenster fürs Profilbild
  const [choosingLang, setChoosingLang] = useState(false); // Sprachauswahl
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
    <>
    <AvatarSheet
      visible={picking}
      name={name}
      avatar={avatar}
      earned={earned}
      onSelect={onSelectAvatar}
      onClose={() => setPicking(false)}
    />
    {/* Sprache wählen (wie oben rechts auf der Startseite) */}
    <Modal visible={choosingLang} transparent animationType="fade" onRequestClose={() => setChoosingLang(false)}>
      <Pressable style={styles.langDim} onPress={() => setChoosingLang(false)}>
        {/* Tippen in die Box schließt sie nicht */}
        <Pressable style={[styles.langBox, { backgroundColor: p.card }]} onPress={() => {}}>
          <Text style={[styles.h3, { color: p.ink, marginBottom: 6 }]}>{t('pro.language')}</Text>
          <LanguageChips onPick={() => setChoosingLang(false)} />
        </Pressable>
      </Pressable>
    </Modal>
    <ScrollView style={{ flex: 1, backgroundColor: p.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
      <View style={[styles.hx, { paddingTop: insets.top + 10 }]}>
        <HeaderBackground />
        <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" style={styles.back}>
          <Text style={styles.backText}>{t('pro.back')}</Text>
        </Pressable>
        <View style={styles.pr}>
          {/* großes Profilbild; Antippen öffnet die Auswahl */}
          <Pressable
            onPress={() => setPicking(true)}
            accessibilityRole="button"
            accessibilityLabel={t('pro.avatar')}
          >
            <Avatar id={avatar} name={name} size={108} />
            <View style={styles.avatarEdit}>
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path d="M4 20h4L19 9l-4-4L4 16v4Z" fill="none" stroke={colors.ink} strokeWidth={2.4} strokeLinejoin="round" />
              </Svg>
            </View>
          </Pressable>
          <View style={styles.prText}>
            {/* Name: Stift antippen zum Ändern */}
            {editing ? (
              <View style={[styles.nameRow, styles.nameEdit]}>
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
            {/* Ort: antippen zum Ändern */}
            <Pressable
              onPress={onChangeRegion}
              hitSlop={8}
              style={styles.place}
              accessibilityRole="button"
              accessibilityLabel={`${t('pro.region')}: ${region || t('pro.noRegion')}`}
            >
              <Svg width={14} height={14} viewBox="0 0 24 24">
                <Path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" fill={colors.accent} />
                <Circle cx={12} cy={10} r={2.6} fill="#123826" />
              </Svg>
              <Text style={styles.placeText} numberOfLines={1}>
                {region || t('pro.setPlace')}
              </Text>
              <Svg width={13} height={13} viewBox="0 0 24 24">
                <Path d="M4 20h4L19 9l-4-4L4 16v4Z" fill="none" stroke={colors.accentLight} strokeWidth={2.2} strokeLinejoin="round" />
              </Svg>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Stufe und Statistik */}
      <Card p={p} style={{ marginTop: -24, paddingVertical: 12 }}>
        <View style={styles.stats}>
          <Stat p={p} value={finds.length} label={t('pro.finds')} />
          <Stat p={p} value={species} label={t('col.species')} />
          <Stat p={p} value={earned.length} label={t('ch.badges')} />
        </View>
        <View style={styles.xpRow}>
          <View style={[styles.prog, { backgroundColor: p.line }]}>
            <View style={[styles.progFill, { width: `${Math.min(100, Math.round(share * 100))}%` }]} />
          </View>
          <Text style={[styles.xpText, { color: p.mute }]}>
            {progress.nextLevelXp ? `${progress.xp} / ${progress.nextLevelXp} XP` : `${progress.xp} XP`}
          </Text>
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

      {/* Schnellzugriff als drei Kacheln, für alle, die die Stifte oben übersehen */}
      <View style={styles.quick}>
        {(
          [
            ['🖼️', t('pro.avatar'), () => setPicking(true)],
            ['📍', t('pro.place'), onChangeRegion],
            ['🌐', t('pro.language'), () => setChoosingLang(true)],
          ] as const
        ).map(([icon, label, onPress]) => (
          <Pressable
            key={label}
            onPress={onPress}
            style={({ pressed }) => [styles.quickBtn, { borderColor: p.line, backgroundColor: p.card, opacity: pressed ? 0.7 : 1 }]}
            accessibilityRole="button"
          >
            <Text style={styles.quickIcon}>{icon}</Text>
            <Text style={[styles.quickText, { color: p.ink }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

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
    </>
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

const styles = StyleSheet.create({
  hx: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: 40,
    borderBottomLeftRadius: spacing.radiusHero,
    borderBottomRightRadius: spacing.radiusHero,
    overflow: 'hidden',
  },
  back: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 10 },
  backText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.accentLight },
  pr: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  prText: { flex: 1, minWidth: 0, alignItems: 'flex-start' },
  avatarEdit: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: '#123826',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { flexShrink: 1, fontFamily: fonts.serifBold, fontSize: 26, color: colors.white },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '100%' },
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  placeText: { flexShrink: 1, fontFamily: fonts.sansBold, fontSize: 13, color: colors.white },
  nameEdit: { alignSelf: 'stretch' },
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
  prog: { flex: 1, height: 8, borderRadius: 9, overflow: 'hidden' },
  xpRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  xpText: { fontFamily: fonts.sansBold, fontSize: 12.5 },
  progFill: { height: '100%', backgroundColor: colors.accent },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 5 },
  statValue: { fontFamily: fonts.serifBold, fontSize: 20 },
  statLabel: { fontFamily: fonts.sans, fontSize: 12.5 },
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
  reset: {
    marginTop: 20,
    marginHorizontal: spacing.gutter,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  resetText: { fontFamily: fonts.sansBold, fontSize: 16 },
  quick: { flexDirection: 'row', gap: 10, marginTop: 16, marginHorizontal: spacing.gutter },
  quickBtn: { flex: 1, borderWidth: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', gap: 4 },
  quickIcon: { fontSize: 22 },
  quickText: { fontFamily: fonts.sansBold, fontSize: 13 },
  langDim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  langBox: { width: '100%', maxWidth: 380, borderRadius: 20, padding: 18 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 14 },
  privacy: { padding: 6 },
  privacyText: { fontFamily: fonts.sans, fontSize: 13.5, textDecorationLine: 'underline' },
});
