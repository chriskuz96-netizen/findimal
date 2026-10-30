import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
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
import { AdSlot } from '../components/AdSlot';
import { Avatar } from '../components/Avatar';
import { AvatarSheet } from '../components/AvatarSheet';
import { PhotoCropper } from '../components/PhotoCropper';
import { saveAvatarImage } from '../avatarPhoto';
import { PlusCard } from '../components/PlusCard';
import { LanguageChips } from '../components/LanguageButton';
import { PlaceChip } from '../components/PlaceChip';
import { join, leave, loadMe, Me } from '../board';
import { SwipeBack, SwipeScrollView } from '../components/SwipeBack';
import { Find, speciesKey } from '../finds';
import { SERVER_URL } from '../config';
import { useI18n } from '../i18n';
import { disableTips, enableTips, loadTips, testTip } from '../notify';
import { loadZone } from '../zone';
import { favoriteGroup, levelTitle, Progress } from '../progress';
import { GroupIcon } from '../groups';
import { Icon } from '../components/Icon';
import { seasonName } from '../components/Leaderboard';
import { colors, darkPalette, fonts, lightPalette, Palette, spacing } from '../theme';

type Props = {
  name: string;
  region: string;
  avatar: string | null; // Abzeichen oder Plus-Tier
  progress: Progress;
  finds: Find[];
  season: { season: string; sxp: number; best: { s: string; r: number } | null }; // diese Saison und beste Platzierung
  onBack: () => void;
  onRename: (name: string) => void;
  onChangeRegion: () => void;
  onSelectAvatar: (id: string) => void;
  onReset: () => void;
};

