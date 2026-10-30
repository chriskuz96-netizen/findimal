import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  cleanCode,
  fetchPeople,
  fetchTop,
  inbox,
  inviteLink,
  isCode,
  join,
  lastOwnBonus,
  leave,
  link,
  loadFriends,
  loadMe,
  loadReported,
  loadPending,
  loadRemoved,
  Me,
  MyStats,
  ensurePhotoAvatar,
  Person,
  report,
  saveFriends,
  answerRequest,
  checkSeasonAward,
  fetchSeasonTop,
  SeasonAwards,
  requestFriend,
  saveReported,
  savePending,
  withdrawRequest,
  saveRemoved,
  syncMe,
} from '../board';
import { photoForAvatar } from '../avatarPhoto';
import { useI18n } from '../i18n';
import { usePlus } from '../plus';
import { previousSeasonKey, SEASON_REWARDS, seasonReward, XP } from '../progress';
import { GroupIcon, GroupId } from '../groups';
import { seasonDaysLeft } from '../season';
import { bonusPhotos } from '../usage';
import { colors, fonts, Palette, spacing } from '../theme';
import { Icon } from './Icon';
import { Avatar } from './Avatar';

type Props = {
  stats: MyStats;
  invite: string | null;
  onInviteDone: () => void;
  onRank: (rank: number) => void;
  onFriends: (n: number) => void;
  onBonus?: () => void; // Extra-Foto durch eine Einladung bekommen
  onSeasonAward?: (awards: SeasonAwards) => void; // Belohnung für die abgelaufene Saison gemerkt
  p: Palette;
};

// "K7QX2M" -> "K7Q X2M" (leichter vorzulesen)
const pretty = (code: string) => `${code.slice(0, 3)} ${code.slice(3)}`;

// "autumn-2026" -> "Herbst 2026", "winter-2026" -> "Winter 2026/27"
export function seasonName(key: string, t: (k: never, v?: Record<string, string | number>) => string): string {
  const [id, y] = key.split('-');
  const year = id === 'winter' ? `${y}/${String(Number(y) + 1).slice(2)}` : y;
  return `${t(`sn.${id}` as never)} ${year}`;
}

