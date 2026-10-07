import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  cleanCode,
  fetchPeople,
  fetchTop,
  report,
  inbox,
  inviteLink,
  isCode,
  join,
  leave,
  link,
  loadFriends,
  loadMe,
  loadRemoved,
  Me,
  MyStats,
  Person,
  saveFriends,
  saveRemoved,
  syncMe,
} from '../board';
import { useI18n } from '../i18n';
import { colors, fonts, Palette, spacing } from '../theme';
import { Avatar } from './Avatar';

type Props = { stats: MyStats; invite: string | null; onInviteDone: () => void; onRank: (rank: number) => void; onFriends: (n: number) => void; p: Palette };

// "K7QX2M" -> "K7Q X2M" (leichter vorzulesen)
const pretty = (code: string) => `${code.slice(0, 3)} ${code.slice(3)}`;

// Rangliste mit Freunden: eigener Freundescode, Freunde hinzufügen, nach XP sortiert.
export function Leaderboard({ stats, invite, onInviteDone, onRank, onFriends, p }: Props) {
  const { t, locale, lang } = useI18n();
  const [me, setMe] = useState<Me | null | undefined>(undefined); // undefined = lädt noch
  const [friends, setFriends] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [people, setPeople] = useState<Person[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<'friends' | 'world'>('friends');
  const [top, setTop] = useState<Person[] | null>(null);

  useEffect(() => {
    Promise.all([loadMe(), loadFriends(), loadRemoved()]).then(([m, f, r]) => {
      setMe(m);
      setFriends(f);
      setRemoved(r);
    });
  }, []);

  // Zahl der Freunde melden (für das Abzeichen "Teamplayer")
  useEffect(() => {
    if (me) onFriends(friends.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, friends.length]);

  // Eigene Werte hochladen (nur bei Änderungen) und Freunde neu laden
  const statsKey = JSON.stringify(stats);
  const refresh = useCallback(async () => {
    if (!me) return;
    await syncMe(me, stats);
    // Wer mich hinzugefügt hat, landet auch in meiner Liste
    const incoming = (await inbox(me)).filter(
      (id) => id !== me.id && !friends.includes(id) && !removed.includes(id),
    );
    if (incoming.length) {
      const next = [...friends, ...incoming];
      setFriends(next);
      saveFriends(next);
      return; // refresh läuft mit der neuen Liste nochmal
    }
    const list = await fetchPeople(friends);
    setPeople(list);
    setError(list ? null : t('lb.offline'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, friends, removed, statsKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Einladung eines Freundes: nach dem Mitmachen automatisch hinzufügen
  useEffect(() => {
    if (!invite || !me) return;
    onInviteDone();
    if (invite === me.id || friends.includes(invite)) return;
    fetchPeople([invite]).then((found) => {
      if (!found?.length) return setError(t(found ? 'lb.badCode' : 'lb.offline'));
      const next = [...friends, invite];
      setFriends(next);
      saveFriends(next);
      link(me, invite);
      if (removed.includes(invite)) {
        const back = removed.filter((r) => r !== invite);
        setRemoved(back);
        saveRemoved(back);
      }
      Alert.alert(t('lb.title'), t('lb.added', { name: found[0].name }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite, me]);

  // Weltweite Rangliste laden, sobald sie angeschaut wird
  useEffect(() => {
    if (view !== 'world') return;
    // Weltweite Liste laden; steht man selbst darin, zählt der Platz für die Top-Abzeichen
    const showTop = (list: Person[] | null) => {
      setTop(list);
      const rank = me && list ? list.findIndex((x) => x.id === me.id) + 1 : 0;
      if (rank > 0) onRank(rank);
    };
    if (me) syncMe(me, stats).then(() => fetchTop().then(showTop));
    else fetchTop().then(showTop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, me, statsKey]);

  if (me === undefined) return null;

  const onJoin = async () => {
    setBusy(true);
    const res = await join(stats);
    setBusy(false);
    if (res.me) {
      setMe(res.me);
      setError(null);
    } else {
      setError(t(({ nodb: 'lb.nodb', old: 'lb.oldServer', key: 'lb.badKey', offline: 'lb.offline' } as const)[res.error ?? 'offline']));
    }
  };

  const onAdd = async () => {
    const id = cleanCode(code);
    if (!me) return;
    if (id === me.id) return setError(t('lb.self'));
    if (!isCode(id)) return setError(t('lb.badCode'));
    if (friends.includes(id)) return setCode('');
    setBusy(true);
    const found = await fetchPeople([id]);
    setBusy(false);
    if (!found) return setError(t('lb.offline'));
    if (!found.length) return setError(t('lb.badCode'));
    const next = [...friends, id];
    setFriends(next);
    saveFriends(next);
    link(me, id);
    if (removed.includes(id)) {
      const back = removed.filter((r) => r !== id);
      setRemoved(back);
      saveRemoved(back);
    }
    setCode('');
    setAdding(false);
    setError(null);
  };

  // Lange drücken auf einen anderen Eintrag: entfernen/ausblenden oder melden.
  // Ausgeblendete Einträge sieht man weder bei den Freunden noch weltweit.
  const hide = (person: Person) => {
    const next = friends.filter((f) => f !== person.id);
    if (next.length !== friends.length) {
      setFriends(next);
      saveFriends(next);
    }
    const gone = [...removed, person.id];
    setRemoved(gone);
    saveRemoved(gone);
  };
  const onPerson = (person: Person) =>
    Alert.alert(person.name, undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: view === 'friends' ? t('lb.remove') : t('lb.hide'), onPress: () => hide(person) },
      ...(me
        ? [
            {
              text: t('lb.report'),
              style: 'destructive' as const,
              onPress: () => {
                report(me, person.id);
                hide(person);
                Alert.alert(t('lb.report'), t('lb.reported'));
              },
            },
          ]
        : []),
    ]);

  const onLeave = () =>
    Alert.alert(t('lb.leave'), t('lb.leaveText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('lb.leaveYes'),
        style: 'destructive',
        onPress: async () => {
          if (me) await leave(me);
          setMe(null);
          setFriends([]);
          setPeople(null);
        },
      },
    ]);

  // Einladung teilen. Klappt der Link nicht, wird nur der Code geteilt; Fehler werden angezeigt statt verschluckt.
  const invitePress = async () => {
    if (!me) return;
    let link = '';
    try {
      link = inviteLink(me.id, stats.name, lang);
    } catch {
      link = '';
    }
    const message = link
      ? t('lb.shareText', { code: pretty(me.id), link })
      : t('lb.shareCode', { code: pretty(me.id) });
    try {
      await Share.share({ message });
    } catch (e) {
      Alert.alert(t('lb.invite'), `${t('lb.shareFailed')}\n\n${pretty(me.id)}`);
    }
  };

  // Freunde: ich + Freunde nach XP; Weltweit: Top 50 vom Server (ich ggf. unten angehängt)
  const self: Person | null = me ? { id: me.id, ...stats } : null;
  const friendRows = self ? [self, ...(people ?? []).filter((x) => x.id !== self.id)].sort((a, b) => b.xp - a.xp) : [];
  const worldRows = (top ?? []).filter((x) => !removed.includes(x.id)).map((x) => (self && x.id === self.id ? self : x));
  const meInWorld = !!self && worldRows.some((x) => x.id === self.id);
  const rows = view === 'friends' ? friendRows : worldRows;

  return (
    <View style={[styles.card, { backgroundColor: p.card, borderColor: p.line }]}>
      <Text style={[styles.h3, { color: p.ink }]}>{t('lb.title')}</Text>

      {/* Umschalter Freunde / Weltweit */}
      <View style={[styles.seg, { borderColor: p.line }]}>
        {(['friends', 'world'] as const).map((v) => (
          <Pressable
            key={v}
            onPress={() => setView(v)}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === v }}
            style={[styles.segBtn, view === v && { backgroundColor: p.button }]}
          >
            <Text style={[styles.segText, { color: view === v ? colors.white : p.ink }]}>
              {t(v === 'friends' ? 'lb.friends' : 'lb.world')}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Noch nicht dabei: kurze Erklärung und "Mitmachen" */}
      {!me && view === 'friends' && (
        <>
          <Text style={[styles.sub, { color: p.mute }]}>{t('lb.intro')}</Text>
          {!!invite && <Text style={[styles.sub, { color: colors.accent }]}>{t('lb.invited')}</Text>}
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable onPress={onJoin} disabled={busy} style={[styles.btn, { backgroundColor: p.button }]} accessibilityRole="button">
            {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>{t('lb.join')}</Text>}
          </Pressable>
        </>
      )}

      {/* Liste */}
      {(me || view === 'world') && (
        <View style={{ marginTop: 6 }}>
          {rows.map((x, i) => (
            <Row
              key={x.id}
              person={x}
              rank={String(i + 1)}
              isMe={x.id === me?.id}
              onLongPress={x.id !== me?.id ? () => onPerson(x) : undefined}
              p={p}
            />
          ))}
          {view === 'world' && self && top && !meInWorld && (
            <>
              <Text style={[styles.small, { color: p.mute, textAlign: 'center' }]}>···</Text>
              <Row person={self} rank="–" isMe p={p} />
            </>
          )}
          {((view === 'friends' && people === null) || (view === 'world' && top === null)) && !error && (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 6 }} />
          )}
          {view === 'friends' && people !== null && friends.length === 0 && (
            <Text style={[styles.sub, { color: p.mute }]}>{t('lb.empty')}</Text>
          )}
          {view === 'world' && top !== null && top.length === 0 && (
            <Text style={[styles.sub, { color: p.mute }]}>{t('lb.worldEmpty')}</Text>
          )}
          {view === 'world' && !me && (
            <Text style={[styles.small, { color: p.mute, marginTop: 6 }]}>{t('lb.worldHint')}</Text>
          )}
        </View>
      )}

      {/* Kompakt: eigener Code, einladen, Code eingeben */}
      {me && view === 'friends' && (
        <>
          <View style={[styles.codeRow, { borderColor: p.line }]}>
            <Text style={[styles.small, { color: p.mute }]}>{t('lb.yourCode')}</Text>
            <Text style={[styles.code, { color: p.ink }]} selectable>
              {pretty(me.id)}
            </Text>
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={invitePress}
              hitSlop={10}
              style={({ pressed }) => [styles.smallBtn, { backgroundColor: p.button, opacity: pressed ? 0.6 : 1 }]}
              accessibilityRole="button"
            >
              <Text style={styles.smallBtnText}>{t('lb.invite')}</Text>
            </Pressable>
          </View>

          {adding ? (
            <View style={styles.addRow}>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder={t('lb.addPlaceholder')}
                placeholderTextColor={p.mute}
                autoCapitalize="characters"
                autoCorrect={false}
                autoFocus
                maxLength={8}
                onSubmitEditing={onAdd}
                style={[styles.input, { color: p.ink, borderColor: p.line }]}
              />
              <Pressable
                onPress={onAdd}
                disabled={busy || !code.trim()}
                style={[styles.smallBtn, { backgroundColor: colors.accent, opacity: code.trim() ? 1 : 0.5 }]}
                accessibilityRole="button"
              >
                <Text style={[styles.smallBtnText, { color: colors.ink }]}>{t('lb.add')}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setAdding(true)} hitSlop={8} style={{ alignSelf: 'flex-start', marginTop: 10 }}>
              <Text style={[styles.link, { color: p.moss }]}>{t('lb.enterCode')}</Text>
            </Pressable>
          )}
          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.footer}>
            <Text style={[styles.tiny, { color: p.mute, flex: 1 }]}>{t('lb.hint')}</Text>
            <Pressable onPress={onLeave} hitSlop={8}>
              <Text style={[styles.tiny, { color: p.mute, textDecorationLine: 'underline' }]}>{t('lb.leave')}</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

// Eine Zeile der Rangliste
function Row({
  person: x,
  rank,
  isMe,
  onLongPress,
  p,
}: {
  person: Person;
  rank: string;
  isMe: boolean;
  onLongPress?: () => void;
  p: Palette;
}) {
  const { t, locale } = useI18n();
  return (
    <Pressable onLongPress={onLongPress} style={[styles.row, isMe && { backgroundColor: 'rgba(232,131,58,0.12)' }]}>
      <Text style={[styles.rank, { color: rank === '1' ? colors.accent : p.mute }]}>{rank}</Text>
      <Avatar id={x.avatar || null} name={x.name} size={32} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: p.ink }]} numberOfLines={1}>
          {x.name}
          {isMe ? ` (${t('lb.you')})` : ''}
        </Text>
        <Text style={[styles.small, { color: p.mute }]}>{t('lb.line', { level: x.level, species: x.species })}</Text>
      </View>
      <Text style={[styles.xp, { color: p.ink }]}>{x.xp.toLocaleString(locale)} XP</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 14, marginHorizontal: spacing.gutter, borderWidth: 1, borderRadius: 20, padding: 16 },
  h3: { fontFamily: fonts.serifBold, fontSize: 20 },
  sub: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 19, marginTop: 4 },
  small: { fontFamily: fonts.sans, fontSize: 12.5 },
  error: { fontFamily: fonts.sansBold, fontSize: 13, color: '#C8543A', marginTop: 8 },
  btn: { marginTop: 12, borderRadius: 14, padding: 13, alignItems: 'center' },
  btnText: { color: colors.white, fontFamily: fonts.sansBold, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingHorizontal: 6, borderRadius: 12 },
  rank: { width: 18, textAlign: 'center', fontFamily: fonts.serifBold, fontSize: 16 },
  letter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: { fontFamily: fonts.serifBold, fontSize: 16, color: colors.ink },
  name: { fontFamily: fonts.sansBold, fontSize: 15 },
  xp: { fontFamily: fonts.sansBold, fontSize: 14 },
  seg: { flexDirection: 'row', borderWidth: 1, borderRadius: 99, padding: 3, marginTop: 10 },
  segBtn: { flex: 1, borderRadius: 99, paddingVertical: 7, alignItems: 'center' },
  segText: { fontFamily: fonts.sansBold, fontSize: 14 },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  code: { fontFamily: fonts.sansBold, fontSize: 15, letterSpacing: 1.5 },
  smallBtn: { borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 },
  smallBtnText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.white },
  link: { fontFamily: fonts.sansBold, fontSize: 13.5 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, opacity: 0.8 },
  tiny: { fontFamily: fonts.sans, fontSize: 10 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  input: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: fonts.sansBold,
    fontSize: 16,
    letterSpacing: 1,
  },
});
