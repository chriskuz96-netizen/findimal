import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { ClipPath, Defs, G, LinearGradient, Rect, Stop } from 'react-native-svg';

import { AdSlot } from './AdSlot';
import { Explorer } from './Explorer';
import { QUIZ_ART, QUIZ_ART_BG } from './QuizArt';
import {
  answer,
  answerXp,
  byId,
  dayNo,
  decodeRank,
  encodeRank,
  finishRound,
  ForscherLog,
  roundCorrect,
  rankOrder,
  roundXp,
  startRound,
  streak,
  timeFor,
  todayRound,
} from '../forscher';
import { useI18n } from '../i18n';
import { BankQuestion } from '../quizBank';
import { colors, fonts, Palette, spacing } from '../theme';

// Das Forscher-Quiz als eigenes Fenster: Countdown 3-2-1, dann 10 Fragen mit ablaufender Zeit,
// nach jeder Antwort die Auflösung (zum Lernen), am Ende die Auswertung.
// Unten fest ein Werbeplatz (mit Abstand zu den Antworten, damit niemand aus Versehen draufkommt).

const DARK = '#143F2A';
type Phase = 'count' | 'ask' | 'reveal' | 'result';

export function ForscherQuiz({
  visible,
  log,
  onLog,
  onClose,
  p,
}: {
  visible: boolean;
  log: ForscherLog;
  onLog: (log: ForscherLog) => void; // jede Antwort ist sofort gespeichert
  onClose: () => void; // Fenster zu (die XP-Animation läuft dann auf der Challenges-Seite)
  p: Palette;
}) {
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const day = useRef(dayNo()).current;
  const [phase, setPhase] = useState<Phase>('count');
  const phaseRef = useRef<Phase>('count');
  phaseRef.current = phase;
  const [count, setCount] = useState(3);
  const [last, setLast] = useState<{ value: number; ms: number } | null>(null);
  const logRef = useRef(log);
  logRef.current = log;
  const round = todayRound(log, day);
  // pos: gerade gezeigte Frage (bleibt während der Auflösung stehen)
  const [pos, setPos] = useState(0);
  const q: BankQuestion | undefined = round ? byId.get(round.q[pos]) : undefined;

  // Beim Öffnen: Runde anlegen; schon fertig → gleich die Auswertung, sonst Countdown
  useEffect(() => {
    if (!visible) return;
    setLast(null);
    const r = todayRound(logRef.current, day);
    if (r?.done) return setPhase('result');
    setPhase('count');
    setCount(3);
    startRound(logRef.current, day).then(onLog);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Countdown 3 – 2 – 1 – Los!
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible || phase !== 'count') return;
    pop.setValue(0);
    Animated.timing(pop, { toValue: 1, duration: 450, easing: Easing.out(Easing.back(2)), useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      if (count > 0) setCount(count - 1);
      else {
        // weitermachen, wo man aufgehört hat (z. B. nach dem Schließen der App)
        setPos(todayRound(logRef.current, day)?.a.length ?? 0);
        setPhase('ask');
      }
    }, count > 0 ? 800 : 550);
    return () => clearTimeout(timer);
  }, [visible, phase, count, pop]);

  // Zeit pro Frage: Balken läuft ab, danach zählt die Frage als falsch
  const timeLeft = useRef(new Animated.Value(1)).current;
  const askedAt = useRef(0);
  const busy = useRef(false);
  useEffect(() => {
    if (!visible || phase !== 'ask' || !q) return;
    busy.current = false;
    askedAt.current = Date.now();
    const secs = timeFor(q);
    timeLeft.setValue(1);
    const anim = Animated.timing(timeLeft, { toValue: 0, duration: secs * 1000, easing: Easing.linear, useNativeDriver: false });
    anim.start();
    const timer = setTimeout(() => choose(-1), secs * 1000);
    return () => {
      anim.stop();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, phase, q?.id]);

  const choose = async (value: number) => {
    if (busy.current || phase !== 'ask') return;
    busy.current = true;
    const ms = value < 0 ? timeFor(q!) * 1000 : Date.now() - askedAt.current;
    timeLeft.stopAnimation();
    setLast({ value, ms });
    setPhase('reveal');
    onLog(await answer(logRef.current, day, value, ms));
  };

  const next = async () => {
    if (phaseRef.current !== 'reveal') return; // schon weiter (Tippen und Zeitablauf gleichzeitig)
    phaseRef.current = 'ask';
    const r = todayRound(logRef.current, day);
    if (r && r.a.length >= r.q.length) {
      onLog(await finishRound(logRef.current, day));
      setPhase('result');
    } else {
      setPos(r ? r.a.length : 0);
      setPhase('ask');
    }
  };

  // Nach der Auflösung automatisch weiter: richtig 3,5 s, falsch / Zeit abgelaufen 6 s
  const auto = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible || phase !== 'reveal' || !last) return;
    const ms = q && last.value === q.right ? 3500 : 6000;
    auto.setValue(0);
    const anim = Animated.timing(auto, { toValue: 1, duration: ms, easing: Easing.linear, useNativeDriver: false });
    anim.start();
    const timer = setTimeout(next, ms);
    return () => {
      anim.stop();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, phase, last]);

  // ✕: mitten in der Runde nachfragen – offene Fragen zählen dann als falsch
  const close = () => {
    const r = todayRound(logRef.current, day);
    if (!r || r.done || phase === 'result' || (phase === 'count' && r.a.length === 0)) return onClose();
    Alert.alert(t('fq.quitTitle'), t('fq.quitText'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('fq.quitYes'),
        style: 'destructive',
        onPress: async () => {
          onLog(await finishRound(logRef.current, day));
          onClose();
        },
      },
    ]);
  };

  const xpSoFar = round ? roundXp(round) : 0;
  const lvlText = q ? t(`fq.lvl${q.lvl}` as 'fq.lvl1') : '';
  const text = q?.t[lang];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: phase === 'count' ? DARK : p.bg }}>
        {/* Kopf: Schließen, Titel, XP, Fortschritt, Zeit */}
        {phase !== 'result' && (
          <View style={[styles.head, { paddingTop: insets.top + 10 }]}>
            <View style={styles.topRow}>
              <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('fq.close')}>
                <Text style={styles.x}>✕</Text>
              </Pressable>
              <Text style={styles.title}>{t('fq.title')}</Text>
              <View style={styles.xpPill}>
                <Text style={styles.xpText}>+{xpSoFar} XP</Text>
              </View>
            </View>
            {phase !== 'count' && round && (
              <>
                <View style={styles.segs}>
                  {round.q.map((id, i) => {
                    const answered = i < round.a.length;
                    const ok = answered && byId.get(id)?.right === round.a[i];
                    return (
                      <View
                        key={id}
                        style={[
                          styles.seg,
                          answered && { backgroundColor: ok ? '#7CC89A' : '#E07A5F' },
                          !answered && i === pos && { backgroundColor: colors.white },
                        ]}
                      />
                    );
                  })}
                </View>
                <Text style={styles.qn}>
                  {t('fq.question', { n: pos + 1, max: round.q.length })} · {lvlText}
                </Text>
                <View style={styles.timer}>
                  <Animated.View
                    style={[styles.timerFill, { width: timeLeft.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
                  />
                </View>
              </>
            )}
          </View>
        )}

        {phase === 'count' && (
          <View style={styles.countWrap}>
            <Explorer size={84} />
            <Animated.Text
              style={[
                styles.count,
                { opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] },
              ]}
            >
              {count > 0 ? count : t('fq.ready')}
            </Animated.Text>
          </View>
        )}

        {(phase === 'ask' || phase === 'reveal') && q && text && (
          <ScrollView contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}>
            <Text style={[styles.q, { color: p.ink }]}>{text.q}</Text>
            {q.type === 'rank' ? (
              <RankAnswers key={q.id} q={q} text={text} phase={phase} chosen={last?.value} onDone={choose} p={p} />
            ) : q.type === 'duel' ? (
              // Duell: zwei Tiere nebeneinander, eins antippen
              <View style={styles.duel}>
                {text.a.map((a, i) => (
                  <Pressable
                    key={i}
                    onPress={() => choose(i)}
                    disabled={phase !== 'ask'}
                    accessibilityRole="button"
                    style={[styles.duelTile, { backgroundColor: p.card }, look(phase, q.right, last?.value, i, p)]}
                  >
                    <Text style={[styles.duelName, { color: p.ink }]} numberOfLines={3} adjustsFontSizeToFit>
                      {a}
                    </Text>
                  </Pressable>
                ))}
                <View style={styles.vs} pointerEvents="none">
                  <Text style={styles.vsText}>VS</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.answers, q.type === 'tf' && { flexDirection: 'row' }]}>
                {q.type === 'pic' && <QuizPicture id={q.img![0]} />}
                {text.a.map((a, i) => {
                  const st = look(phase, q.right, last?.value, i, p);
                  const right = phase === 'reveal' && i === q.right;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => choose(i)}
                      disabled={phase !== 'ask'}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.answer,
                        q.type === 'tf' && styles.tf,
                        { backgroundColor: p.card, borderColor: p.line, opacity: pressed ? 0.8 : 1 },
                        st,
                        right && { backgroundColor: '#2E7A4C' },
                      ]}
                    >
                      {q.type !== 'tf' && <Text style={[styles.letter, right && { color: '#CFE3D6' }]}>{'ABCD'[i]}</Text>}
                      <Text style={[styles.answerText, { color: right ? colors.white : p.ink }, q.type === 'tf' && { textAlign: 'center' }]}>{a}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {phase === 'reveal' && last && (
              // Auflösung: geht nach ein paar Sekunden von selbst weiter (bei falscher Antwort länger zum Lesen);
              // Antippen springt sofort weiter
              <Pressable
                onPress={next}
                accessibilityRole="button"
                accessibilityHint={t('fq.next')}
                style={[styles.explain, { backgroundColor: last.value === q.right ? 'rgba(46,122,76,0.12)' : 'rgba(200,84,58,0.10)' }]}
              >
                <Text style={[styles.verdict, { color: last.value === q.right ? '#2E7A4C' : '#C8543A' }]}>
                  {last.value === q.right
                    ? `${t('fq.right')} +${answerXp(q, last.value, last.ms)} XP`
                    : last.value < 0
                      ? t('fq.timeUp')
                      : t('fq.wrong')}
                </Text>
                <Text style={[styles.explainText, { color: p.ink }]}>{text.x}</Text>
                <View style={styles.autoTrack}>
                  <Animated.View
                    style={[
                      styles.autoFill,
                      { backgroundColor: last.value === q.right ? '#2E7A4C' : '#C8543A' },
                      { width: auto.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
                    ]}
                  />
                </View>
              </Pressable>
            )}
          </ScrollView>
        )}

        {phase === 'result' && round && <Result round={round} log={log} p={p} onDone={onClose} />}

        {/* fester Werbeplatz unten (nicht beim Countdown, nicht mit Plus) */}
        {phase !== 'count' && (
          <View style={[styles.adBar, { paddingBottom: insets.bottom + 6, backgroundColor: p.bg }]}>
            <AdSlot p={p} placement="challenges" compact />
          </View>
        )}
      </View>
    </Modal>
  );
}

