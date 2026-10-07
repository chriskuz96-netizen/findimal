import { Find, speciesKey } from './finds';
import { GroupId, groupOf } from './groups';
import { seasonId, SeasonId } from './season';

// Wochen-Aufgabe: jede Woche (Montag bis Sonntag) eine kleine Aufgabe, passend zur Jahreszeit.
// Geschafft ist sie, sobald die Funde dieser Woche sie erfüllen. Text: 'week.<id>'.

export type WeekTask = GroupId | 'species3' | 'days2' | 'morning' | 'evening';

const TASKS: Record<SeasonId, WeekTask[]> = {
  spring: ['bird', 'ins', 'amp', 'species3', 'morning', 'mol', 'days2', 'ara'],
  summer: ['ins', 'bird', 'evening', 'amp', 'species3', 'ara', 'days2', 'mol'],
  autumn: ['ara', 'bird', 'mam', 'species3', 'morning', 'mol', 'days2', 'ins'],
  winter: ['bird', 'mam', 'species3', 'days2', 'morning', 'evening'],
};

const DAY = 86400000;

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Montag der Woche (lokale Zeit, 0 Uhr)
export function weekStart(d: Date): Date {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

export function weekTask(d: Date): WeekTask {
  const start = weekStart(d);
  const list = TASKS[seasonId(start)];
  // fortlaufende Wochennummer (unabhängig von Sommer-/Winterzeit)
  const n = Math.floor((Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()) / DAY + 3) / 7);
  return list[n % list.length];
}

export function taskDone(task: WeekTask, finds: Find[]): boolean {
  switch (task) {
    case 'species3':
      return new Set(finds.map((f) => speciesKey(f.animal))).size >= 3;
    case 'days2':
      return new Set(finds.map((f) => dayKey(new Date(f.date)))).size >= 2;
    case 'morning':
      return finds.some((f) => new Date(f.date).getHours() < 9);
    case 'evening':
      return finds.some((f) => new Date(f.date).getHours() >= 18);
    default:
      return finds.some((f) => groupOf(f.animal.gruppe)?.id === task);
  }
}

// Alle Wochen mit Funden: wie viele Wochen-Aufgaben wurden geschafft?
export function weeksDone(finds: Find[]): number {
  const byWeek = new Map<string, Find[]>();
  for (const f of finds) {
    const k = dayKey(weekStart(new Date(f.date)));
    byWeek.set(k, [...(byWeek.get(k) ?? []), f]);
  }
  let n = 0;
  for (const [k, list] of byWeek) if (taskDone(weekTask(new Date(`${k}T12:00:00`)), list)) n++;
  return n;
}

// Aufgabe dieser Woche, ob geschafft und wie viele Tage noch
export function thisWeek(finds: Find[], now: Date): { task: WeekTask; done: boolean; daysLeft: number } {
  const start = weekStart(now);
  const list = finds.filter((f) => new Date(f.date) >= start);
  const daysLeft = 7 - Math.floor((now.getTime() - start.getTime()) / DAY);
  return { task: weekTask(now), done: taskDone(weekTask(now), list), daysLeft: Math.max(1, daysLeft) };
}
