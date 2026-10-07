import { Find, speciesKey } from './finds';
import { GroupId, groupOf } from './groups';

// Alles rund um Erfahrungspunkte (XP), Stufen, Serie, Challenges und Abzeichen.
// Wird immer frisch aus den Funden (und Quiz-Antworten) berechnet, damit nichts
// durcheinandergeraten kann.

export const XP = {
  find: 10, // jeder Fund
  newSpecies: 20, // zusätzlich für eine neue Art
  daily: 20, // Tageschallenge geschafft
  weekly: 100, // Wochenchallenge geschafft
  quiz: 10, // Quizfrage richtig beantwortet
};

// XP ab der jeweiligen Stufe (Namen: Texte 'level.0' bis 'level.6')
const LEVELS = [0, 100, 200, 400, 700, 1100, 1600];

// ---------- Datum-Helfer (lokale Zeit) ----------

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayNumber(d: Date): number {
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
}

// Montag der Woche als Schlüssel
function weekKey(d: Date): string {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return dayKey(monday);
}

// ---------- Tageschallenges ----------

type DayFinds = { finds: Find[]; newSpecies: number };

export type DailyId =
  | 'ins'
  | 'bird'
  | 'ara'
  | 'new'
  | 'mam'
  | 'three'
  | 'mol'
  | 'two'
  | 'water'
  | 'note'
  | 'morning';
type Daily = { id: DailyId; icon: GroupId | null; check: (day: DayFinds) => boolean };

const hasGroup = (id: GroupId) => (day: DayFinds) =>
  day.finds.some((f) => groupOf(f.animal.gruppe)?.id === id);

// Bis 7.10.2026 galt diese Reihenfolge – bleibt für alte Tage gleich, damit sich keine XP nachträglich ändern
const DAILIES_OLD: Daily[] = [
  { id: 'ins', icon: 'ins', check: hasGroup('ins') },
  { id: 'bird', icon: 'bird', check: hasGroup('bird') },
  { id: 'ara', icon: 'ara', check: hasGroup('ara') },
  { id: 'new', icon: null, check: (d) => d.newSpecies > 0 },
  { id: 'mam', icon: 'mam', check: hasGroup('mam') },
  { id: 'three', icon: null, check: (d) => d.finds.length >= 3 },
  { id: 'mol', icon: 'mol', check: hasGroup('mol') },
];

const groupsOfDay = (d: DayFinds) => new Set(d.finds.map((f) => groupOf(f.animal.gruppe)?.id).filter(Boolean)).size;

// Ab 8.10.2026: mehr Abwechslung
const DAILIES: Daily[] = [
  { id: 'bird', icon: 'bird', check: hasGroup('bird') },
  { id: 'two', icon: null, check: (d) => groupsOfDay(d) >= 2 },
  { id: 'ins', icon: 'ins', check: hasGroup('ins') },
  { id: 'note', icon: null, check: (d) => d.finds.some((f) => !!f.note) },
  { id: 'water', icon: 'fish', check: (d) => hasGroup('fish')(d) || hasGroup('amp')(d) },
  { id: 'new', icon: null, check: (d) => d.newSpecies > 0 },
  { id: 'mam', icon: 'mam', check: hasGroup('mam') },
  { id: 'morning', icon: null, check: (d) => d.finds.some((f) => new Date(f.date).getHours() < 10) },
  { id: 'ara', icon: 'ara', check: hasGroup('ara') },
  { id: 'three', icon: null, check: (d) => d.finds.length >= 3 },
  { id: 'mol', icon: 'mol', check: hasGroup('mol') },
];
const NEW_DAILIES_FROM = dayNumber(new Date(2026, 9, 8));

export function dailyFor(date: Date): Daily {
  const n = dayNumber(date);
  return n < NEW_DAILIES_FROM ? DAILIES_OLD[n % DAILIES_OLD.length] : DAILIES[n % DAILIES.length];
}

// ---------- Abzeichen ----------

export type BadgeId =
  | 'first'
  | 'streak3'
  | 'insects5'
  | 'night'
  | 'birds5'
  | 'species10'
  | 'streak7'
  | 'species25'
  | 'allgroups'
  | 'fish'
  | 'reptile'
  | 'early'
  | 'notes5'
  | 'species50';

// Name und Hinweis: Texte 'badge.<id>' und 'badge.<id>.hint'
export type Badge = { id: BadgeId; earned: boolean };

// ---------- Gesamtstand ----------

export type Progress = {
  xp: number;
  level: number; // 1 = erste Stufe
  levelStart: number;
  nextLevelXp: number | null;
  streak: number;
  daily: { id: DailyId; icon: GroupId | null; done: boolean };
  weekly: { groups: GroupId[]; done: boolean };
  badges: Badge[];
};

