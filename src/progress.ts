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

const LEVELS = [
  { xp: 0, name: 'Neuling' },
  { xp: 100, name: 'Entdecker' },
  { xp: 200, name: 'Spurenleser' },
  { xp: 400, name: 'Fährtenkenner' },
  { xp: 700, name: 'Naturforscher' },
  { xp: 1100, name: 'Wildnisprofi' },
  { xp: 1600, name: 'Meister der Wildnis' },
];

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

type Daily = { text: string; icon: GroupId | null; check: (day: DayFinds) => boolean };

const hasGroup = (id: GroupId) => (day: DayFinds) =>
  day.finds.some((f) => groupOf(f.animal.gruppe)?.id === id);

const DAILIES: Daily[] = [
  { text: 'Finde etwas mit sechs Beinen', icon: 'ins', check: hasGroup('ins') },
  { text: 'Entdecke einen Vogel', icon: 'bird', check: hasGroup('bird') },
  { text: 'Finde ein Tier mit acht Beinen', icon: 'ara', check: hasGroup('ara') },
  { text: 'Entdecke eine neue Art', icon: null, check: (d) => d.newSpecies > 0 },
  { text: 'Finde ein Säugetier', icon: 'mam', check: hasGroup('mam') },
  { text: 'Mach heute drei Funde', icon: null, check: (d) => d.finds.length >= 3 },
  { text: 'Finde eine Schnecke', icon: 'mol', check: hasGroup('mol') },
];

export function dailyFor(date: Date): Daily {
  return DAILIES[dayNumber(date) % DAILIES.length];
}

// ---------- Abzeichen ----------

export type Badge = { id: string; name: string; icon: GroupId | null; earned: boolean };

// ---------- Gesamtstand ----------

export type Progress = {
  xp: number;
  level: number;
  levelName: string;
  levelStart: number;
  nextLevelXp: number | null;
  streak: number;
  daily: { text: string; icon: GroupId | null; done: boolean };
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
  while (level + 1 < LEVELS.length && xp >= LEVELS[level + 1].xp) level++;

  const todayFinds = days.get(dayKey(now)) ?? { finds: [], newSpecies: 0 };
  const daily = dailyFor(now);
  const thisWeek = [...(weeks.get(weekKey(now)) ?? [])];

  const birds = finds.filter((f) => groupOf(f.animal.gruppe)?.id === 'bird').length;
  const groupsEver = new Set(finds.map((f) => groupOf(f.animal.gruppe)?.id).filter(Boolean));

  return {
    xp,
    level: level + 1,
    levelName: LEVELS[level].name,
    levelStart: LEVELS[level].xp,
    nextLevelXp: LEVELS[level + 1]?.xp ?? null,
    streak,
    daily: { text: daily.text, icon: daily.icon, done: daily.check(todayFinds) },
    weekly: { groups: thisWeek, done: thisWeek.length >= 3 },
    badges: [
      { id: 'first', name: 'Erster Fund', icon: null, earned: finds.length >= 1 },
      { id: 'streak3', name: '3-Tage-Serie', icon: null, earned: best >= 3 },
      { id: 'streak7', name: '7-Tage-Serie', icon: null, earned: best >= 7 },
      { id: 'species10', name: '10 Arten', icon: 'ins', earned: seen.size >= 10 },
      { id: 'birds5', name: '5 Vögel', icon: 'bird', earned: birds >= 5 },
      { id: 'allgroups', name: 'Alle Gruppen', icon: 'mam', earned: groupsEver.size >= 6 },
    ],
  };
}
