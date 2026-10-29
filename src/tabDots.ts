import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { doneToday, ForscherLog } from './forscher';
import { seasonId, seasonRange } from './season';
import { Tab } from './components/TabBar';

// Kleine Punkte an der Menüleiste für wirklich Neues:
// - Challenges: neues Abzeichen, oder das Forscher-Quiz ist heute noch offen
// - Saison: eine neue Jahreszeit hat begonnen und man hat sie noch nicht angeschaut
// - Sammlung: ein neuer Fund ist dazugekommen, seit man zuletzt in der Sammlung war
// Sobald man den Bereich öffnet, verschwindet der Punkt.

type Seen = { challenges?: string; season?: string; collection?: string };
const KEY = 'findimal-tab-seen';

const today = (d = new Date()) => d.toDateString();
const seasonKey = (d = new Date()) => `${seasonId(d)}-${seasonRange(d).start.getFullYear()}`;

// newestFind: Datum (ISO) des neuesten Fundes
export function useTabDots(tab: Tab, forscher: ForscherLog, freshBadges: number, newestFind?: string): Tab[] {
  const [seen, setSeen] = useState<Seen | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setSeen(v ? (JSON.parse(v) as Seen) : {}))
      .catch(() => setSeen({}));
  }, []);

  // geöffneter Bereich gilt als gesehen (die Sammlung auch, wenn dort ein Fund dazukommt)
  useEffect(() => {
    if (!seen || tab === 'start') return;
    const value = tab === 'challenges' ? today() : tab === 'season' ? seasonKey() : newestFind ?? '';
    if (seen[tab] === value) return;
    const next = { ...seen, [tab]: value };
    setSeen(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, [tab, seen, newestFind]);

  if (!seen) return [];
  const dots: Tab[] = [];
  const newQuiz = !doneToday(forscher);
  if (tab !== 'challenges' && (freshBadges > 0 || newQuiz)) dots.push('challenges');
  if (tab !== 'season' && seen.season !== seasonKey()) dots.push('season');
  if (tab !== 'collection' && newestFind && newestFind !== seen.collection) dots.push('collection');
  return dots;
}
