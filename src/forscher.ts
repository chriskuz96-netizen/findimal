import AsyncStorage from '@react-native-async-storage/async-storage';

import { BANK, BankQuestion } from './quizBank';

// Forscher-Quiz: eine Tagesrunde mit 10 schweren Fragen, Zeit pro Frage, XP für richtige und schnelle Antworten.
// Jede Antwort wird sofort gespeichert – so kann man eine Frage nicht durch Schließen der App „neu würfeln“.

export const ROUND_SIZE = 10;
export const TIME_TEXT = 15; // Sekunden für Text- und Wahr/Falsch-Fragen
export const TIME_DUEL = 10; // Sekunden für „Wer ist …?“ mit zwei Tieren
export const TIME_RANK = 20; // Sekunden für eine Rangliste mit 4 Einträgen
const XP_RIGHT = 4; // richtige Antwort
const XP_FAST = 2; // Bonus: in den ersten 5 Sekunden
const XP_QUICK = 1; // Bonus: in den ersten 10 Sekunden
export const XP_MAX = ROUND_SIZE * (XP_RIGHT + XP_FAST); // 60

// a: Antwort je Frage (-1 = Zeit abgelaufen), ms: benötigte Zeit, done: Runde abgeschlossen,
// j: Joker (-1 = noch frei, sonst die Frage, bei der er eingesetzt wurde; fehlt = kein Joker in dieser Runde)
export type Round = { q: string[]; a: number[]; ms: number[]; done?: boolean; j?: number };
// saved: verpasste Tage, an denen die Serie gerettet wurde (zählen für die Serie, bringen keine XP)
export type ForscherLog = { rounds: Record<string, Round>; seen: Record<string, number>; saved?: number[] };

const KEY = 'findimal-forscher';
const EMPTY: ForscherLog = { rounds: {}, seen: {} };

export const dayNo = (d = new Date()) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);

export async function loadForscher(): Promise<ForscherLog> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const log = raw ? (JSON.parse(raw) as ForscherLog) : EMPTY;
    return { rounds: log.rounds ?? {}, seen: log.seen ?? {}, saved: log.saved ?? [] };
  } catch {
    return EMPTY;
  }
}

async function save(log: ForscherLog): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(log)).catch(() => {});
}

export async function resetForscher(): Promise<void> {
  await AsyncStorage.removeItem(KEY).catch(() => {});
}

export const byId = new Map<string, BankQuestion>(BANK.map((q) => [q.id, q]));
export const timeFor = (q: BankQuestion) => (q.type === 'rank' ? TIME_RANK : q.type === 'duel' ? TIME_DUEL : TIME_TEXT);

// Joker (einmal pro Runde): bei 4 Antworten fallen zwei falsche weg, bei 2 Antworten gibt es 10 Sekunden mehr,
// beim Treppchen steht ein Platz schon richtig. Eine Antwort mit Joker bekommt keinen Schnelligkeitsbonus.
export const JOKER_EXTRA_MS = 10000;
export type JokerKind = 'half' | 'time' | 'place';
export const jokerKind = (q: BankQuestion): JokerKind => (q.type === 'rank' ? 'place' : q.t.de.a.length >= 4 ? 'half' : 'time');
// die zwei falschen Antworten, die beim 50:50 wegfallen (immer dieselben für eine Frage)
export function jokerHidden(q: BankQuestion): number[] {
  const rand = rng([...q.id].reduce((h, c) => h * 31 + c.charCodeAt(0), 11));
  return [0, 1, 2, 3]
    .filter((i) => i !== q.right)
    .map((i) => ({ i, k: rand() }))
    .sort((a, b) => a.k - b.k)
    .slice(0, 2)
    .map(({ i }) => i);
}

// Rangliste: die getippte Reihenfolge wird als eine Zahl gespeichert (10000 + Stellen), richtig ist immer 10123.
// In der Fragenbank stehen die Einträge schon richtig sortiert; angezeigt werden sie gemischt.
export const encodeRank = (picked: number[]) => 10000 + picked.reduce((n, i) => n * 10 + i, 0);
export const decodeRank = (v: number): number[] | null => (v >= 10000 ? String(v - 10000).padStart(4, '0').split('').map(Number) : null);
export function rankOrder(q: BankQuestion): number[] {
  const rand = rng([...q.id].reduce((h, c) => h * 31 + c.charCodeAt(0), 7));
  let order = [0, 1, 2, 3];
  while (order.every((v, i) => v === i)) order = [0, 1, 2, 3].map((i) => ({ i, k: rand() })).sort((a, b) => a.k - b.k).map(({ i }) => i);
  return order;
}

