import { Find, speciesKey } from './finds';
import { GroupId, groupOf } from './groups';
import { seasonId } from './season';

// Alles rund um Erfahrungspunkte (XP), Stufen, Saison-Ziel und Abzeichen.
// Wird immer frisch aus den Funden (und Quiz-Antworten) berechnet, damit nichts
// durcheinandergeraten kann.

export const XP = {
  find: 10, // jeder Fund
  newSpecies: 20, // zusätzlich für eine neue Art
  season: 100, // Saison-Ziel geschafft
  quiz: 10, // Quizfrage richtig beantwortet
};

// XP ab der jeweiligen Stufe (Namen: Texte 'level.0' bis 'level.6')
const LEVELS = [0, 100, 200, 400, 700, 1100, 1600];

// ---------- Datum-Helfer (lokale Zeit) ----------

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------- Saison-Ziel ----------

// Jahreszeit eines Datums, z. B. "autumn-2026" (Januar/Februar gehören zum Winter des Vorjahres)
export function seasonKey(d: Date): string {
  const y = d.getMonth() <= 1 ? d.getFullYear() - 1 : d.getFullYear();
  return `${seasonId(d)}-${y}`;
}

// ---------- Abzeichen ----------

export type BadgeId =
  | 'first'
  | 'insects5'
  | 'night'
  | 'birds5'
  | 'species10'
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
  season: { groups: GroupId[]; done: boolean }; // Saison-Ziel: Tiere aus 3 Gruppen in dieser Jahreszeit
  badges: Badge[];
};

export function computeProgress(finds: Find[], quizCorrect: number, now = new Date()): Progress {
  // Jeder Fund und jede neue Art gibt XP
  const seen = new Set<string>();
  let xp = quizCorrect * XP.quiz;
  for (const f of finds) {
    xp += XP.find;
    const k = speciesKey(f.animal);
    if (!seen.has(k)) {
      seen.add(k);
      xp += XP.newSpecies;
    }
  }

  // Saison-Ziel: Tiere aus 3 verschiedenen Gruppen in einer Jahreszeit
  const seasons = new Map<string, Set<GroupId>>();
  for (const f of finds) {
    const g = groupOf(f.animal.gruppe);
    if (!g) continue;
    const k = seasonKey(new Date(f.date));
    const set = seasons.get(k) ?? new Set<GroupId>();
    set.add(g.id);
    seasons.set(k, set);
  }
  for (const set of seasons.values()) if (set.size >= 3) xp += XP.season;

  // Stufe
  let level = 0;
  while (level + 1 < LEVELS.length && xp >= LEVELS[level + 1]) level++;

  const thisSeason = [...(seasons.get(seasonKey(now)) ?? [])];

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
    season: { groups: thisSeason, done: thisSeason.length >= 3 },
    badges: [
      { id: 'first', earned: finds.length >= 1 },
      { id: 'insects5', earned: countGroup('ins') >= 5 },
      { id: 'night', earned: nightFind },
      { id: 'birds5', earned: countGroup('bird') >= 5 },
      { id: 'species10', earned: seen.size >= 10 },
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

export type RewardItem = 'find' | 'newSpecies' | 'season';

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
  if (after.season.done && !before.season.done) items.push({ id: 'season', xp: XP.season });
  return { total: after.xp - before.xp, items, levelUp: after.level > before.level, after, before };
}