// Rangliste mit Freunden: eigener Freundescode, Freunde hinzufügen, nach XP sortiert.
export function Leaderboard({ stats, invite, onInviteDone, onRank, onFriends, onBonus, onSeasonAward, p }: Props) {
  const { t, locale, lang } = useI18n();
  // Plus hat unbegrenzte Fotos: dann nur XP erwähnen (das Gratis-Foto bekommt nur der Freund)
  const { plus } = usePlus();
  const plusRef = useRef(plus);
  plusRef.current = plus;
  const [me, setMe] = useState<Me | null | undefined>(undefined); // undefined = lädt noch
  const [friends, setFriends] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [people, setPeople] = useState<Person[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<'friends' | 'world' | 'season'>('friends');
  const [seasonTop, setSeasonTop] = useState<Person[] | null>(null); // weltweite Saison-Rangliste
  const [top, setTop] = useState<Person[] | null>(null);
  const [pending, setPending] = useState<string[]>([]); // eigene Anfragen, noch nicht angenommen
  const [reported, setReported] = useState<string[]>([]); // selbst gemeldet: weltweit weg
  const [requests, setRequests] = useState<Person[]>([]); // Anfragen an mich
  const [card, setCard] = useState<{ person: Person; rank: string } | null>(null); // große Profilkarte
  const [confirmReport, setConfirmReport] = useState(false); // Karte: „Wirklich melden?“
  const [reportDone, setReportDone] = useState(false); // Karte: „Danke, wird geprüft“
  const [canRequest, setCanRequest] = useState(false); // kennt der Server Freundschaftsanfragen schon?

  useEffect(() => {
    Promise.all([loadMe(), loadFriends(), loadRemoved(), loadPending(), loadReported()]).then(([m, f, r, pe, rep]) => {
      setMe(m);
      setFriends(f);
      setRemoved(r);
      setPending(pe);
      setReported(rep);
    });
  }, []);

  // Zahl der Freunde melden (für Freundes-XP und das Abzeichen "Teamplayer")
  useEffect(() => {
    if (me) onFriends(friends.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, friends.length]);

  // Eigene Werte hochladen (nur bei Änderungen) und Freunde neu laden
  const statsKey = JSON.stringify(stats);
  const refresh = useCallback(async () => {
    if (!me) return;
    // eigenes Foto als Profilbild: (falls noch nicht geschehen) erst hochladen, damit alle es sehen
    if (stats.avatar.startsWith('f-')) await ensurePhotoAvatar(stats.avatar, () => photoForAvatar(stats.avatar));
    await syncMe(me, stats);
    // Saison vorbei? Platz in der abgelaufenen Saison nachsehen und die Belohnung gutschreiben (einmal)
    const award = await checkSeasonAward(me, previousSeasonKey(new Date()), seasonReward);
    if (award) {
      onSeasonAward?.(award.awards);
      if (award.xp > 0)
        Alert.alert(t('lb.awardTitle'), t('lb.award', { season: seasonName(previousSeasonKey(new Date()), t), rank: award.rank, xp: award.xp }));
    }
    // Wer mich hinzugefügt hat, landet auch in meiner Liste
    const bonusBefore = await bonusPhotos();
    const { ids: all, requests: asked } = await inbox(me);
    if ((await bonusPhotos()) > bonusBefore && Date.now() - lastOwnBonus > 15_000) {
      // jemand ist meiner Einladung gefolgt: Extra-Foto für mich
      Alert.alert(t('lb.title'), t(plusRef.current ? 'lb.bonusInviterPlus' : 'lb.bonusInviter', { xp: XP.friend }));
      onBonus?.();
    }
    // Anfragen an mich (ohne die, die schon Freunde sind)
    setCanRequest(asked !== null);
    const open = (asked ?? []).filter((id) => id !== me.id && !friends.includes(id));
    fetchPeople(open).then((list) => setRequests(list ?? []));
    // Wer mich hinzugefügt oder meine Anfrage angenommen hat, landet in meiner Liste
    // (selbst entfernte nur, wenn ich sie selbst angefragt hatte)
    const incoming = all.filter((id) => id !== me.id && !friends.includes(id) && (!removed.includes(id) || pending.includes(id)));
    if (pending.some((id) => all.includes(id))) {
      const still = pending.filter((id) => !all.includes(id));
      setPending(still);
      savePending(still);
    }
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
  }, [me, friends, removed, pending, statsKey]);

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
      if (removed.includes(invite)) {
        const back = removed.filter((r) => r !== invite);
        setRemoved(back);
        saveRemoved(back);
      }
      link(me, invite).then((bonus) => {
        if (bonus) onBonus?.();
        Alert.alert(
          t('lb.title'),
          bonus ? t(plusRef.current ? 'lb.bonusNewPlus' : 'lb.bonusNew', { name: found[0].name, xp: XP.friend }) : t('lb.added', { name: found[0].name }),
        );
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite, me]);

  // Saison-Rangliste laden, sobald sie angeschaut wird
  useEffect(() => {
    if (view !== 'season' || !stats.season) return;
    const load = () => fetchSeasonTop(stats.season!).then(setSeasonTop);
    if (me) syncMe(me, stats).then(load);
    else load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, me, statsKey]);

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
    addFriend(found[0]);
    setCode('');
    setAdding(false);
    setError(null);
  };

  // Freund per Code hinzufügen: wer seinen Code teilt, ist einverstanden – gilt sofort
  const addFriend = (person: Person, confirm = false) => {
    if (!me || person.id === me.id || friends.includes(person.id)) return;
    const next = [...friends, person.id];
    setFriends(next);
    saveFriends(next);
    link(me, person.id).then((bonus) => {
      if (bonus) {
        onBonus?.();
        Alert.alert(t('lb.title'), t(plusRef.current ? 'lb.bonusNewPlus' : 'lb.bonusNew', { name: person.name, xp: XP.friend }));
      } else if (confirm) Alert.alert(t('lb.title'), t('lb.added', { name: person.name }));
    });
    if (removed.includes(person.id)) {
      const back = removed.filter((r) => r !== person.id);
      setRemoved(back);
      saveRemoved(back);
    }
  };

  // Aus der weltweiten Liste: Freundschaftsanfrage – Freunde werdet ihr erst, wenn der andere zustimmt
  const askFriend = async (person: Person) => {
    if (!me || pending.includes(person.id) || friends.includes(person.id)) return;
    const r = await requestFriend(me, person.id);
    if (r === 'error') return Alert.alert(t('lb.title'), t('lb.offline'));
    if (r === 'linked') return addFriend(person, true); // hatte mich schon hinzugefügt
    const next = [...pending, person.id];
    setPending(next);
    savePending(next);
    Alert.alert(t('lb.title'), t('lb.requested', { name: person.name }));
  };

  // Eigene Anfrage zurückziehen. Die Person kommt auf die Entfernt-Liste: nimmt sie die Anfrage
  // doch noch an (bevor der Server sie gelöscht hat), landet sie trotzdem nicht bei meinen Freunden.
  const withdraw = (person: Person) => {
    if (!me || !pending.includes(person.id)) return;
    const next = pending.filter((id) => id !== person.id);
    setPending(next);
    savePending(next);
    if (!removed.includes(person.id)) {
      const gone = [...removed, person.id];
      setRemoved(gone);
      saveRemoved(gone);
    }
    withdrawRequest(me, person.id);
  };

  // Anfrage an mich beantworten
  const answer = (person: Person, accept: boolean) => {
    if (!me) return;
    setRequests((r) => r.filter((x) => x.id !== person.id));
    answerRequest(me, person.id, accept);
    if (accept) addFriend(person);
  };

  // Lange drücken auf einen anderen Eintrag:
  // - bei den Freunden „Entfernen“: nur aus den Freunden (weltweit bleibt er sichtbar)
  // - „Melden“: aus beiden (nach 3 Meldungen nimmt ihn auch der Server aus der weltweiten Liste)
  const unfriend = (person: Person) => {
    const next = friends.filter((f) => f !== person.id);
    if (next.length !== friends.length) {
      setFriends(next);
      saveFriends(next);
    }
    if (!removed.includes(person.id)) {
      const gone = [...removed, person.id];
      setRemoved(gone);
      saveRemoved(gone);
    }
  };
  const hideWorld = (person: Person) => {
    if (reported.includes(person.id)) return;
    const next = [...reported, person.id];
    setReported(next);
    saveReported(next);
  };
  // Melden aus der Karte: Rückfrage direkt in der Karte, danach kurz „Danke“
  const doReport = (person: Person) => {
    if (!me) return;
    report(me, person.id);
    unfriend(person);
    hideWorld(person);
    setConfirmReport(false);
    setReportDone(true);
  };
  const closeCard = () => {
    setCard(null);
    setConfirmReport(false);
    setReportDone(false);
  };
  const onPerson = (person: Person) =>
    Alert.alert(person.name, undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      ...(me && canRequest && view !== 'friends' && !friends.includes(person.id) && !pending.includes(person.id)
        ? [{ text: t('lb.addFriend'), onPress: () => askFriend(person) }]
        : []),
      ...(me && pending.includes(person.id) ? [{ text: t('lb.withdraw'), onPress: () => withdraw(person) }] : []),
      // Entfernen nur bei den Freunden; aus der weltweiten Liste verschwindet jemand nur durch Melden
      ...(view === 'friends' ? [{ text: t('lb.remove'), onPress: () => unfriend(person) }] : []),
      ...(me
        ? [
            {
              text: t('lb.report'),
              style: 'destructive' as const,
              onPress: () => {
                report(me, person.id);
                unfriend(person);
                hideWorld(person);
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
    // iOS: Link extra mitgeben, dann zeigt das Teilen-Fenster die Vorschau mit dem Fuchs-Symbol
    const ios = Platform.OS === 'ios' && !!link;
    const message = ios
      ? t('lb.shareTextUrl', { code: pretty(me.id) })
      : link
        ? t('lb.shareText', { code: pretty(me.id), link })
        : t('lb.shareCode', { code: pretty(me.id) });
    try {
      await Share.share(ios ? { message, url: link } : { message });
    } catch (e) {
      Alert.alert(t('lb.invite'), `${t('lb.shareFailed')}\n\n${pretty(me.id)}`);
    }
  };

  // Freunde: ich + Freunde nach XP; Weltweit: Top 50 vom Server (ich ggf. unten angehängt)
  const self: Person | null = me ? { id: me.id, ...stats } : null;
  const friendRows = self ? [self, ...(people ?? []).filter((x) => x.id !== self.id)].sort((a, b) => b.xp - a.xp) : [];
  const worldRows = (top ?? []).filter((x) => !reported.includes(x.id)).map((x) => (self && x.id === self.id ? self : x));
  // Saison: wer in dieser Saison XP gesammelt hat (nach Saison-XP)
  const seasonRows = (seasonTop ?? [])
    .filter((x) => !reported.includes(x.id) && x.season === stats.season)
    .map((x) => (self && x.id === self.id ? self : x));
  const pub = view !== 'friends'; // öffentliche Listen: weltweit und Saison
  const pubRows = view === 'season' ? seasonRows : worldRows;
  const meInWorld = !!self && pubRows.some((x) => x.id === self.id);
  const rows = view === 'friends' ? friendRows : pubRows;
  const pubList = view === 'season' ? seasonTop : top;

  // Große Profilkarte: Bild, Name, Stufe, XP, Arten, Platz – und was man mit der Person machen kann
  const cardPerson = card?.person;
  const cardIsMe = !!cardPerson && cardPerson.id === me?.id;
  const cardFriend = !!cardPerson && friends.includes(cardPerson.id);
  const cardPending = !!cardPerson && pending.includes(cardPerson.id);
  // Platz in der Saison-Rangliste (falls geladen)
  const cardSeasonRank = cardPerson && seasonTop ? seasonTop.filter((x) => x.season === stats.season).findIndex((x) => x.id === cardPerson.id) + 1 : 0;
  const profileCard = cardPerson && (
    <Modal visible transparent animationType="fade" onRequestClose={closeCard}>
      <Pressable style={styles.cardDim} onPress={closeCard} accessibilityLabel={t('fq.close')} />
      <View style={styles.cardWrap} pointerEvents="box-none">
        <View style={[styles.pcard, { backgroundColor: p.card }]}>
          <View style={styles.pcardHead}>
            <Pressable onPress={closeCard} hitSlop={12} style={styles.pcardClose} accessibilityRole="button" accessibilityLabel={t('fq.close')}>
              <Text style={styles.pcardCloseText}>✕</Text>
            </Pressable>
            <Avatar id={(cardIsMe ? stats.avatar : cardPerson.avatar) || null} name={cardPerson.name} size={132} />
            <Text style={styles.pcardName} numberOfLines={2} adjustsFontSizeToFit>
              {cardPerson.name}
              {cardIsMe ? ` (${t('lb.you')})` : ''}
            </Text>
            <Text style={styles.pcardLevel}>
              {t('ch.level', { n: cardPerson.level })} · {t(`level.${Math.min(Math.max(cardPerson.level, 1), 12) - 1}` as 'level.0')}
            </Text>
          </View>
          <View style={styles.pcardStats}>
            {[
              [cardPerson.xp.toLocaleString(locale), 'XP'],
              [String(cardPerson.species), t('col.species')],
              [card!.rank === '–' ? '–' : `${card!.rank}.`, t(view === 'friends' ? 'lb.rankFriends' : 'lb.rankWorld')],
            ].map(([v, l]) => (
              <View key={l} style={styles.pcardStat}>
                <Text style={[styles.pcardValue, { color: p.ink }]}>{v}</Text>
                <Text style={[styles.small, { color: p.mute }]}>{l}</Text>
              </View>
            ))}
          </View>
          {/* Mehr über die Person: meist fotografierte Gruppe, diese Saison, beste Saison */}
          <View style={[styles.pcardMore, { borderColor: p.line }]}>
            {!!cardPerson.fav && (cardPerson.favN ?? 0) > 0 && (
              <View style={styles.pcardLine}>
                <View style={styles.pcardIcon}>
                  <GroupIcon id={cardPerson.fav as GroupId} size={18} color={colors.accentLight} />
                </View>
                <Text style={[styles.pcardLineText, { color: p.ink }]}>
                  {t('lb.fav')}: <Text style={styles.pcardBold}>{t(`g.${cardPerson.fav}` as 'g.bird')}</Text> ({cardPerson.favN})
                </Text>
              </View>
            )}
            {cardPerson.season === stats.season && (cardPerson.sxp ?? 0) > 0 && (
              <View style={styles.pcardLine}>
                <View style={styles.pcardIcon}>
                  <Icon name="star" size={16} color={colors.accentLight} />
                </View>
                <Text style={[styles.pcardLineText, { color: p.ink }]}>
                  {t('lb.seasonXp')}: <Text style={styles.pcardBold}>{(cardPerson.sxp ?? 0).toLocaleString(locale)}</Text>
                  {cardSeasonRank > 0 ? ` · ${t('lb.seasonRank', { rank: cardSeasonRank })}` : ''}
                </Text>
              </View>
            )}
            {!!cardPerson.best && (
              <View style={styles.pcardLine}>
                <View style={styles.pcardIcon}>
                  <Icon name="trophy" size={16} color={colors.accentLight} />
                </View>
                <Text style={[styles.pcardLineText, { color: p.ink }]}>
                  {t('lb.bestSeason')}: <Text style={styles.pcardBold}>{t('lb.bestValue', { rank: cardPerson.best.r, season: seasonName(cardPerson.best.s, t) })}</Text>
                </Text>
              </View>
            )}
          </View>
          {me && !cardIsMe && reportDone && (
            <View style={[styles.pcardInfo, { backgroundColor: p.bg }]}>
              <Text style={[styles.pcardInfoText, { color: p.ink, textAlign: 'center', paddingHorizontal: 12 }]}>{t('lb.reported')}</Text>
            </View>
          )}
          {me && !cardIsMe && !reportDone && confirmReport && (
            <View style={{ gap: 10, marginTop: 4, paddingHorizontal: 18 }}>
              <Text style={[styles.sub, { color: p.ink, textAlign: 'center' }]}>{t('lb.reportAsk', { name: cardPerson.name })}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => setConfirmReport(false)} style={[styles.btn, { flex: 1, marginTop: 0, backgroundColor: p.bg }]} accessibilityRole="button">
                  <Text style={[styles.btnText, { color: p.ink }]}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable onPress={() => doReport(cardPerson)} style={[styles.btn, { flex: 1, marginTop: 0, backgroundColor: '#C8543A' }]} accessibilityRole="button">
                  <Text style={styles.btnText}>{t('lb.reportYes')}</Text>
                </Pressable>
              </View>
            </View>
          )}
          {me && !cardIsMe && !reportDone && !confirmReport && (
            <View style={{ gap: 8, marginTop: 4 }}>
              {cardFriend ? (
                <View style={[styles.pcardInfo, { backgroundColor: 'rgba(46,122,76,0.12)' }]}>
                  <Text style={[styles.pcardInfoText, { color: '#2E7A4C' }]}>✓ {t('lb.isFriend')}</Text>
                </View>
              ) : cardPending ? (
                <View style={[styles.pcardInfo, { backgroundColor: p.bg }]}>
                  <Text style={[styles.pcardInfoText, { color: p.mute }]}>⏳ {t('lb.pending')}</Text>
                </View>
              ) : canRequest ? (
                <Pressable onPress={() => askFriend(cardPerson)} style={[styles.btn, { backgroundColor: p.button, marginTop: 0, marginHorizontal: 18 }]} accessibilityRole="button">
                  <Text style={styles.btnText}>{t('lb.addFriend')}</Text>
                </Pressable>
              ) : null}
              <View style={styles.pcardLinks}>
                {cardFriend && (
                  <Pressable
                    onPress={() => {
                      unfriend(cardPerson);
                      closeCard();
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.pcardLink, { color: p.mute }]}>{t('lb.removeFriend')}</Text>
                  </Pressable>
                )}
                {cardPending && (
                  <Pressable onPress={() => withdraw(cardPerson)} hitSlop={8} accessibilityRole="button">
                    <Text style={[styles.pcardLink, { color: p.mute }]}>{t('lb.withdraw')}</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => setConfirmReport(true)} hitSlop={8} accessibilityRole="button">
                  <Text style={[styles.pcardLink, { color: '#C8543A' }]}>{t('lb.report')}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.card, { backgroundColor: p.card, borderColor: p.line }]}>
      {profileCard}
      <Text style={[styles.h3, { color: p.ink }]}>{t('lb.title')}</Text>

      {/* Umschalter Freunde / Weltweit */}
      <View style={[styles.seg, { borderColor: p.line }]}>
        {(['friends', 'world', 'season'] as const).map((v) => (
          <Pressable
            key={v}
            onPress={() => setView(v)}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === v }}
            style={[styles.segBtn, view === v && { backgroundColor: p.button }]}
          >
            <Text style={[styles.segText, { color: view === v ? colors.white : p.ink }]}>
              {t(v === 'friends' ? 'lb.friends' : v === 'world' ? 'lb.world' : 'lb.season')}
              {v === 'friends' && requests.length > 0 ? ` (${requests.length})` : ''}
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

      {/* Freundschaftsanfragen an mich */}
      {me && view === 'friends' && requests.length > 0 && (
        <View style={[styles.reqBox, { borderColor: colors.accent }]}>
          <Text style={[styles.reqTitle, { color: p.ink }]}>{t('lb.requests')}</Text>
          {requests.map((x) => (
            <View key={x.id} style={styles.reqRow}>
              <Avatar id={x.avatar || null} name={x.name} size={32} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: p.ink }]} numberOfLines={1}>
                  {x.name}
                </Text>
                <Text style={[styles.small, { color: p.mute }]}>{t('lb.line', { level: x.level, species: x.species })}</Text>
              </View>
              <Pressable onPress={() => answer(x, false)} hitSlop={6} style={[styles.reqBtn, { borderColor: p.line }]} accessibilityRole="button">
                <Text style={[styles.reqBtnText, { color: p.mute }]}>{t('lb.decline')}</Text>
              </Pressable>
              <Pressable onPress={() => answer(x, true)} hitSlop={6} style={[styles.reqBtn, { backgroundColor: p.button, borderColor: p.button }]} accessibilityRole="button">
                <Text style={[styles.reqBtnText, { color: colors.white }]}>{t('lb.accept')}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {/* Saison: wie lange noch und was es am Ende gibt */}
      {view === 'season' && !!stats.season && (
        <View style={[styles.seasonBox, { backgroundColor: p.bg }]}>
          <Text style={[styles.seasonHead, { color: p.ink }]}>
            {seasonName(stats.season, t)} · {t('lb.seasonLeft', { n: seasonDaysLeft(new Date()) })}
          </Text>
          <Text style={[styles.small, { color: p.mute, marginTop: 3 }]}>
            {t('lb.seasonRewards')} {SEASON_REWARDS.map((r) => `${r.upTo === 1 ? '1.' : `Top ${r.upTo}`} +${r.xp}`).join(' · ')} XP
          </Text>
        </View>
      )}

      {/* Liste */}
      {(me || pub) && (
        <View style={{ marginTop: 6 }}>
          {rows.map((x, i) => (
            <Row
              key={x.id}
              person={x}
              rank={String(i + 1)}
              isMe={x.id === me?.id}
              selfAvatar={stats.avatar}
              onPress={() => setCard({ person: x, rank: String(i + 1) })}
              onLongPress={x.id !== me?.id ? () => onPerson(x) : undefined}
              value={view === 'season' ? x.sxp ?? 0 : undefined}
              isFriend={pub && friends.includes(x.id)}
              isPending={pub && pending.includes(x.id)}
              p={p}
            />
          ))}
          {pub && self && pubList && !meInWorld && (
            <>
              <Text style={[styles.small, { color: p.mute, textAlign: 'center' }]}>···</Text>
              <Row person={self} rank="–" isMe selfAvatar={stats.avatar} value={view === 'season' ? stats.sxp ?? 0 : undefined} onPress={() => setCard({ person: self, rank: '–' })} p={p} />
            </>
          )}
          {((view === 'friends' && people === null) || (pub && pubList === null)) && !error && (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 6 }} />
          )}
          {view === 'friends' && people !== null && friends.length === 0 && (
            <Text style={[styles.sub, { color: p.mute }]}>{t('lb.empty')}</Text>
          )}
          {view === 'world' && top !== null && top.length === 0 && (
            <Text style={[styles.sub, { color: p.mute }]}>{t('lb.worldEmpty')}</Text>
          )}
          {view === 'season' && seasonTop !== null && seasonRows.length === 0 && (
            <Text style={[styles.sub, { color: p.mute }]}>{t('lb.seasonEmpty')}</Text>
          )}
          {pub && !me && (
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

          {/* Einladen lohnt sich: beide bekommen etwas */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <Icon name="gift" size={16} color={colors.accent} />
            <Text style={[styles.small, { color: colors.accent, marginTop: 0, flexShrink: 1 }]}>
              {t(plus ? 'lb.inviteBonusPlus' : 'lb.inviteBonus', { xp: XP.friend })}
            </Text>
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
  selfAvatar,
  onPress,
  onLongPress,
  value,
  isFriend,
  isPending,
  p,
}: {
  person: Person;
  rank: string;
  isMe: boolean;
  selfAvatar?: string; // eigene Zeile: Profilbild vom Handy (auch ein eigenes Foto, das nie hochgeladen wird)
  onPress?: () => void; // Tippen: große Profilkarte
  value?: number; // statt der Gesamt-XP anzeigen (Saison-XP)
  isFriend?: boolean; // weltweite Liste: schon ein Freund (kleines Häkchen)
  isPending?: boolean; // weltweite Liste: Anfrage gesendet, wartet auf Zustimmung
  onLongPress?: () => void;
  p: Palette;
}) {
  const { t, locale } = useI18n();
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} accessibilityRole="button" style={[styles.row, isMe && { backgroundColor: 'rgba(232,131,58,0.12)' }]}>
      <Text style={[styles.rank, { color: rank === '1' ? colors.accent : p.mute }]}>{rank}</Text>
      <Avatar id={(isMe ? selfAvatar : x.avatar) || null} name={x.name} size={32} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: p.ink }]} numberOfLines={1}>
          {x.name}
          {isMe ? ` (${t('lb.you')})` : ''}
        </Text>
        <Text style={[styles.small, { color: p.mute }]}>{t('lb.line', { level: x.level, species: x.species })}</Text>
      </View>
      <Text style={[styles.xp, { color: p.ink }]}>{(value ?? x.xp).toLocaleString(locale)} XP</Text>
      {isPending ? (
        <View style={[styles.addBtn, { borderColor: p.line }]} accessibilityLabel={t('lb.pending')}>
          <Text style={[styles.addText, { color: p.mute, fontSize: 13 }]}>⏳</Text>
        </View>
      ) : isFriend ? (
        <View style={[styles.addBtn, styles.friendMark]} accessibilityLabel={t('lb.isFriend')}>
          <Text style={[styles.addText, { color: colors.white, fontSize: 14 }]}>✓</Text>
        </View>
      ) : null}
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
  addBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  addText: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.accent, marginTop: -1 },
  friendMark: { backgroundColor: '#2E7A4C', borderColor: '#2E7A4C' },
  cardDim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  cardWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  pcard: { borderRadius: 26, overflow: 'hidden', paddingBottom: 18 },
  pcardHead: { backgroundColor: '#143F2A', alignItems: 'center', paddingTop: 26, paddingBottom: 20, paddingHorizontal: 16 },
  pcardClose: { position: 'absolute', right: 14, top: 12, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  pcardCloseText: { color: colors.white, fontSize: 15, fontFamily: fonts.sansBold },
  pcardName: { fontFamily: fonts.serifBold, fontSize: 28, color: colors.white, marginTop: 12, textAlign: 'center' },
  pcardLevel: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.accentLight, marginTop: 4 },
  pcardStats: { flexDirection: 'row', paddingVertical: 16, paddingHorizontal: 12 },
  pcardStat: { flex: 1, alignItems: 'center' },
  pcardValue: { fontFamily: fonts.serifBold, fontSize: 24 },
  pcardInfo: { marginHorizontal: 18, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  pcardInfoText: { fontFamily: fonts.sansBold, fontSize: 15 },
  pcardLinks: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 6 },
  pcardLink: { fontFamily: fonts.sansBold, fontSize: 14, textDecorationLine: 'underline' },
  pcardMore: { marginHorizontal: 18, borderTopWidth: 1, paddingTop: 10, marginBottom: 8, gap: 8 },
  pcardLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pcardIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#143F2A', alignItems: 'center', justifyContent: 'center' },
  pcardLineText: { flex: 1, fontFamily: fonts.sans, fontSize: 14.5 },
  pcardBold: { fontFamily: fonts.sansBold },
  seasonBox: { marginTop: 10, borderRadius: 12, padding: 10 },
  seasonHead: { fontFamily: fonts.sansBold, fontSize: 14 },
  reqBox: { marginTop: 10, borderWidth: 1.5, borderRadius: 14, padding: 10 },
  reqTitle: { fontFamily: fonts.sansBold, fontSize: 14, marginBottom: 4 },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  reqBtn: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6 },
  reqBtnText: { fontFamily: fonts.sansBold, fontSize: 13 },
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