// XP für eine Antwort
export function answerXp(q: BankQuestion, answer: number, ms: number, joker = false): number {
  if (answer !== q.right) return 0;
  if (joker) return XP_RIGHT;
  const [fast, quick] = q.type === 'rank' ? [8000, 14000] : [5000, 10000]; // Ranglisten brauchen länger
  return XP_RIGHT + (ms <= fast ? XP_FAST : ms <= quick ? XP_QUICK : 0);
}

export function roundXp(r: Round): number {
  return r.q.reduce((sum, id, i) => {
    const q = byId.get(id);
    return q && i < r.a.length ? sum + answerXp(q, r.a[i], r.ms[i], r.j === i) : sum;
  }, 0);
}

export function roundCorrect(r: Round): number {
  return r.q.filter((id, i) => i < r.a.length && byId.get(id)?.right === r.a[i]).length;
}

// Summe über alle Runden (für Stufe und Abzeichen)
export function forscherTotals(log: ForscherLog): { xp: number; correct: number } {
  let xp = 0;
  let correct = 0;
  for (const r of Object.values(log.rounds)) {
    xp += roundXp(r);
    correct += roundCorrect(r);
  }
  return { xp, correct };
}

// Kennzahlen für die Quiz-Abzeichen
export type ForscherStats = { rounds: number; perfect: boolean; bestStreak: number; rankRight: number; picRight: number; fastRight: number };
export function forscherStats(log: ForscherLog): ForscherStats {
  const st: ForscherStats = { rounds: 0, perfect: false, bestStreak: 0, rankRight: 0, picRight: 0, fastRight: 0 };
  const days = [...new Set([...Object.keys(log.rounds).filter((d) => log.rounds[d].done).map(Number), ...(log.saved ?? [])])].sort(
    (a, b) => a - b,
  );
  let run = 0;
  days.forEach((d, i) => {
    run = i > 0 && days[i - 1] === d - 1 ? run + 1 : 1;
    st.bestStreak = Math.max(st.bestStreak, run);
  });
  for (const r of Object.values(log.rounds)) {
    if (r.done) st.rounds++;
    if (r.done && roundCorrect(r) === r.q.length) st.perfect = true;
    r.q.forEach((id, i) => {
      const q = byId.get(id);
      if (!q || i >= r.a.length || r.a[i] !== q.right) return;
      if (q.type === 'rank') st.rankRight++;
      if (q.type === 'pic') st.picRight++;
      if (r.ms[i] <= 5000 && r.j !== i) st.fastRight++; // mit Joker zählt es nicht als schnell
    });
  }
  return st;
}

export const todayRound = (log: ForscherLog, day = dayNo()): Round | undefined => log.rounds[String(day)];
export const doneToday = (log: ForscherLog, day = dayNo()) => !!todayRound(log, day)?.done;

// Zählt ein Tag für die Serie? (Runde geschafft oder Serie gerettet)
const kept = (log: ForscherLog, d: number) => !!log.rounds[String(d)]?.done || !!log.saved?.includes(d);

// Tage in Folge mit geschaffter Runde (zählt bis gestern weiter, solange heute noch offen ist)
export function streak(log: ForscherLog, day = dayNo()): number {
  let d = kept(log, day) ? day : day - 1;
  let n = 0;
  while (kept(log, d)) {
    n++;
    d--;
  }
  return n;
}

// Serie retten: gestern verpasst, vorgestern noch in Serie – höchstens einmal pro Woche.
// Liefert die Länge der Serie, die man retten kann (0 = nichts zu retten).
export function rescuable(log: ForscherLog, day = dayNo()): number {
  if (kept(log, day - 1) || !kept(log, day - 2)) return 0;
  if ((log.saved ?? []).some((d) => d >= day - 7)) return 0;
  return streak(log, day - 1);
}

export async function rescueStreak(log: ForscherLog, day = dayNo()): Promise<ForscherLog> {
  if (!rescuable(log, day)) return log;
  const next: ForscherLog = { ...log, saved: [...(log.saved ?? []), day - 1] };
  await save(next);
  return next;
}

// Joker für die heutige Runde freischalten (Video angesehen oder Plus) und einsetzen
export async function grantJoker(log: ForscherLog, day: number): Promise<ForscherLog> {
  const r = log.rounds[String(day)];
  if (!r || r.done || r.j !== undefined) return log;
  const next: ForscherLog = { ...log, rounds: { ...log.rounds, [String(day)]: { ...r, j: -1 } } };
  await save(next);
  return next;
}

export async function spendJoker(log: ForscherLog, day: number): Promise<ForscherLog> {
  const r = log.rounds[String(day)];
  if (!r || r.done || r.j !== -1) return log;
  const next: ForscherLog = { ...log, rounds: { ...log.rounds, [String(day)]: { ...r, j: r.a.length } } };
  await save(next);
  return next;
}

// Zufall mit festem Startwert: dieselbe Runde, egal wie oft man die App öffnet
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

