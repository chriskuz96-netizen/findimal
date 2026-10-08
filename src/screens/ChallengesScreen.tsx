import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { AdSlot } from '../components/AdSlot';
import { Avatar } from '../components/Avatar';
import { Explorer } from '../components/Explorer';
import { HeaderBackground } from '../components/HeaderBackground';
import { Leaderboard } from '../components/Leaderboard';
import { Medal } from '../components/Medal';
import { GroupIcon, GROUPS } from '../groups';
import { useI18n } from '../i18n';
import { Badge, levelAt, Progress, XP } from '../progress';
import { seasonDaysLeft } from '../season';
import { WeekTask } from '../weekly';
import { answeredToday, nextQuestion, question as questionAt, QUESTIONS_PER_DAY, QuizLog, todayAnswered } from '../quiz';
import { colors, darkPalette, fonts, lightPalette, Palette, spacing } from '../theme';

type Props = {
  progress: Progress;
  quiz: QuizLog; // bisherige Antworten
  onAnswer: (question: number, answer: number) => void;
  avatar: string; // Abzeichen als Profilbild ('' = keins)
  name: string;
  species: number; // Anzahl verschiedener Arten (für die Rangliste)
  invite: string | null; // Freundescode aus einem Einladungslink
  onInviteDone: () => void;
  onRank: (rank: number) => void; // eigener Platz in der weltweiten Rangliste
  onFriends: (n: number) => void; // Zahl der Freunde in der Rangliste
  active?: boolean; // false, solange eine andere Seite (z. B. Ergebnis) darüber liegt
  freshBadges?: string[]; // neu verdiente, noch nicht angesehene Abzeichen
  onSeeBadges?: (ids: string[]) => void;
  onOpenProfile?: () => void;
};

