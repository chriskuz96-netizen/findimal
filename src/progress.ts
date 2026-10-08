import { Find, speciesKey } from './finds';
import { GroupId, groupOf } from './groups';
import { breedGuessed } from './names';
import { matchesAnimal, seasonAnimals, seasonId, SeasonId } from './season';
import { thisWeek, WeekTask, weeksDone } from './weekly';

// Alles rund um Erfahrungspunkte (XP), Stufen, Saison-Ziel und Abzeichen.
// Wird immer frisch aus den Funden (und Quiz-Antworten) berechnet, damit nichts
// durcheinandergeraten kann.

export const XP = {
  find: 10, // jeder Fund
  newSpecies: 20, // zusätzlich für eine neue Art
  season: 100, // Saison-Ziel geschafft
  quiz: 10, // Quizfrage richtig beantwortet
  week: 30, // Wochen-Aufgabe geschafft
};

// XP ab der jeweiligen Stufe (Namen: Texte 'level.0' bis 'level.11')
const LEVELS = [0, 100, 200, 400, 700, 1100, 1600, 2200, 3000, 4000, 5200, 6600];

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
  | 'species50'
  | 'streak7'
  | 'mam5'
  | 'amp5'
  | 'mol5'
  | 'ara5'
  | 'top100'
  | 'top50'
  | 'top10'
  | 'top1'
  | 'seasons4'
  | 'seasonAll'
  | 'rare'
  | 'quiz25'
  | 'team3'
  | 'streak30'
  | 'breeds5'
  | 'cats5'
  | 'dogs5'
  | 'farm3'
  | 'big3'
  | 'venom'
  | 'butterfly3'
  | 'spiders5'
  | 'birds10'
  | 'insects10'
  | 'water5'
  | 'pets3'
  | 'tiny';

// Medaillen-Stufe je Abzeichen. Jedes verdiente Abzeichen gibt XP: Bronze 25, Silber 50, Gold 100.
export const BADGE_TIER: Record<BadgeId, 'bronze' | 'silver' | 'gold'> = {
  first: 'bronze',
  insects5: 'bronze',
  night: 'silver',
  birds5: 'silver',
  species10: 'silver',
  species25: 'gold',
  allgroups: 'gold',
  fish: 'bronze',
  reptile: 'bronze',
  early: 'silver',
  species50: 'gold',
  streak7: 'silver',
  mam5: 'bronze',
  amp5: 'silver',
  mol5: 'bronze',
  ara5: 'bronze',
  top100: 'gold',
  top50: 'gold',
  top10: 'gold',
  top1: 'gold',
  seasons4: 'silver',
  seasonAll: 'gold',
  rare: 'silver',
  quiz25: 'bronze',
  team3: 'bronze',
  streak30: 'gold',
  breeds5: 'bronze',
  cats5: 'bronze',
  dogs5: 'bronze',
  farm3: 'silver',
  big3: 'silver',
  venom: 'silver',
  butterfly3: 'silver',
  spiders5: 'silver',
  birds10: 'gold',
  insects10: 'gold',
  water5: 'silver',
  pets3: 'bronze',
  tiny: 'silver',
};
export const BADGE_XP = { bronze: 25, silver: 50, gold: 100 };

// Name und Hinweis: Texte 'badge.<id>' und 'badge.<id>.hint'
export type Badge = { id: BadgeId; earned: boolean };

// ---------- Gesamtstand ----------

export type Progress = {
  xp: number;
  level: number; // 1 = erste Stufe
  levelStart: number;
  nextLevelXp: number | null;
  season: { groups: GroupId[]; done: boolean }; // Saison-Ziel: Tiere aus 3 Gruppen in dieser Jahreszeit
  week: { task: WeekTask; done: boolean; daysLeft: number }; // Wochen-Aufgabe
  badges: Badge[];
};

const rankAtMost = (rank: number | null | undefined, max: number) => !!rank && rank <= max;

