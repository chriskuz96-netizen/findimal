// Fragen fürs Forscher-Quiz. Nicht von Hand ändern: Vorlage in tools/quiz/*.json,
// neu erzeugen mit: python3 tools/make_quiz_bank.py
import { Lang } from './i18n';

export type BankText = { q: string; a: string[]; x: string };
export type BankQuestion = {
  id: string;
  lvl: 1 | 2 | 3; // 1 mittel, 2 schwer, 3 sehr schwer
  type: 'text' | 'tf' | 'image';
  right: number;
  img?: string[]; // Bildfragen: Tiere aus PlusAnimal
  t: Record<Lang, BankText>;
};

export const BANK: BankQuestion[] = [
  { id: "z01", lvl: 2, type: "image", right: 1, img: ["p-crab", "p-octopus", "p-shark", "p-snail"], t: { de: { q: "Welches dieser Tiere hat drei Herzen?", a: ["Krabbe", "Krake", "Hai", "Schnecke"], x: "Kraken haben drei Herzen: zwei pumpen Blut durch die Kiemen, eines durch den Körper." }, en: { q: "Which of these animals has three hearts?", a: ["Crab", "Octopus", "Shark", "Snail"], x: "Octopuses have three hearts: two pump blood through the gills, one through the body." }, fr: { q: "Lequel de ces animaux a trois cœurs ?", a: ["Crabe", "Pieuvre", "Requin", "Escargot"], x: "La pieuvre a trois cœurs : deux pompent le sang vers les branchies, un vers le corps." }, es: { q: "¿Cuál de estos animales tiene tres corazones?", a: ["Cangrejo", "Pulpo", "Tiburón", "Caracol"], x: "El pulpo tiene tres corazones: dos bombean sangre a las branquias y uno al cuerpo." } } },
];
