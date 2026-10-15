import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { answeredToday, nextQuestion, QUESTIONS_PER_DAY, QuizLog } from './quiz';
import { seasonId, seasonRange } from './season';
import { Tab } from './components/TabBar';

// Kleine Punkte an der Menüleiste für wirklich Neues:
// - Challenges: neues Abzeichen, oder heute gibt es neue Quizfragen und man war heute noch nicht dort
// - Saison: eine neue Jahreszeit hat begonnen und man hat sie noch nicht angeschaut
// Sobald man den Bereich öffnet, verschwindet der Punkt.

type Seen = { challenges?: string; season?: string };
const KEY = 'findimal-tab-seen';

const today = (d = new Date()) => d.toDateString();
const seasonKey = (d = new Date()) => `${seasonId(d)}-${seasonRange(d).start.getFullYear()}`;

export function useTabDots(tab: Tab, quiz: QuizLog, freshBadges: number): Tab[] {
  const [seen, setSeen] = useState<Seen | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setSeen(v ? (JSON.parse(v) as Seen) : {}))
      .catch(() => setSeen({}));
  }, []);

  // geöffneter Bereich gilt als gesehen
  useEffect(() => {
    if (!seen || (tab !== 'challenges' && tab !== 'season')) return;
    const value = tab === 'challenges' ? today() : seasonKey();
    if (seen[tab] === value) return;
    const next = { ...seen, [tab]: value };
    setSeen(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, [tab, seen]);

  if (!seen) return [];
  const dots: Tab[] = [];
  const newQuiz = nextQuestion(quiz) !== null && answeredToday(quiz) < QUESTIONS_PER_DAY && seen.challenges !== today();
  if (tab !== 'challenges' && (freshBadges > 0 || newQuiz)) dots.push('challenges');
  if (tab !== 'season' && seen.season !== seasonKey()) dots.push('season');
  return dots;
}