export function computeProgress(finds: Find[], quizCorrect: number, now = new Date()): Progress {
  // Funde nach Tag gruppieren und neue Arten zählen
  const days = new Map<string, DayFinds & { date: Date }>();
  const seen = new Set<string>();
  let xp = quizCorrect * XP.quiz;
  for (const f of finds) {
    const date = new Date(f.date);
    const key = dayKey(date);
    const day = days.get(key) ?? { finds: [], newSpecies: 0, date };
    day.finds.push(f);
    xp += XP.find;
    const k = speciesKey(f.animal);
    if (!seen.has(k)) {
      seen.add(k);
      day.newSpecies++;
      xp += XP.newSpecies;
    }
    days.set(key, day);
  }

  // Tageschallenges, die an ihrem Tag geschafft wurden
  for (const day of days.values()) {
    if (dailyFor(day.date).check(day)) xp += XP.daily;
  }

  // Wochenchallenge: Tiere aus 3 verschiedenen Gruppen in einer Woche
  const weeks = new Map<string, Set<GroupId>>();
  for (const f of finds) {
    const g = groupOf(f.animal.gruppe);
    if (!g) continue;
    const k = weekKey(new Date(f.date));
    const set = weeks.get(k) ?? new Set<GroupId>();
    set.add(g.id);
    weeks.set(k, set);
  }
  for (const set of weeks.values()) if (set.size >= 3) xp += XP.weekly;

  // Serie: Tage am Stück mit mindestens einem Fund (heute oder bis gestern)
  let streak = 0;
  const today = dayNumber(now);
  const dayNums = new Set([...days.values()].map((d) => dayNumber(d.date)));
  let cursor = dayNums.has(today) ? today : today - 1;
  while (dayNums.has(cursor)) {
    streak++;
    cursor--;
  }
  // längste Serie für Abzeichen
  let best = 0;
  for (const n of dayNums) {
    if (dayNums.has(n - 1)) continue;
    let len = 0;
    while (dayNums.has(n + len)) len++;
    best = Math.max(best, len);
  }

  // Stufe
  let level = 0;
  while (level + 1 < LEVELS.length && xp >= LEVELS[level + 1]) level++;

  const todayFinds = days.get(dayKey(now)) ?? { finds: [], newSpecies: 0 };
  const daily = dailyFor(now);
  const thisWeek = [...(weeks.get(weekKey(now)) ?? [])];

  const countGroup = (id: GroupId) => finds.filter((f) => groupOf(f.animal.gruppe)?.id === id).length;
  const nightFind = finds.some((f) => {
    const h = new Date(f.date).getHours();
    return h >= 20 || h < 5;
  });
  const groupsEver = new Set(finds.map((f) => groupOf(f.animal.gruppe)?.id).filter(Boolean));
  const earlyFind = finds.some((f) => {
    const h = new Date(f.date).getHours();
    return h >= 5 && h < 7;
  });

  return {
    xp,
    level: level + 1,
    levelStart: LEVELS[level],
    nextLevelXp: LEVELS[level + 1] ?? null,
    streak,
    daily: { id: daily.id, icon: daily.icon, done: daily.check(todayFinds) },
    weekly: { groups: thisWeek, done: thisWeek.length >= 3 },
    badges: [
      { id: 'first', earned: finds.length >= 1 },
      { id: 'streak3', earned: best >= 3 },
      { id: 'insects5', earned: countGroup('ins') >= 5 },
      { id: 'night', earned: nightFind },
      { id: 'birds5', earned: countGroup('bird') >= 5 },
      { id: 'species10', earned: seen.size >= 10 },
      { id: 'streak7', earned: best >= 7 },
      { id: 'species25', earned: seen.size >= 25 },
      { id: 'allgroups', earned: groupsEver.size >= 6 },
      { id: 'fish', earned: countGroup('fish') >= 1 },
      { id: 'reptile', earned: countGroup('rep') >= 1 },
      { id: 'early', earned: earlyFind },
      { id: 'notes5', earned: finds.filter((f) => !!f.note).length >= 5 },
      { id: 'species50', earned: seen.size >= 50 },
    ],
  };
}

// ---------- Belohnung für einen Fund (für die Ergebnisseite) ----------

export type RewardItem = 'find' | 'newSpecies' | 'daily' | 'weekly';

export type Reward = {
  total: number;
  items: { id: RewardItem; xp: number }[];
  levelUp: boolean;
  after: Progress; // Stand nach dem Fund
  before: Progress; // Stand vorher (für den Balken)
};

export function computeReward(before: Progress, after: Progress, isNew: boolean): Reward {
  const items: Reward['items'] = [{ id: 'find', xp: XP.find }];
  if (isNew) items.push({ id: 'newSpecies', xp: XP.newSpecies });
  if (after.daily.done && !before.daily.done) items.push({ id: 'daily', xp: XP.daily });
  if (after.weekly.done && !before.weekly.done) items.push({ id: 'weekly', xp: XP.weekly });
  return { total: after.xp - before.xp, items, levelUp: after.level > before.level, after, before };
}