// Profil: Name, Profilbild, Stufe, Statistik, Region und Zurücksetzen.
export function ProfileScreen(props: Props) {
  const { name, region, avatar, progress, finds, season, onBack, onRename, onChangeRegion, onSelectAvatar, onReset } = props;
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t, lang, locale } = useI18n();
  const [newName, setNewName] = useState(name);
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false); // Auswahlfenster fürs Profilbild
  const [cropping, setCropping] = useState<string | null>(null); // eigenes Foto: Bildausschnitt wählen (Fund-ID)
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
  const fav = favoriteGroup(finds);
  // Rangliste: dabei sein oder nicht (gleich wie „Mitmachen“ / „Rangliste verlassen“ in den Challenges)
  const [board, setBoard] = useState<Me | null | undefined>(undefined);
  const [boardBusy, setBoardBusy] = useState(false);
  useEffect(() => {
    loadMe().then(setBoard);
  }, []);
  const toggleBoard = async (on: boolean) => {
    if (on) {
      setBoardBusy(true);
      const res = await join({ name, xp: progress.xp, level: progress.level, species, avatar: avatar ?? '' });
      setBoardBusy(false);
      if (res.me) setBoard(res.me);
      else Alert.alert(t('lb.title'), t('lb.offline'));
      return;
    }
    Alert.alert(t('lb.leave'), t('lb.leaveText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('lb.leaveYes'),
        style: 'destructive',
        onPress: async () => {
          if (board) await leave(board);
          setBoard(null);
        },
      },
    ]);
  };
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
      photos={[...finds].sort((a, b) => (a.date < b.date ? 1 : -1)).map((f) => f.id)}
      onSelect={onSelectAvatar}
      onClose={() => setPicking(false)}
      onCrop={(findId) => {
        setPicking(false);
        setCropping(findId);
      }}
    />
    <PhotoCropper
      findId={cropping}
      onCancel={() => setCropping(null)}
      onDone={async (uri) => {
        // neue ID je Ausschnitt: so wird das neue Bild auch für die Rangliste neu hochgeladen
        const id = `f-${cropping}~${Date.now().toString(36)}`;
        await saveAvatarImage(id, uri);
        setCropping(null);
        onSelectAvatar(id);
      }}
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
    {/* nach rechts wischen = zurück */}
    <SwipeBack onBack={onBack}>
      <SwipeScrollView
        style={{ flex: 1, backgroundColor: p.bg }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        // Tipp auf ✓ zählt sofort, auch wenn die Tastatur offen ist
        keyboardShouldPersistTaps="handled"
      >
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
                <Svg width={17} height={17} viewBox="0 0 24 24">
                  <Path d="M4 20h4L19 9l-4-4L4 16v4Z" fill="none" stroke={colors.accentLight} strokeWidth={2} strokeLinejoin="round" />
                  <Path d="M13.5 6.5l4 4" stroke={colors.accentLight} strokeWidth={2} />
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
                  <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                    {name}
                  </Text>
                  <Svg width={20} height={20} viewBox="0 0 24 24">
                    <Path d="M4 20h4L19 9l-4-4L4 16v4Z" fill="none" stroke={colors.accentLight} strokeWidth={2} strokeLinejoin="round" />
                    <Path d="M13.5 6.5l4 4" stroke={colors.accentLight} strokeWidth={2} />
                  </Svg>
                </Pressable>
              )}
              {/* wie auf der Challenges-Seite: STUFE orange, Stufenname weiß */}
              <Text style={styles.nick}>
                <Text style={styles.nickCaps}>{t('ch.level', { n: progress.level })}</Text> ·{' '}
                <Text style={{ color: colors.white }}>{levelTitle(progress.level, t)}</Text>
              </Text>
              {/* Ort: antippen zum Ändern */}
              <PlaceChip
                label={region || t('pro.setPlace')}
                onPress={onChangeRegion}
                accessibilityLabel={`${t('pro.region')}: ${region || t('pro.noRegion')}`}
                style={styles.place}
              />
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
          {/* Meist fotografiert, diese Saison, beste Saison: eine Zeile mit drei Feldern (wie auf der Profilkarte in der Rangliste) */}
          <View style={[styles.more, { borderColor: p.line }]}>
            {(
              [
                [fav ? <GroupIcon id={fav.id} size={14} color={colors.accentLight} /> : null, fav ? t(`g.${fav.id}` as 'g.bird') : '–', t('lb.fav')],
                [<Icon name="star" size={13} color={colors.accentLight} />, `${season.sxp.toLocaleString(locale)} XP`, seasonName(season.season, t)],
                [
                  <Icon name="trophy" size={13} color={colors.accentLight} />,
                  season.best ? t('pro.rankShort', { rank: season.best.r }) : '–',
                  season.best ? seasonName(season.best.s, t) : t('lb.bestSeason'),
                ],
              ] as const
            ).map(([icon, value, label], i) => (
              <View key={i} style={styles.moreItem}>
                <View style={styles.moreTop}>
                  {icon && <View style={styles.moreIcon}>{icon}</View>}
                  <Text style={[styles.moreValue, { color: p.ink }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {value}
                  </Text>
                </View>
                <Text style={[styles.moreLabel, { color: p.mute }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Findimal Plus: was dazugehört */}
        <PlusCard name={name} />

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

        {/* Anzeigen-Platz unter den Natur-Tipps (nicht mit Plus) */}
        <AdSlot p={p} placement='profile' />

        {/* Schnellzugriff als drei Kacheln, für alle, die die Stifte oben übersehen */}
        <View style={styles.quick}>
          {(
            [
              [t('pro.avatar'), () => setPicking(true)],
              [t('pro.place'), onChangeRegion],
              [t('pro.language'), () => setChoosingLang(true)],
            ] as const
          ).map(([label, onPress]) => (
            <Pressable
              key={label}
              onPress={onPress}
              style={({ pressed }) => [styles.quickBtn, { borderColor: p.line, backgroundColor: p.card, opacity: pressed ? 0.7 : 1 }]}
              accessibilityRole="button"
            >
              <Text style={[styles.quickText, { color: p.ink }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* In der Rangliste zeigen: im Stil der drei Kacheln darüber (Widerspruch gegen die automatische Teilnahme) */}
        {board !== undefined && (
          <View style={[styles.boardRow, { borderColor: p.line, backgroundColor: p.card }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickText, { color: p.ink }]}>{t('pro.boardTitle')}</Text>
              <Text style={[styles.boardText, { color: p.mute }]}>{t('pro.boardText')}</Text>
            </View>
            <Switch
              value={!!board}
              onValueChange={toggleBoard}
              disabled={boardBusy}
              trackColor={{ true: p.button }}
              style={{ transform: [{ scale: 0.8 }] }}
            />
          </View>
        )}
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
      </SwipeScrollView>
    </SwipeBack>
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
  more: { flexDirection: 'row', marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
  moreItem: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  moreTop: { flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '100%' },
  moreIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#143F2A', alignItems: 'center', justifyContent: 'center' },
  moreValue: { flexShrink: 1, fontFamily: fonts.sansBold, fontSize: 14.5 },
  moreLabel: { fontFamily: fonts.sans, fontSize: 11.5, marginTop: 3 },
  avatarEdit: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#123826',
    borderWidth: 1.5,
    borderColor: 'rgba(255,210,168,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { flexShrink: 1, fontFamily: fonts.serifBold, fontSize: 26, color: colors.white },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '100%' },
  place: { alignSelf: 'flex-start', marginTop: 8 },
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
  nick: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.accentLight, marginTop: 2 },
  nickCaps: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  card: {
    marginTop: 12,
    marginHorizontal: spacing.gutter,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  h3: { fontFamily: fonts.serifBold, fontSize: 18 },
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
  boardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, marginHorizontal: spacing.gutter, borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingLeft: 14, paddingRight: 6 },
  boardText: { fontFamily: fonts.sans, fontSize: 12, marginTop: 1 },
  resetText: { fontFamily: fonts.sansBold, fontSize: 16 },
  quick: { flexDirection: 'row', gap: 10, marginTop: 16, marginHorizontal: spacing.gutter },
  quickBtn: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center' },
  quickText: { fontFamily: fonts.sansBold, fontSize: 14 },
  langDim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  langBox: { width: '100%', maxWidth: 380, borderRadius: 20, padding: 18 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 14 },
  privacy: { padding: 6 },
  privacyText: { fontFamily: fonts.sans, fontSize: 13.5, textDecorationLine: 'underline' },
});
