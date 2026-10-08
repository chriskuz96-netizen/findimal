import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path } from 'react-native-svg';

import { AdSlot } from '../components/AdSlot';
import { Explorer } from '../components/Explorer';
import { HeaderBackground } from '../components/HeaderBackground';
import { Leaderboard } from '../components/Leaderboard';
import { Medal } from '../components/Medal';
import { GroupIcon, GROUPS } from '../groups';
import { useI18n } from '../i18n';
import { Badge, Progress, XP } from '../progress';
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
};

export function ChallengesScreen({ progress, quiz, onAnswer, avatar, name, species, invite, onInviteDone, onRank, onFriends }: Props) {
  const dark = useColorScheme() === 'dark';
  const p = dark ? darkPalette : lightPalette;
  // Stufen-Karte in warmem Sandton (hebt sich vom grünen Kopf und den weißen Karten ab)
  const sand = dark ? { bg: '#3A2B1C', ink: '#F6E7D4', mute: '#D9B996' } : { bg: '#FFF1DE', ink: colors.ink, mute: colors.accentDark };
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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: p.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={[styles.hx, { paddingTop: insets.top + 34 }]}>
        <HeaderBackground />
        <Text style={styles.h2}>{t('ch.title')}</Text>
      </View>

      {/* Stufe und XP ganz oben – Sandton mit orangem Rand, hebt sich von den Aufgaben ab */}
      <View style={[styles.levelCard, { backgroundColor: sand.bg }]}>
        <View style={styles.levelHead}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{progress.level}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.levelSmall, { color: sand.mute }]}>{t('ch.level', { n: progress.level })}</Text>
            <Text style={[styles.levelName, { color: sand.ink }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {t(`level.${progress.level - 1}` as 'level.0')}
            </Text>
          </View>
          <Text style={styles.levelXp}>{progress.xp} XP</Text>
        </View>
        <View style={styles.levelBar}>
          <View style={[styles.progFill, { width: `${Math.min(100, Math.round(share * 100))}%` }]} />
        </View>
        <Text style={[styles.levelSub, { color: sand.mute }]}>
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
      <View style={[styles.card, { backgroundColor: p.card, borderColor: p.line, marginTop: 26 }]}>
        <View style={styles.bh}>
          <Text style={[styles.h3, { color: p.ink }]}>{t('ch.badges')}</Text>
          <Text style={[styles.small, { color: p.mute }]}>
            {progress.badges.filter((b) => b.earned).length} / {progress.badges.length}
          </Text>
        </View>
        <Text style={[styles.sub, { color: p.mute }]}>{t('ch.badgesHint')}</Text>
        <View style={styles.badges}>
          {progress.badges.map((b) => (
            <BadgeView
              key={b.id}
              badge={b}
              p={p}
              selected={avatar === b.id}
              onPress={() =>
                Alert.alert(badgeName(b), b.earned ? `✓ ${badgeHint(b)}` : t('ch.notYet', { hint: badgeHint(b) }))
              }
            />
          ))}
        </View>
      </View>

      <Text style={[styles.note, { color: p.mute }]}>
        {t('ch.note', { find: XP.find, fresh: XP.newSpecies })}
      </Text>
    </ScrollView>
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
  onPress,
}: {
  badge: Badge;
  p: Palette;
  selected: boolean;
  onPress: () => void;
}) {
  const { t } = useI18n();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.badge}>
      <View style={[styles.medalWrap, selected && { borderColor: colors.accent }]}>
        <Medal id={badge.id} size={64} earned={badge.earned} />
      </View>
      <Text style={[styles.badgeName, { color: badge.earned ? p.ink : p.mute }]}>{t(`badge.${badge.id}`)}</Text>
      {selected && <Text style={[styles.badgeSel, { color: colors.accent }]}>{t('ch.profilePic')}</Text>}
    </Pressable>
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
  h2: { fontFamily: fonts.serifBold, fontSize: 28, color: colors.white, marginBottom: 14 },
  levelCard: {
    marginTop: -24,
    marginHorizontal: spacing.gutter,
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.accent,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
  },
  levelHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  levelBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#123826',
    borderWidth: 3,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeText: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.accentLight },
  levelSmall: { fontFamily: fonts.sansBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  levelName: { fontFamily: fonts.serifBold, fontSize: 21 },
  levelXp: { fontFamily: fonts.serifBold, fontSize: 20, color: colors.accent },
  levelBar: { height: 8, borderRadius: 9, marginTop: 14, marginBottom: 6, overflow: 'hidden', backgroundColor: 'rgba(232,131,58,0.2)' },
  levelSub: { fontFamily: fonts.sans, fontSize: 13 },
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
  badgeSel: { fontFamily: fonts.sansBold, fontSize: 11, marginTop: 1 },
  note: { marginTop: 14, marginHorizontal: spacing.gutter, fontFamily: fonts.sans, fontSize: 12 },
});
