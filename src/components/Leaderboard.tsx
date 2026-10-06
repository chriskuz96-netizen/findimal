import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  cleanCode,
  fetchPeople,
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
import { BadgeId } from '../progress';
import { colors, fonts, Palette, spacing } from '../theme';
import { BADGE_TIER, Medal } from './Medal';

type Props = { stats: MyStats; invite: string | null; onInviteDone: () => void; p: Palette };

// "K7QX2M" -> "K7Q X2M" (leichter vorzulesen)
const pretty = (code: string) => `${code.slice(0, 3)} ${code.slice(3)}`;

// Rangliste mit Freunden: eigener Freundescode, Freunde hinzufügen, nach XP sortiert.
export function Leaderboard({ stats, invite, onInviteDone, p }: Props) {
  const { t, locale, lang } = useI18n();
  const [me, setMe] = useState<Me | null | undefined>(undefined); // undefined = lädt noch
  const [friends, setFriends] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [people, setPeople] = useState<Person[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');

  useEffect(() => {
    Promise.all([loadMe(), loadFriends(), loadRemoved()]).then(([m, f, r]) => {
      setMe(m);
      setFriends(f);
      setRemoved(r);
    });
  }, []);

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

  if (me === undefined) return null;

  const onJoin = async () => {
    setBusy(true);
    const res = await join(stats);
    setBusy(false);
    if (res.me) {
      setMe(res.me);
      setError(null);
    } else {
      setError(t(res.error === 'nodb' ? 'lb.nodb' : 'lb.offline'));
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
    setError(null);
  };

  const onRemove = (person: Person) =>
    Alert.alert(t('lb.removeTitle', { name: person.name }), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('lb.remove'),
        style: 'destructive',
        onPress: () => {
          const next = friends.filter((f) => f !== person.id);
          setFriends(next);
          saveFriends(next);
          const gone = [...removed, person.id];
          setRemoved(gone);
          saveRemoved(gone);
        },
      },
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

  // Noch nicht dabei: kurze Erklärung und "Mitmachen"
  if (!me) {
    return (
      <View style={[styles.card, { backgroundColor: p.card, borderColor: p.line }]}>
        <Text style={[styles.h3, { color: p.ink }]}>{t('lb.title')}</Text>
        <Text style={[styles.sub, { color: p.mute }]}>{t('lb.intro')}</Text>
        {!!invite && <Text style={[styles.sub, { color: colors.accent }]}>{t('lb.invited')}</Text>}
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable onPress={onJoin} disabled={busy} style={[styles.btn, { backgroundColor: p.moss }]} accessibilityRole="button">
          {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>{t('lb.join')}</Text>}
        </Pressable>
      </View>
    );
  }

  const self: Person = { id: me.id, ...stats };
  const rows = [self, ...(people ?? []).filter((x) => x.id !== me.id)].sort((a, b) => b.xp - a.xp);

  return (
    <View style={[styles.card, { backgroundColor: p.card, borderColor: p.line }]}>
      <Text style={[styles.h3, { color: p.ink }]}>{t('lb.title')}</Text>

      {/* Liste */}
      <View style={{ marginTop: 8 }}>
        {rows.map((x, i) => {
          const isMe = x.id === me.id;
          return (
            <Pressable
              key={x.id}
              onLongPress={isMe ? undefined : () => onRemove(x)}
              style={[styles.row, isMe && { backgroundColor: 'rgba(232,131,58,0.12)' }]}
            >
              <Text style={[styles.rank, { color: i === 0 ? colors.accent : p.mute }]}>{i + 1}</Text>
              {x.avatar in BADGE_TIER ? (
                <Medal id={x.avatar as BadgeId} size={34} />
              ) : (
                <View style={styles.letter}>
                  <Text style={styles.letterText}>{x.name[0]?.toUpperCase() ?? '?'}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: p.ink }]} numberOfLines={1}>
                  {x.name}
                  {isMe ? ` (${t('lb.you')})` : ''}
                </Text>
                <Text style={[styles.small, { color: p.mute }]}>
                  {t('lb.line', { level: x.level, species: x.species })}
                </Text>
              </View>
              <Text style={[styles.xp, { color: p.ink }]}>{x.xp.toLocaleString(locale)} XP</Text>
            </Pressable>
          );
        })}
        {people === null && !error && <ActivityIndicator color={colors.accent} style={{ marginTop: 6 }} />}
        {people !== null && friends.length === 0 && (
          <Text style={[styles.sub, { color: p.mute }]}>{t('lb.empty')}</Text>
        )}
      </View>

      {/* Eigener Code zum Weitergeben */}
      <View style={[styles.codeBox, { borderColor: p.line }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.small, { color: p.mute }]}>{t('lb.yourCode')}</Text>
          <Text style={[styles.code, { color: p.ink }]} selectable>
            {pretty(me.id)}
          </Text>
        </View>
        <Pressable
          onPress={() =>
            Share.share({ message: t('lb.shareText', { code: pretty(me.id), link: inviteLink(me.id, stats.name, lang) }) })
          }
          style={[styles.smallBtn, { backgroundColor: p.moss }]}
          accessibilityRole="button"
        >
          <Text style={styles.smallBtnText}>{t('lb.invite')}</Text>
        </Pressable>
      </View>

      {/* Freund hinzufügen */}
      <View style={styles.addRow}>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder={t('lb.addPlaceholder')}
          placeholderTextColor={p.mute}
          autoCapitalize="characters"
          autoCorrect={false}
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
      {!!error && <Text style={styles.error}>{error}</Text>}

      <Text style={[styles.small, { color: p.mute, marginTop: 10 }]}>{t('lb.hint')}</Text>
      <Pressable onPress={onLeave} hitSlop={8} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
        <Text style={[styles.small, { color: p.mute, textDecorationLine: 'underline' }]}>{t('lb.leave')}</Text>
      </Pressable>
    </View>
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: { fontFamily: fonts.serifBold, fontSize: 16, color: colors.ink },
  name: { fontFamily: fonts.sansBold, fontSize: 15 },
  xp: { fontFamily: fonts.sansBold, fontSize: 14 },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  code: { fontFamily: fonts.serifBold, fontSize: 22, letterSpacing: 2 },
  smallBtn: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 },
  smallBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.white },
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
