import { Lang } from './i18n';

// Lustige Entdecker-Namen zum Würfeln (z. B. "Flinker Fuchs") – damit niemand seinen echten Namen nehmen muss.
type Animal = { n: string; g: 'm' | 'f' | 'n' };

const DE_ADJ = ['flink', 'leis', 'neugierig', 'mutig', 'schlau', 'wild', 'fröhlich', 'wachsam', 'flauschig', 'schnell', 'stolz', 'klein', 'tapfer', 'ruhig', 'munter', 'listig', 'sanft', 'kühn', 'heiter', 'emsig', 'lustig', 'scheu', 'frech', 'pfiffig', 'gemütlich', 'verträumt', 'wendig', 'flott'];
const DE_ANIMALS: Animal[] = [
  { n: 'Fuchs', g: 'm' }, { n: 'Dachs', g: 'm' }, { n: 'Igel', g: 'm' }, { n: 'Specht', g: 'm' }, { n: 'Luchs', g: 'm' },
  { n: 'Biber', g: 'm' }, { n: 'Hase', g: 'm' }, { n: 'Falke', g: 'm' }, { n: 'Kranich', g: 'm' }, { n: 'Otter', g: 'm' },
  { n: 'Frosch', g: 'm' }, { n: 'Käfer', g: 'm' }, { n: 'Hirsch', g: 'm' }, { n: 'Kauz', g: 'm' }, { n: 'Marder', g: 'm' },
  { n: 'Eisvogel', g: 'm' }, { n: 'Storch', g: 'm' }, { n: 'Rabe', g: 'm' }, { n: 'Wolf', g: 'm' }, { n: 'Spatz', g: 'm' },
  { n: 'Eule', g: 'f' }, { n: 'Libelle', g: 'f' }, { n: 'Hummel', g: 'f' }, { n: 'Eidechse', g: 'f' }, { n: 'Amsel', g: 'f' },
  { n: 'Meise', g: 'f' }, { n: 'Maus', g: 'f' }, { n: 'Kröte', g: 'f' }, { n: 'Schnecke', g: 'f' }, { n: 'Biene', g: 'f' },
  { n: 'Fledermaus', g: 'f' }, { n: 'Elster', g: 'f' }, { n: 'Forelle', g: 'f' },
  { n: 'Eichhörnchen', g: 'n' }, { n: 'Reh', g: 'n' }, { n: 'Rotkehlchen', g: 'n' }, { n: 'Wiesel', g: 'n' },
  { n: 'Murmeltier', g: 'n' }, { n: 'Glühwürmchen', g: 'n' }, { n: 'Hermelin', g: 'n' },
];
const DE_END = { m: 'er', f: 'e', n: 'es' } as const;
const EN_ADJ = ['Swift', 'Quiet', 'Curious', 'Brave', 'Clever', 'Wild', 'Happy', 'Watchful', 'Fluffy', 'Speedy', 'Gentle', 'Cheeky', 'Sneaky', 'Jolly', 'Bold', 'Sleepy', 'Mighty', 'Tiny', 'Busy', 'Dreamy', 'Lucky', 'Nimble', 'Cosy', 'Bright'];
const EN_ANIMALS = ['Fox', 'Badger', 'Hedgehog', 'Owl', 'Dragonfly', 'Squirrel', 'Robin', 'Lynx', 'Bumblebee', 'Deer', 'Otter', 'Beaver', 'Hare', 'Falcon', 'Heron', 'Frog', 'Beetle', 'Kingfisher', 'Woodpecker', 'Wren', 'Bat', 'Stoat', 'Snail', 'Firefly', 'Moth', 'Toad', 'Crane', 'Raven', 'Mole', 'Weasel', 'Magpie', 'Newt', 'Marmot', 'Salamander', 'Starling', 'Swallow', 'Trout', 'Lizard', 'Wolf', 'Sparrow'];
const FR_NOUNS: Animal[] = [
  { n: 'Renard', g: 'm' }, { n: 'Hibou', g: 'm' }, { n: 'Hérisson', g: 'm' }, { n: 'Écureuil', g: 'm' }, { n: 'Lynx', g: 'm' },
  { n: 'Blaireau', g: 'm' }, { n: 'Castor', g: 'm' }, { n: 'Lièvre', g: 'm' }, { n: 'Faucon', g: 'm' }, { n: 'Héron', g: 'm' },
  { n: 'Scarabée', g: 'm' }, { n: 'Martin-pêcheur', g: 'm' }, { n: 'Pic', g: 'm' }, { n: 'Loup', g: 'm' }, { n: 'Moineau', g: 'm' },
  { n: 'Chouette', g: 'f' }, { n: 'Libellule', g: 'f' }, { n: 'Abeille', g: 'f' }, { n: 'Biche', g: 'f' }, { n: 'Loutre', g: 'f' },
  { n: 'Grenouille', g: 'f' }, { n: 'Mésange', g: 'f' }, { n: 'Coccinelle', g: 'f' }, { n: 'Pie', g: 'f' }, { n: 'Luciole', g: 'f' },
  { n: 'Chauve-souris', g: 'f' }, { n: 'Hirondelle', g: 'f' }, { n: 'Marmotte', g: 'f' }, { n: 'Fourmi', g: 'f' }, { n: 'Truite', g: 'f' },
];
// Adjektiv männlich / weiblich
const FR_ADJ: [string, string][] = [
  ['Rusé', 'Rusée'], ['Curieux', 'Curieuse'], ['Courageux', 'Courageuse'], ['Malin', 'Maligne'], ['Discret', 'Discrète'],
  ['Rapide', 'Rapide'], ['Joyeux', 'Joyeuse'], ['Calme', 'Calme'], ['Agile', 'Agile'], ['Sauvage', 'Sauvage'],
  ['Petit', 'Petite'], ['Doux', 'Douce'], ['Vif', 'Vive'], ['Fier', 'Fière'], ['Rêveur', 'Rêveuse'],
  ['Espiègle', 'Espiègle'], ['Brillant', 'Brillante'], ['Tranquille', 'Tranquille'], ['Audacieux', 'Audacieuse'], ['Gourmand', 'Gourmande'],
];
const ES_NOUNS: Animal[] = [
  { n: 'Zorro', g: 'm' }, { n: 'Búho', g: 'm' }, { n: 'Erizo', g: 'm' }, { n: 'Lince', g: 'm' }, { n: 'Tejón', g: 'm' },
  { n: 'Castor', g: 'm' }, { n: 'Halcón', g: 'm' }, { n: 'Mirlo', g: 'm' }, { n: 'Escarabajo', g: 'm' }, { n: 'Lobo', g: 'm' },
  { n: 'Gorrión', g: 'm' }, { n: 'Martín pescador', g: 'm' }, { n: 'Corzo', g: 'm' }, { n: 'Pájaro carpintero', g: 'm' }, { n: 'Conejo', g: 'm' },
  { n: 'Ardilla', g: 'f' }, { n: 'Lechuza', g: 'f' }, { n: 'Libélula', g: 'f' }, { n: 'Abeja', g: 'f' }, { n: 'Nutria', g: 'f' },
  { n: 'Rana', g: 'f' }, { n: 'Mariquita', g: 'f' }, { n: 'Urraca', g: 'f' }, { n: 'Luciérnaga', g: 'f' }, { n: 'Golondrina', g: 'f' },
  { n: 'Marmota', g: 'f' }, { n: 'Hormiga', g: 'f' }, { n: 'Trucha', g: 'f' }, { n: 'Lagartija', g: 'f' }, { n: 'Cigüeña', g: 'f' },
];
const ES_ADJ: [string, string][] = [
  ['Astuto', 'Astuta'], ['Curioso', 'Curiosa'], ['Valiente', 'Valiente'], ['Veloz', 'Veloz'], ['Travieso', 'Traviesa'],
  ['Tranquilo', 'Tranquila'], ['Alegre', 'Alegre'], ['Ágil', 'Ágil'], ['Salvaje', 'Salvaje'], ['Pequeño', 'Pequeña'],
  ['Listo', 'Lista'], ['Atrevido', 'Atrevida'], ['Soñador', 'Soñadora'], ['Feliz', 'Feliz'], ['Silencioso', 'Silenciosa'],
  ['Brillante', 'Brillante'], ['Orgulloso', 'Orgullosa'], ['Juguetón', 'Juguetona'], ['Dormilón', 'Dormilona'], ['Intrépido', 'Intrépida'],
];

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function randomNickname(lang: Lang): string {
  if (lang === 'de') {
    const a = pick(DE_ANIMALS);
    return `${cap(pick(DE_ADJ))}${DE_END[a.g]} ${a.n}`;
  }
  if (lang === 'fr' || lang === 'es') {
    const a = pick(lang === 'fr' ? FR_NOUNS : ES_NOUNS);
    const [m, f] = pick(lang === 'fr' ? FR_ADJ : ES_ADJ);
    return `${a.n} ${a.g === 'f' ? f : m}`;
  }
  return `${pick(EN_ADJ)} ${pick(EN_ANIMALS)}`;
}
