import { Lang } from './i18n';

// Lustige Entdecker-Namen zum Würfeln (z. B. "Flinker Fuchs") – damit niemand seinen echten Namen nehmen muss.
type Animal = { n: string; g: 'm' | 'f' | 'n' };

const DE_ADJ = ['flink', 'leis', 'neugierig', 'mutig', 'schlau', 'wild', 'fröhlich', 'wachsam', 'flauschig', 'schnell', 'stolz', 'klein'];
const DE_ANIMALS: Animal[] = [
  { n: 'Fuchs', g: 'm' }, { n: 'Dachs', g: 'm' }, { n: 'Igel', g: 'm' }, { n: 'Specht', g: 'm' }, { n: 'Luchs', g: 'm' },
  { n: 'Eule', g: 'f' }, { n: 'Libelle', g: 'f' }, { n: 'Hummel', g: 'f' }, { n: 'Eidechse', g: 'f' }, { n: 'Amsel', g: 'f' },
  { n: 'Eichhörnchen', g: 'n' }, { n: 'Reh', g: 'n' }, { n: 'Rotkehlchen', g: 'n' },
];
const DE_END = { m: 'er', f: 'e', n: 'es' } as const;
// "leis" + "e" = "Leise", aber "flink" + "e" = "Flinke" – Stämme sind so gewählt, dass die Endung direkt passt
const EN_ADJ = ['Swift', 'Quiet', 'Curious', 'Brave', 'Clever', 'Wild', 'Happy', 'Watchful', 'Fluffy', 'Speedy'];
const EN_ANIMALS = ['Fox', 'Badger', 'Hedgehog', 'Owl', 'Dragonfly', 'Squirrel', 'Robin', 'Lynx', 'Bumblebee', 'Deer'];
const FR: [string, string][] = [
  ['Renard', 'rusé'], ['Hibou', 'curieux'], ['Hérisson', 'courageux'], ['Écureuil', 'malin'], ['Lynx', 'discret'],
  ['Chouette', 'futée'], ['Libellule', 'rapide'], ['Abeille', 'joyeuse'], ['Biche', 'curieuse'],
];
const ES: [string, string][] = [
  ['Zorro', 'astuto'], ['Búho', 'curioso'], ['Erizo', 'valiente'], ['Lince', 'veloz'], ['Ardilla', 'traviesa'],
  ['Lechuza', 'curiosa'], ['Libélula', 'rápida'], ['Abeja', 'alegre'], ['Corzo', 'tranquilo'],
];

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function randomNickname(lang: Lang): string {
  if (lang === 'de') {
    const a = pick(DE_ANIMALS);
    return `${cap(pick(DE_ADJ))}${DE_END[a.g]} ${a.n}`;
  }
  if (lang === 'fr') {
    const [n, adj] = pick(FR);
    return `${n} ${cap(adj)}`;
  }
  if (lang === 'es') {
    const [n, adj] = pick(ES);
    return `${n} ${cap(adj)}`;
  }
  return `${pick(EN_ADJ)} ${pick(EN_ANIMALS)}`;
}