export function ChallengesScreen({ progress, quiz, onAnswer, avatar, name, species, invite, onInviteDone, onRank, onFriends, active = true, freshBadges = [], onSeeBadges, onOpenProfile }: Props) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const goal = progress.season;
  const week = progress.week;
  const seasonLeft = seasonDaysLeft(new Date());
  // Quiz: die gerade gezeigte Frage bleibt nach dem Antworten stehen, bis man "Nächste Frage" tippt
  // höchstens 3 Fragen pro Tag
  const canAsk = (log: QuizLog) => answeredToday(log) < QUESTIONS_PER_DAY;
  const [shown, setShown] = useState<number | null>(() => (canAsk(quiz) ? nextQuestion(quiz) : null));
  const allDone = nextQuestion(quiz) === null;
  // heute beantwortete Fragen + die gerade offene Frage
  const today = todayAnswered(quiz);
  const items = shown !== null && !today.includes(shown) ? [...today, shown] : today;
  const quizDone = !canAsk(quiz) || allDone; // für heute fertig
  // angezeigte Frage: standardmäßig die letzte (aktuelle), mit Zurück/Weiter blätterbar
  const [posState, setPos] = useState<number | null>(null);
  const pos = Math.max(0, Math.min(posState ?? items.length - 1, items.length - 1));
  const cur = items.length ? items[pos] : null;
  const todayXp = today.filter((i) => quiz[`q${i}`] === questionAt(i, lang).right).length * XP.quiz;
  const badgeName = (b: Badge) => t(`badge.${b.id}`);
  const badgeHint = (b: Badge) => t(`badge.${b.id}.hint`);
  const span = (progress.nextLevelXp ?? progress.xp) - progress.levelStart;
  const share = progress.nextLevelXp ? (progress.xp - progress.levelStart) / span : 1;

  // Belohnung: sind seit dem letzten Besuch XP dazugekommen (Foto, Saison-Ziel, Quiz …),
  // läuft dieselbe Animation wie in der Einblendung nach dem Foto: XP zählen hoch,
  // der Balken füllt sich langsam und das neue Stück leuchtet hell auf.
  const fill = useRef(new Animated.Value(share)).current;
  const glow = useRef(new Animated.Value(1)).current;
  const count = useRef(new Animated.Value(progress.xp)).current;
  const gainFade = useRef(new Animated.Value(0)).current;
  const [gain, setGain] = useState(0);
  const [shownXp, setShownXp] = useState(progress.xp);
  const [shownLevel, setShownLevel] = useState(progress.level);
  const [base, setBase] = useState(share); // alter Stand; alles darüber ist neu
  const lastXp = useRef<number | null>(null);
  // Scrollstand und Höhe des großen Kopfs (für die schmale Leiste)
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headH, setHeadH] = useState(1000);

  // Neue Abzeichen: stehen vorne mit "NEU"; gelten als gesehen, sobald man sie antippt
  // oder die Abzeichen auf dem Bildschirm hatte und die Seite wieder verlässt
  const { height: winH } = useWindowDimensions();
  const badgesY = useRef(Infinity);
  const sawBadges = useRef(false);
  const freshRef = useRef(freshBadges);
  freshRef.current = freshBadges;
  const seeRef = useRef(onSeeBadges);
  seeRef.current = onSeeBadges;
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      if (active && value + winH > badgesY.current + 120) sawBadges.current = true;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY, winH, active]);
  useEffect(
    () => () => {
      if (sawBadges.current && freshRef.current.length) seeRef.current?.(freshRef.current);
    },
    [],
  );
  const badgeList = [...progress.badges].sort(
    (a, b) => Number(freshBadges.includes(b.id)) - Number(freshBadges.includes(a.id)),
  );
  useEffect(() => {
    if (!active) return; // erst animieren, wenn man die Seite wirklich sieht
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const shareAt = (xp: number) => {
      const l = levelAt(xp);
      return l.nextLevelXp ? Math.max(0, Math.min(1, (xp - l.levelStart) / (l.nextLevelXp - l.levelStart))) : 1;
    };
    const id = count.addListener(({ value }) => setShownXp(Math.round(value)));
    const run = (before: number) => {
      if (!alive) return;
      lastXp.current = progress.xp;
      AsyncStorage.setItem(SEEN_XP_KEY, String(progress.xp)).catch(() => {});
      if (before >= progress.xp) {
        fill.setValue(share);
        count.setValue(progress.xp);
        setShownXp(progress.xp);
        setShownLevel(progress.level);
        setBase(share);
        return;
      }
      const oldLevel = levelAt(before).level;
      const levelUp = oldLevel < progress.level;
      const from = shareAt(before);
      setGain(progress.xp - before);
      setShownLevel(oldLevel);
      setBase(from);
      fill.setValue(from);
      count.setValue(before);
      setShownXp(before);
      gainFade.setValue(0);
      glow.setValue(0.6);
      const to = (toValue: number, duration: number) =>
        Animated.timing(fill, { toValue, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false });
      // bei neuer Stufe: erst voll, dann von vorn bis zum neuen Stand
      const filling = levelUp
        ? Animated.sequence([to(1, 1100), Animated.timing(fill, { toValue: 0, duration: 0, useNativeDriver: false }), to(share, 1200)])
        : to(share, 2000);
      const counting = Animated.timing(count, {
        toValue: progress.xp,
        duration: levelUp ? 2400 : 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      });
      Animated.sequence([
        Animated.delay(400),
        Animated.parallel([counting, filling, Animated.timing(gainFade, { toValue: 1, duration: 300, useNativeDriver: true })]),
        Animated.delay(1800),
        Animated.timing(gainFade, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
      // das neue Stück pulsiert dreimal
      Animated.sequence([
        Animated.delay(1300),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glow, { toValue: 1, duration: 380, useNativeDriver: false }),
            Animated.timing(glow, { toValue: 0.55, duration: 380, useNativeDriver: false }),
          ]),
          { iterations: 3 },
        ),
        Animated.timing(glow, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start(({ finished }) => {
        if (finished && alive) setBase(share); // danach wird alles wieder orange
      });
      if (levelUp)
        timer = setTimeout(() => {
          if (!alive) return;
          setShownLevel(progress.level);
          setBase(0);
        }, 1500);
    };
    if (lastXp.current !== null) run(lastXp.current);
    else
      AsyncStorage.getItem(SEEN_XP_KEY)
        .then((v) => run(v === null ? progress.xp : Number(v) || 0))
        .catch(() => run(progress.xp));
    return () => {
      alive = false;
      count.removeListener(id);
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.xp, active]);

  // Balken von der aktuellen zur nächsten Stufe (im Kopf und in der schmalen Leiste)
  const levelBar = (
    <View style={styles.levelBar}>
      {/* hinten: das neue Stück leuchtet hell; vorne: der alte Stand in Orange */}
      <Animated.View
        style={[styles.levelGlow, { opacity: glow, width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
      />
      <View style={[styles.progFill, styles.levelBase, { width: `${Math.round(base * 100)}%` }]} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
      >
        <View style={[styles.hx, { paddingTop: insets.top + 34 }]} onLayout={(e) => setHeadH(e.nativeEvent.layout.height)}>
          <HeaderBackground />
          <Text style={styles.h2}>{t('ch.title')}</Text>
          {/* Stufe und XP direkt im Kopf (wie im Profil), mit schmalem hellem Balken */}
          <View style={styles.levelHead}>
            <Pressable onPress={onOpenProfile} accessibilityRole="button" accessibilityLabel={t('a11y.profile')} hitSlop={8}>
              <Avatar id={avatar || null} name={name} size={50} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.levelName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                {name}
              </Text>
              <Text style={styles.levelSmall}>
                {t('ch.level', { n: shownLevel })} ·{' '}
                <Text style={{ color: colors.white }}>{t(`level.${shownLevel - 1}` as 'level.0')}</Text>
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.levelXp}>{shownXp} XP</Text>
              {/* kurz eingeblendet: so viele XP sind dazugekommen */}
              <Animated.Text style={[styles.levelGain, { opacity: gainFade }]}>+{gain} XP</Animated.Text>
            </View>
          </View>
          {/* Balken von der aktuellen zur nächsten Stufe */}
          <View style={styles.levelRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{shownLevel}</Text>
            </View>
            {levelBar}
            {levelAt(shownXp).nextLevelXp || shownLevel < progress.level ? (
              <View style={[styles.levelBadge, styles.levelBadgeNext]}>
                <Text style={[styles.levelBadgeText, { color: colors.white }]}>{shownLevel + 1}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.levelSub}>
            {progress.nextLevelXp
              ? t('ch.toNextShort', { n: progress.nextLevelXp - progress.xp })
              : t('ch.max', { xp: progress.xp })}
          </Text>
        </View>

        {/* Aufgaben: orange Marke = Belohnung, grüner Rahmen = geschafft */}
        <View style={[styles.card, { backgroundColor: p.card, borderColor: goal.done ? DONE : p.line }, goal.done && styles.doneCard]}>
          <View style={styles.misHead}>
            <Text style={[styles.small, { color: p.mute, flex: 1 }]}>
              {t('goal.title')} · {seasonLeft === 1 ? t('week.leftOne') : t('week.left', { n: seasonLeft })}
            </Text>
            <XpPill text={`+${XP.season} XP`} done={goal.done} />
          </View>
          {/* kurzer Satz, daneben die drei Gruppen als kleine Kreise */}
          <View style={styles.goalRow}>
            <Text style={[styles.misText, { color: p.ink, flex: 1, fontSize: 16 }]}>{t('goal.short')}</Text>
            {[0, 1, 2].map((i) => {
              const g = GROUPS.find((x) => x.id === goal.groups[i]);
              return (
                <View key={i} style={styles.goalSlot}>
                  <View
                    style={[styles.goalDot, g ? { backgroundColor: '#123826', borderColor: DONE, borderStyle: 'solid' } : { borderColor: p.line }]}
                  >
                    {g && <GroupIcon id={g.id} size={17} color={colors.accentLight} />}
                  </View>
                  <Text style={[styles.goalLabel, { color: g ? p.ink : p.mute }]} numberOfLines={1}>
                    {g ? t(`g.${g.id}`) : t('ch.open')}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Wochen-Aufgabe: jede Woche eine neue */}
        <View style={[styles.card, { backgroundColor: p.card, borderColor: week.done ? DONE : p.line }, week.done && styles.doneCard]}>
          <View style={styles.misHead}>
            <Text style={[styles.small, { color: p.mute, flex: 1 }]}>
              {t('week.title')} · {week.daysLeft === 1 ? t('week.leftOne') : t('week.left', { n: week.daysLeft })}
            </Text>
            <XpPill text={`+${XP.week} XP`} done={week.done} />
          </View>
          {/* Aufgabe mit passendem Symbol (wie beim Saison-Ziel) */}
          <View style={styles.weekRow}>
            <TaskIcon task={week.task} done={week.done} />
            <Text style={[styles.misText, { color: p.ink, flex: 1, fontSize: 16 }]}>{t(`week.${week.task}` as 'week.bird')}</Text>
          </View>
        </View>

        {/* Rangliste mit Freunden */}
        <Leaderboard
          stats={{ name, xp: progress.xp, level: progress.level, species, avatar }}
          invite={invite}
          onInviteDone={onInviteDone}
          onRank={onRank}
          onFriends={onFriends}
          p={p}
        />

        {/* Anzeigen-Platz zwischen Rangliste und Quiz */}
        <AdSlot p={p} placement='challenges' />

        {/* Frage des Forschers: drei am Tag; die heutigen bleiben sichtbar */}
        <View style={styles.blk}>
          <View style={styles.quizHead}>
            <Explorer size={44} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.h3, { color: p.ink }]}>{t('ch.quiz')}</Text>
              <Text style={[styles.small, { color: p.mute }]}>
                {quizDone
                  ? t(allDone ? 'ch.quizAll' : 'ch.quizTomorrow')
                  : today.length
                    ? t('ch.quizProgress', { n: today.length, max: QUESTIONS_PER_DAY })
                    : t('ch.quizSub', { n: QUESTIONS_PER_DAY })}
              </Text>
            </View>
            {/* wie bei den Zielen: orange = noch zu holen, grün = verdient */}
            <XpPill text={`+${quizDone ? todayXp : QUESTIONS_PER_DAY * XP.quiz} XP`} done={quizDone} />
          </View>
          {cur !== null &&
            (() => {
              const q = questionAt(cur, lang);
              const given = quiz[`q${cur}`];
              const answered = given !== undefined;
              return (
                <>
                  <Text style={[styles.question, { color: p.ink }]}>{q.q}</Text>
                  {/* Antworten in einer Reihe (bei langen Antworten umgebrochen) */}
                  <View style={styles.answers}>
                    {q.answers.map((a, i) => {
                      const isRight = i === q.right;
                      const mine = i === given;
                      const look = !answered
                        ? { borderColor: p.line }
                        : isRight
                          ? { backgroundColor: p.button, borderColor: p.button }
                          : mine
                            ? { borderColor: colors.coral }
                            : { borderColor: p.line, opacity: 0.5 };
                      const textColor = answered && isRight ? colors.white : p.ink;
                      return (
                        <Pressable
                          key={a}
                          disabled={answered}
                          onPress={() => onAnswer(cur, i)}
                          style={[styles.answer, look]}
                          accessibilityRole="button"
                        >
                          <Text style={[styles.letterText, { color: textColor }]}>{String.fromCharCode(65 + i)}</Text>
                          <Text style={[styles.answerText, { color: textColor }]}>
                            {a}
                            {answered && isRight ? ' ✓' : answered && mine ? ' ✗' : ''}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {answered && (
                    <Text style={[styles.sub, { color: p.mute, marginTop: 6 }]}>
                      {given === q.right ? q.explain : t('ch.wrong', { a: q.answers[q.right] })}
                    </Text>
                  )}
                </>
              );
            })()}
          {/* Blättern: zurück zu früheren Fragen von heute, weiter zur nächsten */}
          <View style={styles.quizNav}>
            {pos > 0 ? (
              <Pressable onPress={() => setPos(pos - 1)} hitSlop={8} accessibilityRole="button">
                <Text style={[styles.next, { color: p.moss }]}>‹ {t('ch.prevQuestion')}</Text>
              </Pressable>
            ) : (
              <View />
            )}
            {pos < items.length - 1 ? (
              <Pressable onPress={() => setPos(pos + 1)} hitSlop={8} accessibilityRole="button">
                <Text style={[styles.next, { color: p.moss }]}>{t('ch.nextQuestion')} ›</Text>
              </Pressable>
            ) : cur !== null && quiz[`q${cur}`] !== undefined && canAsk(quiz) && !allDone ? (
              <Pressable
                onPress={() => {
                  setShown(nextQuestion(quiz));
                  setPos(items.length); // zur neuen Frage
                }}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text style={[styles.next, { color: p.moss }]}>{t('ch.nextQuestion')} ›</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* Abzeichen */}
        <View
          style={[styles.card, { backgroundColor: p.card, borderColor: p.line, marginTop: 26 }]}
          onLayout={(e) => (badgesY.current = e.nativeEvent.layout.y)}
        >
          <View style={styles.bh}>
            <Text style={[styles.h3, { color: p.ink, flex: 1 }]}>{t('ch.badges')}</Text>
            {freshBadges.length > 0 && (
              <View style={styles.newPill}>
                <Text style={styles.newPillText}>{t('ch.newBadges', { n: freshBadges.length })}</Text>
              </View>
            )}
            <Text style={[styles.small, { color: p.mute, marginLeft: 8 }]}>
              {progress.badges.filter((b) => b.earned).length} / {progress.badges.length}
            </Text>
          </View>
          <Text style={[styles.sub, { color: p.mute }]}>{t('ch.badgesHint')}</Text>
          <View style={styles.badges}>
            {badgeList.map((b) => (
              <BadgeView
                key={b.id}
                badge={b}
                p={p}
                selected={avatar === b.id}
                fresh={freshBadges.includes(b.id)}
                onPress={() => {
                  if (freshBadges.includes(b.id)) onSeeBadges?.([b.id]);
                  Alert.alert(badgeName(b), b.earned ? `✓ ${badgeHint(b)}` : t('ch.notYet', { hint: badgeHint(b) }));
                }}
              />
            ))}
          </View>
        </View>

        <Text style={[styles.note, { color: p.mute }]}>
          {t('ch.note', { find: XP.find, fresh: XP.newSpecies })}
        </Text>
      </ScrollView>
      {/* Schmale Leiste: erscheint, sobald der große Kopf weggescrollt ist, und bleibt oben stehen */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.slim,
          {
            paddingTop: insets.top + 8,
            opacity: scrollY.interpolate({ inputRange: [headH - 70, headH - 30], outputRange: [0, 1], extrapolate: 'clamp' }),
            transform: [{ translateY: scrollY.interpolate({ inputRange: [headH - 70, headH - 30], outputRange: [-16, 0], extrapolate: 'clamp' }) }],
          },
        ]}
      >
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>{shownLevel}</Text>
        </View>
        {levelBar}
        <Text style={styles.slimXp}>{shownXp} XP</Text>
      </Animated.View>
    </View>
  );
}

// Symbol je Wochen-Aufgabe: gleicher dunkler Kreis und gleiche Strich-Symbole wie beim Saison-Ziel
function TaskIcon({ task, done }: { task: WeekTask; done: boolean }) {
  const color = colors.accentLight;
  const st = { fill: 'none', stroke: color, strokeWidth: 1.4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
  const group = GROUPS.find((g) => g.id === task);
  return (
    <View style={[styles.goalDot, { backgroundColor: '#123826', borderStyle: 'solid', borderColor: done ? DONE : '#123826' }]}>
      {group ? (
        <GroupIcon id={group.id} size={18} color={color} />
      ) : (
        <Svg width={18} height={18} viewBox="0 0 24 24">
          <G {...st}>
            {task === 'species3' && (
              <>
                <Circle cx={10.5} cy={10.5} r={6} />
                <Path d="M15 15l5 5" />
              </>
            )}
            {task === 'days2' && (
              <>
                <Path d="M4 6.5h16v13H4z" />
                <Path d="M4 10.5h16M8.5 4v4M15.5 4v4" />
              </>
            )}
            {task === 'morning' && (
              <>
                <Path d="M7 17a5 5 0 0 1 10 0" />
                <Path d="M3 17h18M12 6v3M5.5 10.5l2 2M18.5 10.5l-2 2" />
              </>
            )}
            {task === 'evening' && <Path d="M19 14.5A7.5 7.5 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5z" />}
          </G>
        </Svg>
      )}
    </View>
  );
}

// Zuletzt gesehener XP-Stand (für die Balken-Animation)
const SEEN_XP_KEY = 'findimal-seen-xp';

// Grün für "geschafft" (Rahmen und Marke)
const DONE = '#6FBF8A';

function XpPill({ text, done }: { text: string; done: boolean }) {
  return (
    <View style={[styles.xp, done && { backgroundColor: DONE }]}>
      <Text style={styles.xpText}>{done ? `✓ ${text}` : text}</Text>
    </View>
  );
}

function BadgeView({
  badge,
  p,
  selected,
  fresh,
  onPress,
}: {
  badge: Badge;
  p: Palette;
  selected: boolean;
  fresh: boolean;
  onPress: () => void;
}) {
  const { t } = useI18n();
  // neues Abzeichen: pulsiert sanft, bis man es angesehen hat
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!fresh) return pulse.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fresh, pulse]);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.badge}>
      <Animated.View
        style={[
          styles.medalWrap,
          (selected || fresh) && { borderColor: colors.accent },
          { transform: [{ scale: pulse }] },
        ]}
      >
        <Medal id={badge.id} size={64} earned={badge.earned} />
        {fresh && (
          <View style={styles.newTag}>
            <Text style={styles.newTagText}>{t('ch.new')}</Text>
          </View>
        )}
      </Animated.View>
      <Text style={[styles.badgeName, { color: badge.earned ? p.ink : p.mute }]}>{t(`badge.${badge.id}`)}</Text>
      {selected && <Text style={[styles.badgeSel, { color: colors.accent }]}>{t('ch.profilePic')}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hx: {
    paddingHorizontal: spacing.gutter,
    paddingBottom: 24,
    borderBottomLeftRadius: spacing.radiusHero,
    borderBottomRightRadius: spacing.radiusHero,
    overflow: 'hidden',
  },
  h2: { fontFamily: fonts.serifBold, fontSize: 28, color: colors.white, marginBottom: 16 },
  slim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.gutter,
    paddingBottom: 12,
    backgroundColor: '#17462F',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  slimXp: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.accentLight },
  levelHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  levelBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeNext: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)' },
  levelBadgeText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.ink },
  levelUser: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.white, marginBottom: 2 },
  levelSmall: { fontFamily: fonts.sansBold, fontSize: 13.5, color: colors.accentLight, marginTop: 2 },
  levelName: { fontFamily: fonts.serifBold, fontSize: 20, color: colors.white },
  levelXp: { fontFamily: fonts.serifBold, fontSize: 19, color: colors.accentLight },
  levelGain: { position: 'absolute', top: 24, right: 0, fontFamily: fonts.sansBold, fontSize: 12.5, color: '#9FE0B4' },
  levelGlow: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 6, backgroundColor: '#FFD97A' },
  levelBase: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  levelBar: { flex: 1, height: 8, borderRadius: 6, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.15)' },
  levelSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.white, opacity: 0.8, marginTop: 6 },
  doneCard: { borderWidth: 2 },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  goalSlot: { width: 56, alignItems: 'center', gap: 3 },
  goalLabel: { fontFamily: fonts.sans, fontSize: 10.5 },
  goalDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mi: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#123826',
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: { fontFamily: fonts.sans, fontSize: 12 },
  misHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  next: { fontFamily: fonts.sansBold, fontSize: 14 },
  misText: { fontFamily: fonts.serifBold, fontSize: 17, lineHeight: 20 },
  xp: { backgroundColor: colors.accent, borderRadius: 99, paddingVertical: 4, paddingHorizontal: 9 },
  xpText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.ink },
  card: {
    marginTop: 12,
    marginHorizontal: spacing.gutter,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  h3: { fontFamily: fonts.serifBold, fontSize: 19 },
  prog: { height: 8, borderRadius: 9, marginTop: 10, marginBottom: 4, overflow: 'hidden' },
  progFill: { height: '100%', backgroundColor: colors.accent },
  sub: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  blk: { marginTop: 26, marginHorizontal: spacing.gutter },
  bh: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  trail: { marginTop: 12, paddingLeft: 4 },
  st: { flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 8 },
  stLine: { position: 'absolute', left: 13, top: 38, bottom: -10, borderLeftWidth: 2, borderStyle: 'dashed' },
  stDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
  stName: { fontFamily: fonts.sansBold, fontSize: 16 },
  quizHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quizNav: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  letterText: { fontFamily: fonts.sansBold, fontSize: 12, opacity: 0.6 },
  question: { fontFamily: fonts.serifBold, fontSize: 16, lineHeight: 20, marginTop: 10 },
  answers: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  answer: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 11 },
  answerText: { fontFamily: fonts.sansBold, fontSize: 14 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, rowGap: 16 },
  badge: { width: '33.3%', alignItems: 'center' },
  medalWrap: {
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: 'transparent',
    padding: 3,
    marginBottom: 4,
  },
  badgeName: { fontFamily: fonts.sansBold, fontSize: 12.5, textAlign: 'center' },
  newTag: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newTagText: { fontFamily: fonts.sansBold, fontSize: 10, color: colors.white, letterSpacing: 0.5 },
  newPill: { backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  newPillText: { fontFamily: fonts.sansBold, fontSize: 11.5, color: colors.white },
  badgeSel: { fontFamily: fonts.sansBold, fontSize: 11, marginTop: 1 },
  note: { marginTop: 14, marginHorizontal: spacing.gutter, fontFamily: fonts.sans, fontSize: 12 },
});
