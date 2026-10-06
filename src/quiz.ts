import AsyncStorage from '@react-native-async-storage/async-storage';

import { dayKey } from './progress';

// "Frage des Forschers": jeden Tag eine Frage, richtige Antwort gibt XP.
export type Question = { q: string; answers: string[]; right: number; explain: string };

const QUESTIONS: Question[] = [
  { q: 'Welches Tier ist kein Insekt?', answers: ['Biene', 'Spinne', 'Käfer'], right: 1, explain: 'Richtig! Spinnen haben acht Beine, Insekten sechs.' },
  { q: 'Was fressen Igel am liebsten?', answers: ['Äpfel', 'Milch', 'Käfer und Würmer'], right: 2, explain: 'Genau! Und Milch macht Igel sogar krank.' },
  { q: 'Wie viele Beine hat ein Käfer?', answers: ['Vier', 'Sechs', 'Acht'], right: 1, explain: 'Richtig! Käfer sind Insekten und haben sechs Beine.' },
  { q: 'Welcher Vogel kann rückwärts fliegen?', answers: ['Kolibri', 'Amsel', 'Storch'], right: 0, explain: 'Stimmt! Kolibris können sogar in der Luft stehen.' },
  { q: 'Wo überwintern viele Frösche?', answers: ['Im Baumwipfel', 'Im Schlamm am Teichgrund', 'In Vogelnestern'], right: 1, explain: 'Richtig! Manche verbringen den Winter im Schlamm am Teichgrund.' },
  { q: 'Woran erkennt man eine Kreuzspinne?', answers: ['Am weißen Kreuz auf dem Rücken', 'An roten Beinen', 'Am langen Schwanz'], right: 0, explain: 'Genau! Daher hat sie ihren Namen.' },
  { q: 'Was macht ein Eichhörnchen im Herbst?', answers: ['Es zieht nach Süden', 'Es vergräbt Nüsse', 'Es häutet sich'], right: 1, explain: 'Richtig! Viele Verstecke findet es nie wieder, so wachsen neue Bäume.' },
  { q: 'Welches Tier ist ein Säugetier?', answers: ['Fledermaus', 'Eidechse', 'Kröte'], right: 0, explain: 'Stimmt! Fledermäuse sind die einzigen Säugetiere, die richtig fliegen können.' },
  { q: 'Wie atmen Regenwürmer?', answers: ['Durch die Haut', 'Mit Kiemen', 'Mit einer Lunge'], right: 0, explain: 'Richtig! Deshalb kommen sie bei Regen an die Oberfläche.' },
  { q: 'Was ist ein Engerling?', answers: ['Eine Schnecke', 'Die Larve eines Käfers', 'Ein junger Vogel'], right: 1, explain: 'Genau! Aus Engerlingen werden zum Beispiel Maikäfer.' },
  { q: 'Wie viele Punkte hat der häufigste Marienkäfer bei uns?', answers: ['Zwei', 'Sieben', 'Zwölf'], right: 1, explain: 'Richtig! Der Siebenpunkt ist bei uns sehr häufig.' },
  { q: 'Welcher Vogel klopft Löcher in Bäume?', answers: ['Specht', 'Meise', 'Spatz'], right: 0, explain: 'Stimmt! Spechte trommeln bis zu 20-mal pro Sekunde.' },
  { q: 'Was hilft Wildbienen im Winter?', answers: ['Laub wegräumen', 'Hohle Pflanzenstängel stehen lassen', 'Rasen kurz mähen'], right: 1, explain: 'Richtig! In hohlen Stängeln überwintern viele Wildbienen.' },
  { q: 'Wie heißt ein junger Frosch?', answers: ['Kaulquappe', 'Raupe', 'Larvi'], right: 0, explain: 'Genau! Kaulquappen leben im Wasser und atmen mit Kiemen.' },
];

export function questionFor(date: Date): Question {
  const n = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86400000);
  return QUESTIONS[n % QUESTIONS.length];
}

// Antworten pro Tag: { "2026-10-06": 1 } (Index der gewählten Antwort)
const QUIZ_KEY = 'findimal-quiz';
export type QuizLog = Record<string, number>;

export async function loadQuiz(): Promise<QuizLog> {
  try {
    const raw = await AsyncStorage.getItem(QUIZ_KEY);
    return raw ? (JSON.parse(raw) as QuizLog) : {};
  } catch {
    return {};
  }
}

export async function answerQuiz(log: QuizLog, date: Date, answer: number): Promise<QuizLog> {
  const next = { ...log, [dayKey(date)]: answer };
  await AsyncStorage.setItem(QUIZ_KEY, JSON.stringify(next)).catch(() => {});
  return next;
}

export function correctAnswers(log: QuizLog): number {
  return Object.entries(log).filter(([day, a]) => questionFor(new Date(`${day}T12:00:00`)).right === a).length;
}