// 10 Fragen: am liebsten lange nicht (oder nie) gesehene; 3 mittel, 4 schwer, 3 sehr schwer, aufsteigend.
// Abwechslung: je eine Rangliste, eine Frage mit großem Bild (Spur, Umriss, Fundstück) und ein Duell.
// Solange es ungesehene Fragen gibt, kommt keine doppelt (die Mischung darf dafür abweichen).
function pickRound(log: ForscherLog, day: number): string[] {
  const rand = rng(day * 2654435761);
  // Nie gesehene Fragen zuerst. Sind alle durch: erst die, die man falsch hatte (zum Lernen), dann die ältesten.
  const wrong = new Set<string>();
  for (const r of Object.values(log.rounds)) r.q.forEach((id, i) => i < r.a.length && byId.get(id)?.right !== r.a[i] && wrong.add(id));
  const age = (q: BankQuestion) => (q.id in log.seen ? day - log.seen[q.id] + (wrong.has(q.id) ? 1000 : 0) : 100000);
  const pool = BANK.map((q) => ({ q, score: age(q) + rand() * 3 })).sort((a, b) => b.score - a.score);
  const want: Record<number, number> = { 1: 3, 2: 4, 3: 3 };
  const picked: BankQuestion[] = [];
  const fresh = (q: BankQuestion) => !(q.id in log.seen);
  // quota: Mischung der Stufen einhalten (fällt weg, sobald eine Stufe keine neuen Fragen mehr hat)
  const take = (ok: (q: BankQuestion) => boolean, max = 1, quota = true) => {
    for (const { q } of pool) {
      if (max <= 0 || picked.length >= ROUND_SIZE) break;
      if (picked.includes(q) || !ok(q) || (quota && want[q.lvl] <= 0)) continue;
      picked.push(q);
      want[q.lvl]--;
      max--;
    }
  };
  // 1. je eine Rangliste, ein Bild und ein Duell (nur neue – lieber keine als eine wiederholte)
  for (const type of ['rank', 'pic', 'duel']) take((q) => q.type === type && fresh(q));
  // 2. neue Fragen in der gewünschten Mischung, dann neue Fragen jeder Stufe:
  //    so wiederholt sich nichts, solange es noch ungesehene Fragen gibt
  // höchstens eine Rangliste pro Runde (die dauern am längsten)
  const oneRank = (q: BankQuestion) => q.type !== 'rank' || !picked.some((x) => x.type === 'rank');
  for (const lvl of [1, 2, 3]) take((q) => q.lvl === lvl && fresh(q) && oneRank(q), want[lvl]);
  take((q) => fresh(q) && oneRank(q), ROUND_SIZE, false);
  // 3. alle gesehen: zuerst die falsch beantworteten, dann die ältesten (Reihenfolge von pool)
  for (const lvl of [1, 2, 3]) take((q) => q.lvl === lvl && oneRank(q), want[lvl]);
  take(oneRank, ROUND_SIZE, false);
  take(() => true, ROUND_SIZE, false);
  // aufsteigend schwer; gleiche Stufe gemischt
  return picked
    .slice(0, ROUND_SIZE)
    .map((q) => ({ q, k: q.lvl + rand() * 0.5 }))
    .sort((a, b) => a.k - b.k)
    .map(({ q }) => q.id);
}

// Heutige Runde holen oder anlegen (die Fragen stehen ab dem Start fest)
export async function startRound(log: ForscherLog, day = dayNo()): Promise<ForscherLog> {
  if (log.rounds[String(day)]) return log;
  const next: ForscherLog = { ...log, rounds: { ...log.rounds, [String(day)]: { q: pickRound(log, day), a: [], ms: [] } } };
  await save(next);
  return next;
}

export async function answer(log: ForscherLog, day: number, value: number, ms: number): Promise<ForscherLog> {
  const r = log.rounds[String(day)];
  if (!r || r.done || r.a.length >= r.q.length) return log;
  const id = r.q[r.a.length];
  const round: Round = { ...r, a: [...r.a, value], ms: [...r.ms, Math.round(ms)] };
  const next: ForscherLog = { ...log, rounds: { ...log.rounds, [String(day)]: round }, seen: { ...log.seen, [id]: day } };
  await save(next);
  return next;
}

// Runde beenden (auch beim vorzeitigen Schließen: offene Fragen zählen als falsch)
export async function finishRound(log: ForscherLog, day: number): Promise<ForscherLog> {
  const r = log.rounds[String(day)];
  if (!r || r.done) return log;
  const missing = r.q.length - r.a.length;
  const round: Round = { ...r, a: [...r.a, ...Array(missing).fill(-1)], ms: [...r.ms, ...Array(missing).fill(0)], done: true };
  const seen = { ...log.seen };
  for (const id of r.q) seen[id] = day;
  const next: ForscherLog = { ...log, rounds: { ...log.rounds, [String(day)]: round }, seen };
  await save(next);
  return next;
}