// An wie vielen Tagen hintereinander (höchstens) wurde etwas gefunden?
function longestStreak(finds: Find[]): number {
  const days = [...new Set(finds.map((f) => dayKey(new Date(f.date))))].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of days) {
    const cur = new Date(`${d}T12:00:00`);
    run = prev && Math.round((cur.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return best;
}

// Alle vier Saison-Tiere einer Jahreszeit gefunden (passende Gattung reicht, wie auf der Saison-Seite)?
function seasonComplete(finds: Find[]): boolean {
  const ids: SeasonId[] = ['spring', 'summer', 'autumn', 'winter'];
  return ids.some((id) => {
    const inSeason = finds.filter((f) => seasonId(new Date(f.date)) === id);
    return seasonAnimals(id).every((match) => inSeason.some((f) => matchesAnimal(f.animal.wissenschaftlicher_name, match)));
  });
}

// Verschiedene Rassen (Haus- und Nutztiere), ohne geschätzte und ohne reine "Mischling"
function breedCount(finds: Find[]): number {
  const names = finds
    .filter((f) => !breedGuessed(f.animal))
    .map((f) => (f.animal.rasse || '').trim().toLowerCase())
    .filter((r) => r && r !== 'mischling');
  return new Set(names).size;
}

// Wissenschaftlicher Name klein geschrieben (z. B. "felis catus")
const sci = (f: Find) => (f.animal.wissenschaftlicher_name || '').trim().toLowerCase();
const isCat = (f: Find) => /^felis (silvestris )?catus|^felis domesticus/.test(sci(f));
const isDog = (f: Find) => /^canis (lupus )?familiaris/.test(sci(f));

// Nutztiere (Gattung + Art), für "Bauernhof-Held"
const FARM = [
  'gallus gallus', 'bos taurus', 'bos primigenius', 'sus domesticus', 'sus scrofa domesticus', 'equus caballus',
  'equus ferus', 'equus asinus', 'equus africanus', 'ovis aries', 'capra hircus', 'anser anser', 'anas platyrhynchos domesticus',
  'meleagris gallopavo', 'lama glama', 'vicugna pacos', 'numida meleagris', 'cairina moschata',
];
function farmKinds(finds: Find[]): number {
  const kinds = new Set<string>();
  for (const f of finds) {
    const k = FARM.find((x) => sci(f).startsWith(x));
    if (k) kinds.add(k.split(' ').slice(0, 2).join(' '));
  }
  return kinds.size;
}

// Haustiere (Gattung + Art), für "Haustier-Zoo"
const PETS = [
  'canis lupus familiaris', 'canis familiaris', 'felis catus', 'felis silvestris catus', 'oryctolagus cuniculus',
  'cavia porcellus', 'mesocricetus auratus', 'phodopus', 'meriones unguiculatus', 'rattus norvegicus domestica',
  'mus musculus domesticus', 'melopsittacus undulatus', 'nymphicus hollandicus', 'serinus canaria', 'carassius auratus',
  'testudo', 'chinchilla', 'mustela furo', 'pogona vitticeps', 'poecilia reticulata',
];
function petKinds(finds: Find[]): number {
  const kinds = new Set<string>();
  for (const f of finds) {
    const k = PETS.find((x) => sci(f).startsWith(x));
    if (k) kinds.add(k.startsWith('canis') ? 'hund' : k.startsWith('felis') ? 'katze' : k);
  }
  return kinds.size;
}

// Verschiedene Arten, auf die eine Bedingung zutrifft
const kinds = (finds: Find[], ok: (f: Find) => boolean) => new Set(finds.filter(ok).map((f) => speciesKey(f.animal))).size;

// extra.bestRank: bester Platz, den man in der weltweiten Rangliste je hatte (null = nie dabei)
// extra.maxFriends: höchste Zahl an Freunden in der Rangliste
export function computeProgress(
  finds: Find[],
  quizCorrect: number,
  now = new Date(),
  extra: { bestRank?: number | null; maxFriends?: number } = {},
): Progress {
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

  // Wochen-Aufgaben
  xp += weeksDone(finds) * XP.week;

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

  const badges: Badge[] = [
    { id: 'first', earned: finds.length >= 1 },
    { id: 'insects5', earned: countGroup('ins') >= 5 },
    { id: 'night', earned: nightFind },
    { id: 'birds5', earned: countGroup('bird') >= 5 },
    { id: 'mam5', earned: countGroup('mam') >= 5 },
    { id: 'amp5', earned: countGroup('amp') >= 5 },
    { id: 'mol5', earned: countGroup('mol') >= 5 },
    { id: 'ara5', earned: countGroup('ara') >= 5 },
    { id: 'species10', earned: seen.size >= 10 },
    { id: 'species25', earned: seen.size >= 25 },
    { id: 'allgroups', earned: groupsEver.size >= 6 },
    { id: 'fish', earned: countGroup('fish') >= 1 },
    { id: 'reptile', earned: countGroup('rep') >= 1 },
    { id: 'early', earned: earlyFind },
    { id: 'streak7', earned: longestStreak(finds) >= 7 },
    { id: 'species50', earned: seen.size >= 50 },
    { id: 'top100', earned: rankAtMost(extra.bestRank, 100) },
    { id: 'top50', earned: rankAtMost(extra.bestRank, 50) },
    { id: 'top10', earned: rankAtMost(extra.bestRank, 10) },
    { id: 'top1', earned: rankAtMost(extra.bestRank, 1) },
    { id: 'seasons4', earned: new Set(finds.map((f) => seasonId(new Date(f.date)))).size >= 4 },
    { id: 'seasonAll', earned: seasonComplete(finds) },
    { id: 'rare', earned: finds.some((f) => f.animal.gefaehrdet) },
    { id: 'quiz25', earned: quizCorrect >= 25 },
    { id: 'team3', earned: (extra.maxFriends ?? 0) >= 3 },
    { id: 'streak30', earned: longestStreak(finds) >= 30 },
    { id: 'breeds5', earned: breedCount(finds) >= 5 },
    { id: 'cats5', earned: finds.filter(isCat).length >= 5 },
    { id: 'dogs5', earned: finds.filter(isDog).length >= 5 },
    { id: 'farm3', earned: farmKinds(finds) >= 3 },
    { id: 'big3', earned: kinds(finds, (f) => !!f.animal.gross) >= 3 },
    { id: 'venom', earned: finds.some((f) => f.animal.giftig) },
    { id: 'butterfly3', earned: kinds(finds, (f) => !!f.animal.schmetterling) >= 3 },
    { id: 'spiders5', earned: kinds(finds, (f) => groupOf(f.animal.gruppe)?.id === 'ara') >= 5 },
    { id: 'birds10', earned: kinds(finds, (f) => groupOf(f.animal.gruppe)?.id === 'bird') >= 10 },
    { id: 'insects10', earned: kinds(finds, (f) => groupOf(f.animal.gruppe)?.id === 'ins') >= 10 },
    { id: 'water5', earned: kinds(finds, (f) => !!f.animal.wasser || groupOf(f.animal.gruppe)?.id === 'fish') >= 5 },
    { id: 'pets3', earned: petKinds(finds) >= 3 },
    { id: 'tiny', earned: finds.some((f) => f.animal.winzig) },
  ];
  // XP für verdiente Abzeichen
  for (const b of badges) if (b.earned) xp += BADGE_XP[BADGE_TIER[b.id]];

  // Stufe
  let level = 0;
  while (level + 1 < LEVELS.length && xp >= LEVELS[level + 1]) level++;

  return {
    xp,
    level: level + 1,
    levelStart: LEVELS[level],
    nextLevelXp: LEVELS[level + 1] ?? null,
    season: { groups: thisSeason, done: thisSeason.length >= 3 },
    week: thisWeek(finds, now),
    badges,
  };
}

// ---------- Belohnung für einen Fund (für die Ergebnisseite) ----------

export type RewardItem = 'find' | 'newSpecies' | 'season' | 'week' | 'badge';

export type Reward = {
  total: number;
  items: { id: RewardItem; xp: number; badge?: BadgeId }[];
  levelUp: boolean;
  after: Progress; // Stand nach dem Fund
  before: Progress; // Stand vorher (für den Balken)
};

export function computeReward(before: Progress, after: Progress, isNew: boolean): Reward {
  const items: Reward['items'] = [{ id: 'find', xp: XP.find }];
  if (isNew) items.push({ id: 'newSpecies', xp: XP.newSpecies });
  if (after.season.done && !before.season.done) items.push({ id: 'season', xp: XP.season });
  if (after.week.done && !before.week.done) items.push({ id: 'week', xp: XP.week });
  // Neue Abzeichen durch diesen Fund
  for (const b of after.badges) {
    if (b.earned && !before.badges.find((x) => x.id === b.id)?.earned) {
      items.push({ id: 'badge', xp: BADGE_XP[BADGE_TIER[b.id]], badge: b.id });
    }
  }
  return { total: after.xp - before.xp, items, levelUp: after.level > before.level, after, before };
}
