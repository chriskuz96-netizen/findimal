import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Explorer } from '../components/Explorer';
import { HeaderBackground } from '../components/HeaderBackground';
import { GroupIcon, GROUPS } from '../groups';
import { Badge, Progress, XP } from '../progress';
import { Question } from '../quiz';
import { colors, darkPalette, fonts, lightPalette, Palette, spacing } from '../theme';

type Props = {
  progress: Progress;
  question: Question;
  answer: number | undefined; // heute gewählte Antwort
  onAnswer: (i: number) => void;
};

export function ChallengesScreen({ progress, question, answer, onAnswer }: Props) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { daily, weekly } = progress;
  const span = (progress.nextLevelXp ?? progress.xp) - progress.levelStart;
  const share = progress.nextLevelXp ? (progress.xp - progress.levelStart) / span : 1;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: p.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={[styles.hx, { paddingTop: insets.top + 34 }]}>
        <HeaderBackground />
        <Text style={styles.h2}>Challenges</Text>
        <View style={styles.stats}>
          <Stat value={String(progress.streak)} label={progress.streak === 1 ? 'Tag Serie' : 'Tage Serie'} />
          <Stat value={progress.xp.toLocaleString('de-DE')} label="XP" />
          <Stat value={String(progress.level)} label="Stufe" />
        </View>
      </View>

      {/* Tageschallenge */}
      <View style={[styles.mis, { backgroundColor: p.card }]}>
        <View style={styles.mi}>
          <GroupIcon id={daily.icon} size={30} color={colors.accentLight} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.small, { color: p.mute }]}>Tageschallenge</Text>
          <Text style={[styles.misText, { color: p.ink }]}>{daily.text}</Text>
        </View>
        <XpPill text={daily.done ? 'Geschafft' : `+${XP.daily} XP`} done={daily.done} />
      </View>

      {/* Stufe */}
      <View style={[styles.card, { backgroundColor: p.card, borderColor: p.line }]}>
        <Text style={[styles.h3, { color: p.ink }]}>
          Stufe {progress.level}: {progress.levelName}
        </Text>
        <View style={[styles.prog, { backgroundColor: p.line }]}>
          <View style={[styles.progFill, { width: `${Math.min(100, Math.round(share * 100))}%` }]} />
        </View>
        <Text style={[styles.sub, { color: p.mute }]}>
          {progress.nextLevelXp
            ? `${progress.xp} / ${progress.nextLevelXp} XP bis zur nächsten Stufe`
            : `${progress.xp} XP – höchste Stufe erreicht!`}
        </Text>
      </View>

      {/* Wochenchallenge */}
      <View style={styles.blk}>
        <View style={styles.bh}>
          <Text style={[styles.h3, { color: p.ink }]}>Wochenchallenge</Text>
          <XpPill text={weekly.done ? 'Geschafft' : `+${XP.weekly} XP`} done={weekly.done} />
        </View>
        <Text style={[styles.sub, { color: p.mute }]}>Finde diese Woche Tiere aus drei verschiedenen Gruppen.</Text>
        <View style={styles.trail}>
          {[0, 1, 2].map((i) => {
            const g = GROUPS.find((x) => x.id === weekly.groups[i]);
            return (
              <View key={i} style={styles.st}>
                {i < 2 && <View style={[styles.stLine, { borderColor: p.line }]} />}
                <View
                  style={[
                    styles.stDot,
                    { borderColor: colors.accent, backgroundColor: g ? colors.accent : p.bg },
                  ]}
                />
                <View>
                  <Text style={[styles.stName, { color: g ? p.ink : p.mute }]}>{g ? g.name : 'Noch offen'}</Text>
                  <Text style={[styles.small, { color: p.mute }]}>{g ? 'Gefunden' : `Gruppe ${i + 1} von 3`}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Frage des Forschers */}
      <View style={styles.blk}>
        <View style={styles.bh}>
          <Text style={[styles.h3, { color: p.ink }]}>Frage des Forschers</Text>
          <XpPill text={`+${XP.quiz} XP`} done={answer === question.right} />
        </View>
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
                ? { backgroundColor: p.moss, borderColor: p.moss }
                : { borderColor: p.line, opacity: i === answer ? 1 : 0.5 };
            return (
              <Pressable
                key={a}
                disabled={answered}
                onPress={() => onAnswer(i)}
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
          <Text style={[styles.sub, { color: p.mute, marginTop: 8 }]}>
            {answer === question.right
              ? question.explain
              : `Leider falsch. Richtig ist: ${question.answers[question.right]}. Morgen gibt es eine neue Frage!`}
          </Text>
        )}
      </View>

      {/* Abzeichen */}
      <View style={[styles.card, { backgroundColor: p.card, borderColor: p.line, marginTop: 26 }]}>
        <Text style={[styles.h3, { color: p.ink }]}>Abzeichen</Text>
        <View style={styles.badges}>
          {progress.badges.map((b) => (
            <BadgeView key={b.id} badge={b} p={p} />
          ))}
        </View>
      </View>

      <Text style={[styles.note, { color: p.mute }]}>
        Punkte gibt es für jeden Fund (+{XP.find}), neue Arten (+{XP.newSpecies}) und geschaffte Challenges.
        Ranglisten mit Freunden kommen später.
      </Text>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function XpPill({ text, done }: { text: string; done: boolean }) {
  return (
    <View style={[styles.xp, done && { backgroundColor: '#6FBF8A' }]}>
      <Text style={styles.xpText}>{done ? `✓ ${text}` : text}</Text>
    </View>
  );
}

function BadgeView({ badge, p }: { badge: Badge; p: Palette }) {
  const color = badge.earned ? colors.accentLight : p.mute;
  return (
    <View style={styles.badge}>
      <View
        style={[
          styles.badgeCircle,
          badge.earned
            ? { backgroundColor: '#123826', borderColor: colors.accent }
            : { backgroundColor: p.line, borderColor: p.line },
        ]}
      >
        {badge.id.startsWith('streak') ? (
          // Flamme für Serien
          <Svg width={30} height={30} viewBox="0 0 24 24">
            <Path
              d="M12 21c-3.9 0-6.5-2.6-6.5-6.1 0-3.3 2.4-5.4 3.6-8.4.4 1.9 1.4 3.2 2.6 3.9.2-2.6 1.5-5 3.6-7.4.3 3.1 3.2 5.6 3.2 10.1 0 4.5-2.6 7.9-6.5 7.9z"
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          </Svg>
        ) : badge.id === 'first' ? (
          // Stern für den ersten Fund
          <Svg width={30} height={30} viewBox="0 0 24 24">
            <Path
              d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          </Svg>
        ) : (
          <GroupIcon id={badge.icon} size={30} color={color} />
        )}
      </View>
      <Text style={[styles.badgeName, { color: badge.earned ? p.ink : p.mute }]}>{badge.name}</Text>
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
  h2: { fontFamily: fonts.serifBold, fontSize: 28, color: colors.white, marginBottom: 14 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,210,168,0.25)',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  statValue: { fontFamily: fonts.serifBold, fontSize: 26, color: colors.accentLight },
  statLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.white, opacity: 0.8 },
  mis: {
    marginTop: -24,
    marginHorizontal: spacing.gutter,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
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
  badges: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, rowGap: 14 },
  badge: { width: '33.3%', alignItems: 'center' },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  badgeName: { fontFamily: fonts.sans, fontSize: 12, textAlign: 'center' },
  note: { marginTop: 14, marginHorizontal: spacing.gutter, fontFamily: fonts.sans, fontSize: 12 },
});
