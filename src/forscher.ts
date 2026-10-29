import AsyncStorage from '@react-native-async-storage/async-storage';

import { BANK, BankQuestion } from './quizBank';

// Forscher-Quiz: eine Tagesrunde mit 10 schweren Fragen, Zeit pro Frage, XP für richtige und schnelle Antworten.
// Jede Antwort wird sofort gespeichert – so kann man eine Frage nicht durch Schließen der App „neu würfeln“.

export const ROUND_SIZE = 10;
export const TIME_TEXT = 15; // Sekunden für Text- und Wahr/Falsch-Fragen
export const TIME_IMAGE = 12; // Sekunden für Bildfragen
const XP_RIGHT = 4; // richtige Antwort
const XP_FAST = 2; // Bonus: in den ersten 5 Sekunden
const XP_QUICK = 1; // Bonus: in den ersten 10 Sekunden
export const XP_MAX = ROUND_SIZE * (XP_RIGHT + XP_FAST); // 60

// a: Antwort je Frage (-1 = Zeit abgelaufen), ms: benötigte Zeit, done: Runde abgeschlossen
export type Round = { q: string[]; a: number[]; ms: number[]; done?: boolean };
export type ForscherLog = { rounds: Record<string, Round>; seen: Record<string, number> };

const KEY = 'findimal-forscher';
const EMPTY: ForscherLog = { rounds: {}, seen: {} };

export const dayNo = (d = new Date()) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);

export async function loadForscher(): Promise<ForscherLog> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const log = raw ? (JSON.parse(raw) as ForscherLog) : EMPTY;
    return { rounds: log.rounds ?? {}, seen: log.seen ?? {} };
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
export const timeFor = (q: BankQuestion) => (q.type === 'image' ? TIME_IMAGE : TIME_TEXT);

// XP für eine Antwort
export function answerXp(q: BankQuestion, answer: number, ms: number): number {
  if (answer !== q.right) return 0;
  return XP_RIGHT + (ms <= 5000 ? XP_FAST : ms <= 10000 ? XP_QUICK : 0);
}

export function roundXp(r: Round): number {
  return r.q.reduce((sum, id, i) => {
    const q = byId.get(id);
    return q && i < r.a.length ? sum + answerXp(q, r.a[i], r.ms[i]) : sum;
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

export const todayRound = (log: ForscherLog, day = dayNo()): Round | undefined => log.rounds[String(day)];
export const doneToday = (log: ForscherLog, day = dayNo()) => !!todayRound(log, day)?.done;

// Tage in Folge mit geschaffter Runde (zählt bis gestern weiter, solange heute noch offen ist)
export function streak(log: ForscherLog, day = dayNo()): number {
  let d = log.rounds[String(day)]?.done ? day : day - 1;
  let n = 0;
  while (log.rounds[String(d)]?.done) {
    n++;
    d--;
  }
  return n;
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
// Mindestens 2 Bildfragen, damit es abwechslungsreich bleibt.
function pickRound(log: ForscherLog, day: number): string[] {
  const rand = rng(day * 2654435761);
  // Nie gesehene Fragen zuerst. Sind alle durch: erst die, die man falsch hatte (zum Lernen), dann die ältesten.
  const wrong = new Set<string>();
  for (const r of Object.values(log.rounds)) r.q.forEach((id, i) => i < r.a.length && byId.get(id)?.right !== r.a[i] && wrong.add(id));
  const age = (q: BankQuestion) => (q.id in log.seen ? day - log.seen[q.id] + (wrong.has(q.id) ? 1000 : 0) : 100000);
  const pool = BANK.map((q) => ({ q, score: age(q) + rand() * 3 })).sort((a, b) => b.score - a.score);
  const want: Record<number, number> = { 1: 3, 2: 4, 3: 3 };
  const picked: BankQuestion[] = [];
  const take = (ok: (q: BankQuestion) => boolean, max = 1) => {
    for (const { q } of pool) {
      if (max <= 0) break;
      if (picked.includes(q) || !ok(q) || want[q.lvl] <= 0) continue;
      picked.push(q);
      want[q.lvl]--;
      max--;
    }
  };
  take((q) => q.type === 'image', 2);
  for (const lvl of [1, 2, 3]) take((q) => q.lvl === lvl, want[lvl]);
  // zu wenige einer Stufe: mit beliebigen auffüllen
  for (const { q } of pool) {
    if (picked.length >= ROUND_SIZE) break;
    if (!picked.includes(q)) picked.push(q);
  }
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
  const next: ForscherLog = { rounds: { ...log.rounds, [String(day)]: round }, seen: { ...log.seen, [id]: day } };
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
  const next: ForscherLog = { rounds: { ...log.rounds, [String(day)]: round }, seen };
  await save(next);
  return next;
}
