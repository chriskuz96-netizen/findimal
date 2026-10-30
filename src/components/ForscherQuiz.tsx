import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { ClipPath, Defs, G, LinearGradient, Rect, Stop } from 'react-native-svg';

import { showRewarded } from '../ads';
import { usePlus } from '../plus';
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
  grantJoker,
  JOKER_EXTRA_MS,
  jokerHidden,
  jokerKind,
  roundCorrect,
  rankOrder,
  roundXp,
  spendJoker,
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
type Phase = 'intro' | 'count' | 'ask' | 'reveal' | 'result';

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
  const { plus } = usePlus();
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

  // Beim Öffnen: Runde anlegen; schon fertig → gleich die Auswertung, sonst Countdown.
  // Vor einer neuen Runde bekommen Gratis-Nutzer den Joker angeboten (per Video), Plus-Kunden haben ihn immer.
  useEffect(() => {
    if (!visible) return;
    setLast(null);
    const r = todayRound(logRef.current, day);
    if (r?.done) return setPhase('result');
    setPhase(!plus && (!r || (r.a.length === 0 && r.j === undefined)) ? 'intro' : 'count');
    setCount(3);
    startRound(logRef.current, day).then(async (l) => onLog(plus ? await grantJoker(l, day) : l));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Joker per Video holen (danach Countdown); ohne Joker gleich los
  const takeJoker = async () => {
    if (await showRewarded()) onLog(await grantJoker(await startRound(logRef.current, day), day));
    setPhase('count');
  };

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
  const rankRef = useRef<number[] | null>(null);
  // Höhe der Werbeleiste unten (darüber sitzt „Weiter“) und Bildgröße passend zur Bildschirmhöhe
  const [adH, setAdH] = useState(insets.bottom + 70);
  const screenH = useWindowDimensions().height;
  const picSize = Math.min(176, Math.round(screenH * 0.2));
  const small = screenH < 760; // kleine iPhones: bei der Auflösung ohne Bild, damit alles auf eine Seite passt
  const askedAt = useRef(0);
  const busy = useRef(false);
  const deadline = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Zeit um: bei einer Rangliste zählt, was gerade dasteht
  const timeUp = useRef(() => {});
  timeUp.current = () => q && choose(q.type === 'rank' && rankRef.current ? encodeRank(rankRef.current) : -1);
  const stopTimer = () => {
    timeLeft.stopAnimation();
    if (timer.current) clearTimeout(timer.current);
  };
  // Balken von „remaining / total“ bis 0 laufen lassen
  const runTimer = (remaining: number, total: number) => {
    stopTimer();
    deadline.current = Date.now() + remaining;
    timeLeft.setValue(remaining / total);
    Animated.timing(timeLeft, { toValue: 0, duration: remaining, easing: Easing.linear, useNativeDriver: false }).start();
    timer.current = setTimeout(() => timeUp.current(), remaining);
  };
  useEffect(() => {
    if (!visible || phase !== 'ask' || !q) return;
    busy.current = false;
    askedAt.current = Date.now();
    runTimer(timeFor(q) * 1000, timeFor(q) * 1000);
    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, phase, q?.id]);

  // Joker: einmal pro Runde, bei der gerade gezeigten Frage
  const jokerHere = !!round && round.j === pos;
  const rankJoker = useRef<(() => void) | null>(null);
  const playJoker = async () => {
    if (phase !== 'ask' || !q || busy.current || round?.j !== -1) return;
    const kind = jokerKind(q);
    if (kind === 'time') runTimer(Math.max(0, deadline.current - Date.now()) + JOKER_EXTRA_MS, timeFor(q) * 1000 + JOKER_EXTRA_MS);
    if (kind === 'place') rankJoker.current?.();
    onLog(await spendJoker(logRef.current, day));
  };
  const hidden = jokerHere && q && jokerKind(q) === 'half' ? jokerHidden(q) : [];

  const choose = async (value: number) => {
    if (busy.current || phase !== 'ask') return;
    busy.current = true;
    const limit = timeFor(q!) * 1000 + (jokerHere && jokerKind(q!) === 'time' ? JOKER_EXTRA_MS : 0);
    const ms = Math.min(limit, Date.now() - askedAt.current);
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

  // ✕: mitten in der Runde nachfragen – offene Fragen zählen dann als falsch
  const close = () => {
    const r = todayRound(logRef.current, day);
    if (!r || r.done || phase === 'result' || ((phase === 'count' || phase === 'intro') && r.a.length === 0)) return onClose();
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
      <View style={{ flex: 1, backgroundColor: phase === 'count' || phase === 'intro' ? DARK : p.bg }}>
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
            {phase !== 'count' && phase !== 'intro' && round && (
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
                <View style={styles.qnRow}>
                  <Text style={styles.qn}>
                    {t('fq.question', { n: pos + 1, max: round.q.length })} · {lvlText}
                  </Text>
                  {/* Joker: noch frei → Knopf (was er bei dieser Frage macht, steht drauf) */}
                  {phase === 'ask' && round.j === -1 && q && (
                    <Pressable
                      onPress={playJoker}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={t('fq.jokerA11y')}
                      style={({ pressed }) => [styles.jokerBtn, { opacity: pressed ? 0.8 : 1 }]}
                    >
                      <Text style={styles.jokerText}>{t(`fq.joker_${jokerKind(q)}` as 'fq.joker_half')}</Text>
                    </Pressable>
                  )}
                </View>
                <View style={styles.timer}>
                  <Animated.View
                    style={[styles.timerFill, { width: timeLeft.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
                  />
                </View>
              </>
            )}
          </View>
        )}

        {phase === 'intro' && (
          <View style={[styles.countWrap, { paddingHorizontal: 28 }]}>
            <Explorer size={84} />
            <Text style={styles.introTitle}>{t('fq.introTitle')}</Text>
            <Text style={styles.introText}>{t('fq.jokerInfo')}</Text>
            <Pressable onPress={takeJoker} accessibilityRole="button" style={({ pressed }) => [styles.introJoker, { opacity: pressed ? 0.85 : 1 }]}>
              <Text style={styles.introJokerText}>{t('fq.jokerVideo')}</Text>
              <Text style={styles.introJokerSub}>{t('fq.jokerVideoSub')}</Text>
            </Pressable>
            <Pressable onPress={() => setPhase('count')} hitSlop={8} accessibilityRole="button" style={styles.introSkip}>
              <Text style={styles.introSkipText}>{t('fq.noJoker')} ›</Text>
            </Pressable>
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
            {round?.j === -1 && <Text style={styles.jokerReady}>{t('fq.jokerReady')}</Text>}
          </View>
        )}

        {(phase === 'ask' || phase === 'reveal') && q && text && (
          // Alles auf einer Seite, ohne Scrollen: Frage und Antworten oben, Auflösung und „Weiter“ fest unten
          // über der Werbung. Bei der Auflösung bleiben nur die richtige (und die eigene falsche) Antwort stehen,
          // Bild und Kacheln werden kleiner – so passt die Erklärung immer darunter.
          // Nach der Auflösung: irgendwo hintippen geht auch weiter.
          <View
            style={{ flex: 1, paddingBottom: adH + 8 }}
            onStartShouldSetResponder={() => phaseRef.current === 'reveal'}
            onResponderRelease={next}
          >
            {/* oben: Frage und Antworten (wird im Notfall unten abgeschnitten, nie der „Weiter“-Knopf) */}
            <View style={{ flexShrink: 1, overflow: 'hidden' }}>
              <Text style={[styles.q, { color: p.ink }]} numberOfLines={4} adjustsFontSizeToFit minimumFontScale={0.75}>
                {text.q}
              </Text>
              {q.type === 'rank' ? (
                <RankAnswers key={q.id} q={q} text={text} phase={phase} chosen={last?.value} onDone={choose} orderRef={rankRef} jokerRef={rankJoker} p={p} />
              ) : q.type === 'duel' ? (
                // Duell: zwei Tiere nebeneinander, eins antippen
                <View style={styles.duel}>
                  {text.a.map((a, i) => (
                    <Pressable
                      key={i}
                      onPress={() => choose(i)}
                      disabled={phase !== 'ask'}
                      accessibilityRole="button"
                      style={[styles.duelTile, phase === 'reveal' && { minHeight: 92 }, { backgroundColor: p.card }, look(phase, q.right, last?.value, i, p)]}
                    >
                      <Text style={[styles.duelName, { color: p.ink }]} numberOfLines={3} adjustsFontSizeToFit>
                        {a}
                      </Text>
                    </Pressable>
                  ))}
                  <View style={[styles.vs, phase === 'reveal' && { top: 24 }]} pointerEvents="none">
                    <Text style={styles.vsText}>VS</Text>
                  </View>
                </View>
              ) : (
                // Antworten als Kacheln (2 × 2, bei Wahr/Falsch 2 nebeneinander) – wie bei Quizduell.
                // Auflösung: richtige Kachel grün, eigene falsche rot, die anderen blass.
                <View style={styles.answers}>
                  {q.type === 'pic' && (phase === 'ask' || !small) && <QuizPicture id={q.img![0]} size={phase === 'reveal' ? 96 : picSize} />}
                  <View style={styles.tiles}>
                    {text.a.map((a, i) => {
                      const right = phase === 'reveal' && i === q.right;
                      const wrong = phase === 'reveal' && i === last?.value && i !== q.right;
                      const gone = hidden.includes(i); // 50:50-Joker: Kachel bleibt als Lücke stehen
                      return (
                        <Pressable
                          key={i}
                          onPress={() => choose(i)}
                          disabled={phase !== 'ask' || gone}
                          accessibilityElementsHidden={gone}
                          accessibilityRole="button"
                          style={({ pressed }) => [
                            styles.ansTile,
                            { minHeight: phase === 'reveal' ? 64 : q.type === 'tf' ? 110 : small && q.type === 'pic' ? 80 : 100 },
                            { backgroundColor: p.card, borderColor: p.line, opacity: pressed ? 0.8 : 1 },
                            right && { backgroundColor: '#2E7A4C', borderColor: '#2E7A4C' },
                            wrong && { backgroundColor: '#C8543A', borderColor: '#C8543A' },
                            phase === 'reveal' && !right && !wrong && { opacity: 0.45 },
                            gone && { opacity: 0 },
                          ]}
                        >
                          <Text
                            style={[styles.ansTileText, { color: right || wrong ? colors.white : p.ink }]}
                            numberOfLines={4}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                          >
                            {a}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {phase === 'reveal' && last && (
              <View style={styles.revealFoot}>
                {/* Auflösung: bleibt stehen, bis man weitertippt (in Ruhe lesen, kein Zeitdruck) */}
                <Pressable
                  onPress={next}
                  accessibilityRole="button"
                  accessibilityHint={t('fq.next')}
                  style={[styles.explain, { backgroundColor: last.value === q.right ? 'rgba(46,122,76,0.12)' : 'rgba(200,84,58,0.10)' }]}
                >
                  <Text style={[styles.verdict, { color: last.value === q.right ? '#2E7A4C' : '#C8543A' }]}>
                    {last.value === q.right
                      ? `${t('fq.right')} +${answerXp(q, last.value, last.ms, jokerHere)} XP`
                      : last.value < 0
                        ? t('fq.timeUp')
                        : t('fq.wrong')}
                  </Text>
                  <Text style={[styles.explainText, { color: p.ink }]} numberOfLines={7} adjustsFontSizeToFit minimumFontScale={0.8}>
                    {text.x}
                  </Text>
                </Pressable>
                <Pressable onPress={next} accessibilityRole="button" style={({ pressed }) => [styles.next, { opacity: pressed ? 0.85 : 1 }]}>
                  <Text style={styles.nextText}>{round && round.a.length >= round.q.length ? t('fq.toResult') : t('fq.next')} ›</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {phase === 'result' && round && <Result round={round} log={log} p={p} onDone={onClose} bottom={adH} />}

        {/* fester Werbeplatz unten (nicht beim Countdown, nicht mit Plus) */}
        {phase !== 'count' && phase !== 'intro' && (
          <View style={[styles.adBar, { paddingBottom: insets.bottom + 6, backgroundColor: p.bg }]} onLayout={(e) => setAdH(e.nativeEvent.layout.height)}>
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

// Rangliste wie ein Treppchen: links fest die Plätze 1–4, die Einträge schiebt man mit dem Finger
// an die richtige Stelle und tippt dann auf „Fertig“. Läuft die Zeit ab, zählt die aktuelle Reihenfolge.
// Bei der Auflösung stehen sie richtig sortiert da: grün = an der richtigen Stelle.
const ROW = 62; // Höhe einer Zeile samt Abstand
const PODIUM = ['#E8B53A', '#AEB8C2', '#C98552', '#8A9A8F'];

function RankAnswers({
  q,
  text,
  phase,
  chosen,
  onDone,
  orderRef,
  jokerRef,
  p,
}: {
  q: BankQuestion;
  text: BankQuestion['t'][keyof BankQuestion['t']];
  phase: Phase;
  chosen?: number;
  onDone: (value: number) => void;
  orderRef: React.MutableRefObject<number[] | null>; // aktuelle Reihenfolge (für den Zeitablauf)
  jokerRef: React.MutableRefObject<(() => void) | null>; // Joker: einen Platz richtig setzen und festhalten
  p: Palette;
}) {
  const { t } = useI18n();
  const n = text.a.length;
  // order[platz] = Eintrag; ys[eintrag] = Position der Zeile
  const order = useRef<number[]>(rankOrder(q));
  const ys = useRef(text.a.map((_, i) => new Animated.Value(order.current.indexOf(i) * ROW))).current;
  const [dragging, setDragging] = useState<number | null>(null);
  const [, redraw] = useState(0);
  orderRef.current = order.current;
  // Joker: der erste falsch stehende Platz bekommt den richtigen Eintrag, der bleibt dann fest (grün)
  const locked = useRef<number | null>(null);
  const keepLocked = (list: number[]) => {
    const l = locked.current;
    if (l === null) return list;
    const rest = list.filter((v) => v !== l);
    rest.splice(l, 0, l);
    return rest;
  };

  const place = (except?: number) =>
    order.current.forEach((item, slot) => {
      if (item !== except) Animated.spring(ys[item], { toValue: slot * ROW, useNativeDriver: false, speed: 22, bounciness: 4 }).start();
    });

  jokerRef.current = () => {
    const slot = order.current.findIndex((item, s) => item !== s);
    if (slot < 0) return;
    locked.current = slot;
    order.current = keepLocked(order.current);
    orderRef.current = order.current;
    place();
    redraw((v) => v + 1);
  };

  const responders = useRef(
    text.a.map((_, item) => {
      let start = 0;
      return PanResponder.create({
        onStartShouldSetPanResponder: () => locked.current !== item,
        onMoveShouldSetPanResponder: () => locked.current !== item,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          start = order.current.indexOf(item) * ROW;
          setDragging(item);
        },
        onPanResponderMove: (_, g) => {
          const y = Math.max(-10, Math.min((n - 1) * ROW + 10, start + g.dy));
          ys[item].setValue(y);
          const target = Math.max(0, Math.min(n - 1, Math.round(y / ROW)));
          const from = order.current.indexOf(item);
          if (target !== from) {
            const moved = order.current.filter((v) => v !== item);
            moved.splice(target, 0, item);
            const next = keepLocked(moved);
            order.current = next;
            orderRef.current = next;
            place(item);
          }
        },
        onPanResponderRelease: () => {
          place();
          setDragging(null);
          redraw((v) => v + 1);
        },
        onPanResponderTerminate: () => {
          place();
          setDragging(null);
        },
      });
    }),
  ).current;

  if (phase === 'reveal') {
    const mine = decodeRank(chosen ?? -1);
    return (
      // kompakt, damit die Erklärung auch auf kleinen iPhones darunter passt
      <View style={[styles.answers, { gap: 6 }]}>
        {text.a.map((a, i) => {
          const ok = mine?.[i] === i;
          return (
            <View key={i} style={[styles.answer, { paddingVertical: 5, backgroundColor: p.card, borderColor: ok ? '#2E7A4C' : '#C8543A', borderWidth: 2 }]}>
              <View style={[styles.rankBadge, { width: 24, height: 24, borderRadius: 12, backgroundColor: ok ? '#2E7A4C' : '#C8543A' }]}>
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
      <View style={{ flexDirection: 'row' }}>
        {/* Treppchen: Plätze bleiben fest stehen */}
        <View>
          {text.a.map((_, slot) => (
            <View key={slot} style={[styles.podium, { backgroundColor: PODIUM[slot] }]}>
              <Text style={styles.podiumNum}>{slot + 1}</Text>
            </View>
          ))}
        </View>
        <View style={{ flex: 1, height: n * ROW - 10 }}>
          {text.a.map((a, item) => (
            <Animated.View
              key={item}
              {...responders[item].panHandlers}
              accessibilityRole="adjustable"
              accessibilityLabel={a}
              style={[
                styles.rankRow,
                { backgroundColor: p.card, borderColor: dragging === item ? colors.accent : p.line, transform: [{ translateY: ys[item] }] },
                dragging === item && styles.rankLift,
                locked.current === item && { borderColor: '#2E7A4C', borderWidth: 2 },
              ]}
            >
              <Text selectable={false} style={[styles.answerText, { color: p.ink }]} numberOfLines={2}>
                {a}
              </Text>
              <Text selectable={false} style={[styles.grip, { color: locked.current === item ? '#2E7A4C' : p.mute }]}>
                {locked.current === item ? '✓' : '⋮⋮'}
              </Text>
            </Animated.View>
          ))}
        </View>
      </View>
      <Pressable
        onPress={() => onDone(encodeRank(order.current))}
        accessibilityRole="button"
        style={({ pressed }) => [styles.rankDone, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.rankDoneText}>{t('fq.rankDone')}</Text>
      </Pressable>
    </View>
  );
}

// Großes Quiz-Bild (Spur, Umriss am Himmel, Fundstück) in einer abgerundeten Karte
function QuizPicture({ id, size }: { id: string; size: number }) {
  const [from, to] = QUIZ_ART_BG[id] ?? ['#EADBB9', '#C7A978'];
  const Art = QUIZ_ART[id];
  const g = `fqa-${id}`;
  return (
    <View style={styles.pic}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
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
// „Fertig“ steht fest unten über der Werbung; nur die gelernten Fakten scrollen, falls es viele sind
function Result({
  round,
  log,
  p,
  onDone,
  bottom,
}: {
  round: NonNullable<ReturnType<typeof todayRound>>;
  log: ForscherLog;
  p: Palette;
  onDone: () => void;
  bottom: number;
}) {
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
    <View style={{ flex: 1, paddingBottom: bottom + 8 }}>
      <ScrollView alwaysBounceVertical={false} contentContainerStyle={{ paddingTop: insets.top + 44, paddingBottom: 12 }}>
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
      </ScrollView>
      <Pressable onPress={onDone} style={styles.done} accessibilityRole="button">
        <Text style={styles.doneText}>{t('fq.finish')}</Text>
      </Pressable>
    </View>
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
  qnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, minHeight: 24 },
  qn: { fontFamily: fonts.sansBold, fontSize: 12, color: '#CFE3D6' },
  jokerBtn: { backgroundColor: colors.accentLight, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  jokerText: { fontFamily: fonts.sansBold, fontSize: 12.5, color: DARK },
  jokerReady: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.accentLight, marginTop: 12 },
  introTitle: { fontFamily: fonts.serifBold, fontSize: 26, color: colors.white, marginTop: 18, textAlign: 'center' },
  introText: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, color: '#CFE3D6', marginTop: 10, textAlign: 'center' },
  introJoker: { alignSelf: 'stretch', marginTop: 26, backgroundColor: colors.accentLight, borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
  introJokerText: { fontFamily: fonts.sansBold, fontSize: 17, color: DARK },
  introJokerSub: { fontFamily: fonts.sans, fontSize: 13, color: DARK, opacity: 0.75, marginTop: 2 },
  introSkip: { marginTop: 18, paddingVertical: 6 },
  introSkipText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.white, opacity: 0.85 },
  timer: { height: 8, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 8, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 6, backgroundColor: colors.accent },
  countWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  count: { fontFamily: fonts.serifBold, fontSize: 120, color: colors.white, marginTop: 24 },
  q: { fontFamily: fonts.serifBold, fontSize: 21, lineHeight: 27, marginHorizontal: 20, marginTop: 18, marginBottom: 14 },
  answers: { marginHorizontal: 18, gap: 10 },
  answer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 16 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  ansTile: { width: '48.5%', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 10 },
  ansTileText: { fontFamily: fonts.sansBold, fontSize: 16, lineHeight: 21, textAlign: 'center' },
  answerText: { flex: 1, fontFamily: fonts.sansBold, fontSize: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginHorizontal: 18 },
  tile: { width: '47.5%', alignItems: 'center', borderWidth: 2, borderRadius: 18, paddingTop: 10, paddingBottom: 8 },
  duel: { flexDirection: 'row', gap: 14, marginHorizontal: 18 },
  duelTile: { flex: 1, minHeight: 150, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: 20, padding: 14 },
  duelName: { fontFamily: fonts.serifBold, fontSize: 21, lineHeight: 26, textAlign: 'center' },
  rankHint: { fontFamily: fonts.sansBold, fontSize: 13, marginBottom: 2 },
  podium: { width: 40, height: ROW - 10, borderRadius: 14, marginBottom: 10, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
  podiumNum: { fontFamily: fonts.serifBold, fontSize: 20, color: colors.white },
  rankRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ROW - 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  rankLift: { zIndex: 10, elevation: 6, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  grip: { fontSize: 18, letterSpacing: -3, marginLeft: 8 },
  rankDone: { marginTop: 4, backgroundColor: '#1F6E47', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  rankDoneText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.white },
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
  revealFoot: { marginTop: 'auto', paddingTop: 12, flexShrink: 0 },
  explain: { marginHorizontal: 18, borderRadius: 14, padding: 14 },
  verdict: { fontFamily: fonts.sansBold, fontSize: 15, marginBottom: 4 },
  explainText: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 20 },
  next: { marginHorizontal: 18, marginTop: 10, backgroundColor: '#1F6E47', borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  nextText: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.white },
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
