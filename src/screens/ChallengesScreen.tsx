import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdSlot } from '../components/AdSlot';
import { Explorer } from '../components/Explorer';
import { HeaderBackground } from '../components/HeaderBackground';
import { Leaderboard } from '../components/Leaderboard';
import { Medal } from '../components/Medal';
import { GroupIcon, GROUPS } from '../groups';
import { useI18n } from '../i18n';
import { Badge, Progress, XP } from '../progress';
import { answeredToday, nextQuestion, question as questionAt, QUESTIONS_PER_DAY, QuizLog } from '../quiz';
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
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t, lang } = useI18n();
  const goal = progress.season;
  const week = progress.week;
  // Quiz: die gerade gezeigte Frage bleibt nach dem Antworten stehen, bis man "Nächste Frage" tippt
  // höchstens 3 Fragen pro Tag
  const canAsk = (log: QuizLog) => answeredToday(log) < QUESTIONS_PER_DAY;
  const [shown, setShown] = useState<number | null>(() => (canAsk(quiz) ? nextQuestion(quiz) : null));
  const allDone = nextQuestion(quiz) === null;
  const question = shown === null ? null : questionAt(shown, lang);
  const answer = shown === null ? undefined : quiz[`q${shown}`];
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

      {/* Saison-Ziel: Tiere aus 3 Gruppen in dieser Jahreszeit */}
      <View style={[styles.mis, { backgroundColor: p.card }]}>
        <View style={styles.misHead}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.small, { color: p.mute }]}>{t('goal.title')}</Text>
            <Text style={[styles.misText, { color: p.ink }]}>{t('goal.text')}</Text>
          </View>
          <XpPill text={goal.done ? t('ch.done') : `+${XP.season} XP`} done={goal.done} />
        </View>
        <View style={styles.slots}>
          {[0, 1, 2].map((i) => {
            const g = GROUPS.find((x) => x.id === goal.groups[i]);
            return (
              <View key={i} style={styles.slot}>
                <View style={[styles.slotDot, g ? { backgroundColor: '#123826', borderColor: colors.accent, borderStyle: 'solid' } : { borderColor: p.line }]}>
                  {g && <GroupIcon id={g.id} size={20} color={colors.accentLight} />}
                </View>
                <Text style={[styles.small, { color: g ? p.ink : p.mute }]} numberOfLines={1}>
                  {g ? t(`g.${g.id}`) : t('ch.open')}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Wochen-Aufgabe: jede Woche eine neue */}
      <View style={[styles.card, { backgroundColor: p.card, borderColor: p.line }]}>
        <View style={styles.misHead}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.small, { color: p.mute }]}>
              {t('week.title')} ·{' '}
              {week.daysLeft === 1 ? t('week.leftOne') : t('week.left', { n: week.daysLeft })}
            </Text>
            <Text style={[styles.misText, { color: p.ink }]}>{t(`week.${week.task}` as 'week.bird')}</Text>
          </View>
          <XpPill text={week.done ? t('ch.done') : `+${XP.week} XP`} done={week.done} />
        </View>
        {week.done && <Text style={[styles.sub, { color: p.mute, marginTop: 6 }]}>{t('week.done')}</Text>}
      </View>

      {/* Stufe */}
      <View style={[styles.card, { backgroundColor: p.card, borderColor: p.line }]}>
        <Text style={[styles.h3, { color: p.ink }]}>
          {t('ch.levelLine', { n: progress.level, name: t(`level.${progress.level - 1}` as 'level.0') })}
        </Text>
        <View style={[styles.prog, { backgroundColor: p.line }]}>
          <View style={[styles.progFill, { width: `${Math.min(100, Math.round(share * 100))}%` }]} />
        </View>
        <Text style={[styles.sub, { color: p.mute }]}>
          {progress.nextLevelXp
            ? t('ch.toNext', { xp: progress.xp, next: progress.nextLevelXp })
            : t('ch.max', { xp: progress.xp })}
        </Text>
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

      {/* Frage des Forschers: eine nach der anderen */}
      <View style={styles.blk}>
        <View style={styles.bh}>
          <Text style={[styles.h3, { color: p.ink }]}>{t('ch.quiz')}</Text>
          {question && <XpPill text={`+${XP.quiz} XP`} done={answer === question.right} />}
        </View>
        {!question ? (
          <Text style={[styles.sub, { color: p.mute }]}>{t(allDone ? 'ch.quizAll' : 'ch.quizTomorrow')}</Text>
        ) : (
          <>
            <View style={styles.qrow}>
              <Explorer size={46} />
              <Text style={[styles.question, { color: p.ink }]}>{question.q}</Text>
            </View>
            <View style={styles.answers}>
              {question.answers.map((a, i) => {
                const answered = answer !== undefined;
                const isRight = i === question.right;
                const style = !answered
                  ? { borderColor: p.line }
                  : isRight
                    ? { backgroundColor: p.button, borderColor: p.button }
                    : { borderColor: p.line, opacity: i === answer ? 1 : 0.5 };
                return (
                  <Pressable
                    key={a}
                    disabled={answered}
                    onPress={() => onAnswer(shown!, i)}
                    style={[styles.answer, style]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.answerText, { color: answered && isRight ? colors.white : p.ink }]}>
                      {answered && i === answer && !isRight ? `✗ ${a}` : a}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {answer !== undefined && (
              <>
                <Text style={[styles.sub, { color: p.mute, marginTop: 8 }]}>
                  {answer === question.right ? question.explain : t('ch.wrong', { a: question.answers[question.right] })}
                </Text>
                {canAsk(quiz) && !allDone ? (
                  <Pressable onPress={() => setShown(nextQuestion(quiz))} hitSlop={8} style={{ marginTop: 10, alignSelf: 'flex-start' }}>
                    <Text style={[styles.next, { color: p.moss }]}>{t('ch.nextQuestion')} ›</Text>
                  </Pressable>
                ) : (
                  <Text style={[styles.small, { color: p.mute, marginTop: 10 }]}>
                    {t(allDone ? 'ch.quizAll' : 'ch.quizTomorrow')}
                  </Text>
                )}
              </>
            )}
          </>
        )}
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

function XpPill({ text, done }: { text: string; done: boolean }) {
  return (
    <View style={[styles.xp, done && { backgroundColor: '#6FBF8A' }]}>
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
  mis: {
    marginTop: -24,
    marginHorizontal: spacing.gutter,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 20,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
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
  slots: { flexDirection: 'row', gap: 8, marginTop: 12 },
  slot: { flex: 1, alignItems: 'center', gap: 4 },
  slotDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  qrow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 10 },
  question: { flex: 1, fontFamily: fonts.serifBold, fontSize: 17 },
  answers: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  answer: { borderWidth: 1.5, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 14 },
  answerText: { fontFamily: fonts.sansBold, fontSize: 15 },
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