// Farbe einer Antwort nach dem Tippen: richtige grün, eigene falsche rot
function look(phase: Phase, right: number, chosen: number | undefined, i: number, p: Palette) {
  if (phase !== 'reveal') return { borderColor: p.line };
  if (i === right) return { borderColor: '#2E7A4C', borderWidth: 2 };
  if (i === chosen) return { borderColor: '#C8543A', borderWidth: 2, opacity: 0.7 };
  return { borderColor: p.line, opacity: 0.55 };
}

// Rangliste: 4 Einträge in der richtigen Reihenfolge antippen (nochmal tippen nimmt ihn wieder raus).
// Bei der Auflösung stehen sie richtig sortiert da: grün = an der richtigen Stelle getippt.
function RankAnswers({
  q,
  text,
  phase,
  chosen,
  onDone,
  p,
}: {
  q: BankQuestion;
  text: BankQuestion['t'][keyof BankQuestion['t']];
  phase: Phase;
  chosen?: number;
  onDone: (value: number) => void;
  p: Palette;
}) {
  const { t } = useI18n();
  const [picked, setPicked] = useState<number[]>([]);
  const tap = (i: number) => {
    if (phase !== 'ask') return;
    const at = picked.indexOf(i);
    const next = at >= 0 ? picked.slice(0, at) : [...picked, i];
    setPicked(next);
    if (next.length === text.a.length) onDone(encodeRank(next));
  };
  if (phase === 'reveal') {
    const mine = decodeRank(chosen ?? -1);
    return (
      <View style={styles.answers}>
        {text.a.map((a, i) => {
          const ok = mine?.[i] === i;
          return (
            <View key={i} style={[styles.answer, { backgroundColor: p.card, borderColor: ok ? '#2E7A4C' : '#C8543A', borderWidth: 2 }]}>
              <View style={[styles.rankBadge, { backgroundColor: ok ? '#2E7A4C' : '#C8543A' }]}>
                <Text style={styles.rankNum}>{i + 1}</Text>
              </View>
              <Text style={[styles.answerText, { color: p.ink }]}>{a}</Text>
              {!ok && mine && <Text style={[styles.rankMine, { color: p.mute }]}>{t('fq.rankYours', { n: mine.indexOf(i) + 1 })}</Text>}
            </View>
          );
        })}
      </View>
    );
  }
  return (
    <View style={styles.answers}>
      <Text style={[styles.rankHint, { color: p.mute }]}>{t('fq.rankHint')}</Text>
      {rankOrder(q).map((i) => {
        const at = picked.indexOf(i);
        return (
          <Pressable
            key={i}
            onPress={() => tap(i)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.answer,
              { backgroundColor: p.card, borderColor: at >= 0 ? colors.accent : p.line, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View style={[styles.rankBadge, at >= 0 ? { backgroundColor: colors.accent } : { borderWidth: 1.5, borderColor: p.line }]}>
              {at >= 0 && <Text style={styles.rankNum}>{at + 1}</Text>}
            </View>
            <Text style={[styles.answerText, { color: p.ink }]}>{text.a[i]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Großes Quiz-Bild (Spur, Umriss am Himmel, Fundstück) in einer abgerundeten Karte
function QuizPicture({ id }: { id: string }) {
  const [from, to] = QUIZ_ART_BG[id] ?? ['#EADBB9', '#C7A978'];
  const Art = QUIZ_ART[id];
  const g = `fqa-${id}`;
  return (
    <View style={styles.pic}>
      <Svg width={176} height={176} viewBox="0 0 64 64">
        <Defs>
          <LinearGradient id={`${g}-bg`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
          <ClipPath id={`${g}-c`}>
            <Rect width={64} height={64} rx={8} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${g}-c)`}>
          <Rect width={64} height={64} fill={`url(#${g}-bg)`} />
          {Art && Art()}
        </G>
      </Svg>
    </View>
  );
}

// Auswertung: Ergebnis, XP, Serie, Tempo und was man heute gelernt hat
function Result({ round, log, p, onDone }: { round: NonNullable<ReturnType<typeof todayRound>>; log: ForscherLog; p: Palette; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const correct = roundCorrect(round);
  const xp = roundXp(round);
  const days = streak(log);
  const times = round.ms.filter((ms, i) => round.a[i] >= 0);
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length / 1000 : 0;
  // gelernt: die Fakten zu falschen Antworten (bei 10/10 die zu den drei schwersten Fragen)
  const missed = round.q.filter((id, i) => byId.get(id)?.right !== round.a[i]);
  const facts = (missed.length ? missed : [...round.q].reverse().slice(0, 3)).map((id) => byId.get(id)!).filter(Boolean);
  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 44, paddingBottom: 150 + insets.bottom }}>
      <Text style={[styles.resLabel, { color: p.mute }]}>{t('fq.resultTitle')}</Text>
      <Text style={[styles.resBig, { color: p.ink }]}>
        {correct} / {round.q.length}
      </Text>
      <View style={styles.resPill}>
        <Text style={styles.resPillText}>+{xp} XP</Text>
      </View>
      <View style={styles.chips}>
        <View style={[styles.chip, { backgroundColor: p.card }]}>
          <Text style={[styles.chipText, { color: p.ink }]}>{days === 1 ? t('fq.inARow1') : t('fq.inARow', { n: days })}</Text>
        </View>
        {avg > 0 && (
          <View style={[styles.chip, { backgroundColor: p.card }]}>
            <Text style={[styles.chipText, { color: p.ink }]}>{t('fq.avg', { s: avg.toFixed(1).replace('.', lang === 'en' ? '.' : ',') })}</Text>
          </View>
        )}
      </View>
      <View style={[styles.learn, { backgroundColor: p.card }]}>
        <Text style={[styles.learnTitle, { color: p.ink }]}>{missed.length ? t('fq.learned') : t('fq.perfect')}</Text>
        {facts.map((q) => (
          <Text key={q.id} style={[styles.fact, { color: p.ink, borderTopColor: p.line }]}>
            {q.t[lang].x}
          </Text>
        ))}
      </View>
      <Pressable onPress={onDone} style={styles.done} accessibilityRole="button">
        <Text style={styles.doneText}>{t('fq.finish')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { backgroundColor: DARK, paddingHorizontal: 18, paddingBottom: 16, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  x: { color: colors.white, fontSize: 20, opacity: 0.8 },
  title: { fontFamily: fonts.serifBold, fontSize: 19, color: colors.white, marginLeft: 14 },
  xpPill: { marginLeft: 'auto', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  xpText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accentLight },
  segs: { flexDirection: 'row', gap: 4, marginTop: 14 },
  seg: { flex: 1, height: 6, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.18)' },
  qn: { fontFamily: fonts.sansBold, fontSize: 12, color: '#CFE3D6', marginTop: 10 },
  timer: { height: 8, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 8, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 6, backgroundColor: colors.accent },
  countWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  count: { fontFamily: fonts.serifBold, fontSize: 120, color: colors.white, marginTop: 24 },
  q: { fontFamily: fonts.serifBold, fontSize: 22, lineHeight: 28, marginHorizontal: 20, marginTop: 24, marginBottom: 18 },
  answers: { marginHorizontal: 18, gap: 10 },
  answer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 },
  tf: { flex: 1, justifyContent: 'center', paddingVertical: 22 },
  letter: { fontFamily: fonts.sansBold, fontSize: 15, color: '#8A9A8F', marginRight: 12 },
  answerText: { flex: 1, fontFamily: fonts.sansBold, fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginHorizontal: 18 },
  tile: { width: '47.5%', alignItems: 'center', borderWidth: 2, borderRadius: 18, paddingTop: 10, paddingBottom: 8 },
  duel: { flexDirection: 'row', gap: 14, marginHorizontal: 18 },
  duelTile: { flex: 1, minHeight: 150, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: 20, padding: 14 },
  duelName: { fontFamily: fonts.serifBold, fontSize: 21, lineHeight: 26, textAlign: 'center' },
  rankHint: { fontFamily: fonts.sansBold, fontSize: 13, marginBottom: 2 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rankNum: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.white },
  rankMine: { fontFamily: fonts.sansBold, fontSize: 12, marginLeft: 8 },
  vs: {
    position: 'absolute',
    left: '50%',
    top: 53,
    marginLeft: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  vsText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.white },
  pic: { alignSelf: 'center', marginBottom: 6, borderRadius: 22, overflow: 'hidden' },
  tileText: { fontFamily: fonts.sansBold, fontSize: 14, marginTop: 4, paddingHorizontal: 6 },
  explain: { marginHorizontal: 18, marginTop: 14, borderRadius: 14, padding: 14 },
  verdict: { fontFamily: fonts.sansBold, fontSize: 15, marginBottom: 4 },
  explainText: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 20 },
  autoTrack: { height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.06)', marginTop: 10, overflow: 'hidden' },
  autoFill: { height: '100%', borderRadius: 2 },
  adBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 6 },
  resLabel: { fontFamily: fonts.sansBold, fontSize: 15, textAlign: 'center' },
  resBig: { fontFamily: fonts.serifBold, fontSize: 56, textAlign: 'center', marginTop: 4 },
  resPill: { alignSelf: 'center', backgroundColor: colors.accent, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 8, marginTop: 10 },
  resPillText: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.ink },
  chips: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 14 },
  chip: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { fontFamily: fonts.sansBold, fontSize: 13 },
  learn: { marginHorizontal: spacing.gutter, marginTop: 22, borderRadius: 18, padding: 16 },
  learnTitle: { fontFamily: fonts.serifBold, fontSize: 17, marginBottom: 4 },
  fact: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, paddingVertical: 9, borderTopWidth: 1 },
  done: { marginHorizontal: spacing.gutter, marginTop: 16, backgroundColor: '#1F6E47', borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  doneText: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.white },
});
