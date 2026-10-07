import AsyncStorage from '@react-native-async-storage/async-storage';

import { Lang } from './i18n';

// "Frage des Forschers": eine Frage nach der anderen, richtige Antwort gibt XP.
export type Question = { q: string; answers: string[]; right: number; explain: string };

// Gleiche Reihenfolge und gleiche richtige Antwort in allen Sprachen.
const QUESTIONS: Record<Lang, Question[]> = {
  de: [
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
  ],
  en: [
    { q: 'Which animal is not an insect?', answers: ['Bee', 'Spider', 'Beetle'], right: 1, explain: 'Right! Spiders have eight legs, insects have six.' },
    { q: 'What do hedgehogs like to eat most?', answers: ['Apples', 'Milk', 'Beetles and worms'], right: 2, explain: 'Exactly! And milk even makes hedgehogs ill.' },
    { q: 'How many legs does a beetle have?', answers: ['Four', 'Six', 'Eight'], right: 1, explain: 'Right! Beetles are insects and have six legs.' },
    { q: 'Which bird can fly backwards?', answers: ['Hummingbird', 'Blackbird', 'Stork'], right: 0, explain: 'Correct! Hummingbirds can even hover in mid-air.' },
    { q: 'Where do many frogs spend the winter?', answers: ['In treetops', 'In the mud at the bottom of a pond', 'In bird nests'], right: 1, explain: 'Right! Some spend the winter in the mud at the bottom of a pond.' },
    { q: 'How do you recognise a garden spider?', answers: ['By the white cross on its back', 'By its red legs', 'By its long tail'], right: 0, explain: 'Exactly! That’s why it’s also called the cross spider.' },
    { q: 'What does a squirrel do in autumn?', answers: ['It flies south', 'It buries nuts', 'It sheds its skin'], right: 1, explain: 'Right! It never finds many of its hiding places, so new trees grow.' },
    { q: 'Which animal is a mammal?', answers: ['Bat', 'Lizard', 'Toad'], right: 0, explain: 'Correct! Bats are the only mammals that can really fly.' },
    { q: 'How do earthworms breathe?', answers: ['Through their skin', 'With gills', 'With lungs'], right: 0, explain: 'Right! That’s why they come to the surface when it rains.' },
    { q: 'What is a grub?', answers: ['A snail', 'The larva of a beetle', 'A young bird'], right: 1, explain: 'Exactly! Cockchafers, for example, grow from grubs.' },
    { q: 'How many spots does our most common ladybird have?', answers: ['Two', 'Seven', 'Twelve'], right: 1, explain: 'Right! The seven-spot ladybird is very common.' },
    { q: 'Which bird drills holes into trees?', answers: ['Woodpecker', 'Tit', 'Sparrow'], right: 0, explain: 'Correct! Woodpeckers drum up to 20 times a second.' },
    { q: 'What helps wild bees in winter?', answers: ['Clearing away leaves', 'Leaving hollow plant stems standing', 'Mowing the lawn short'], right: 1, explain: 'Right! Many wild bees overwinter in hollow stems.' },
    { q: 'What is a young frog called?', answers: ['Tadpole', 'Caterpillar', 'Larvi'], right: 0, explain: 'Exactly! Tadpoles live in water and breathe with gills.' },
  ],
  fr: [
    { q: 'Quel animal n’est pas un insecte ?', answers: ['L’abeille', 'L’araignée', 'Le scarabée'], right: 1, explain: 'Bravo ! Les araignées ont huit pattes, les insectes six.' },
    { q: 'Que préfèrent manger les hérissons ?', answers: ['Des pommes', 'Du lait', 'Des scarabées et des vers'], right: 2, explain: 'Exact ! Et le lait rend même les hérissons malades.' },
    { q: 'Combien de pattes a un scarabée ?', answers: ['Quatre', 'Six', 'Huit'], right: 1, explain: 'Bravo ! Les scarabées sont des insectes et ont six pattes.' },
    { q: 'Quel oiseau peut voler à reculons ?', answers: ['Le colibri', 'Le merle', 'La cigogne'], right: 0, explain: 'Exact ! Les colibris peuvent même faire du surplace.' },
    { q: 'Où beaucoup de grenouilles passent-elles l’hiver ?', answers: ['En haut des arbres', 'Dans la vase au fond de la mare', 'Dans des nids d’oiseaux'], right: 1, explain: 'Bravo ! Certaines passent l’hiver dans la vase au fond de la mare.' },
    { q: 'Comment reconnaît-on l’épeire diadème ?', answers: ['À la croix blanche sur son dos', 'À ses pattes rouges', 'À sa longue queue'], right: 0, explain: 'Exact ! On l’appelle aussi araignée porte-croix.' },
    { q: 'Que fait l’écureuil en automne ?', answers: ['Il part vers le sud', 'Il enterre des noix', 'Il mue'], right: 1, explain: 'Bravo ! Il oublie beaucoup de cachettes, et de nouveaux arbres poussent.' },
    { q: 'Quel animal est un mammifère ?', answers: ['La chauve-souris', 'Le lézard', 'Le crapaud'], right: 0, explain: 'Exact ! Les chauves-souris sont les seuls mammifères qui volent vraiment.' },
    { q: 'Comment respirent les vers de terre ?', answers: ['Par la peau', 'Avec des branchies', 'Avec des poumons'], right: 0, explain: 'Bravo ! C’est pourquoi ils remontent à la surface quand il pleut.' },
    { q: 'Qu’est-ce qu’un ver blanc ?', answers: ['Un escargot', 'La larve d’un scarabée', 'Un jeune oiseau'], right: 1, explain: 'Exact ! Les hannetons, par exemple, sortent des vers blancs.' },
    { q: 'Combien de points a la coccinelle la plus courante chez nous ?', answers: ['Deux', 'Sept', 'Douze'], right: 1, explain: 'Bravo ! La coccinelle à sept points est très courante.' },
    { q: 'Quel oiseau creuse des trous dans les arbres ?', answers: ['Le pic', 'La mésange', 'Le moineau'], right: 0, explain: 'Exact ! Les pics tambourinent jusqu’à 20 fois par seconde.' },
    { q: 'Qu’est-ce qui aide les abeilles sauvages en hiver ?', answers: ['Ramasser les feuilles', 'Laisser les tiges creuses', 'Tondre la pelouse très court'], right: 1, explain: 'Bravo ! Beaucoup d’abeilles sauvages hivernent dans les tiges creuses.' },
    { q: 'Comment s’appelle une jeune grenouille ?', answers: ['Un têtard', 'Une chenille', 'Un larvi'], right: 0, explain: 'Exact ! Les têtards vivent dans l’eau et respirent avec des branchies.' },
  ],
  es: [
    { q: '¿Qué animal no es un insecto?', answers: ['La abeja', 'La araña', 'El escarabajo'], right: 1, explain: '¡Correcto! Las arañas tienen ocho patas y los insectos seis.' },
    { q: '¿Qué les gusta más comer a los erizos?', answers: ['Manzanas', 'Leche', 'Escarabajos y gusanos'], right: 2, explain: '¡Exacto! Y la leche incluso les enferma.' },
    { q: '¿Cuántas patas tiene un escarabajo?', answers: ['Cuatro', 'Seis', 'Ocho'], right: 1, explain: '¡Correcto! Los escarabajos son insectos y tienen seis patas.' },
    { q: '¿Qué ave puede volar hacia atrás?', answers: ['El colibrí', 'El mirlo', 'La cigüeña'], right: 0, explain: '¡Así es! Los colibríes pueden incluso quedarse quietos en el aire.' },
    { q: '¿Dónde pasan el invierno muchas ranas?', answers: ['En las copas de los árboles', 'En el barro del fondo de la charca', 'En nidos de aves'], right: 1, explain: '¡Correcto! Algunas pasan el invierno en el barro del fondo.' },
    { q: '¿Cómo se reconoce la araña de jardín?', answers: ['Por la cruz blanca en la espalda', 'Por sus patas rojas', 'Por su cola larga'], right: 0, explain: '¡Exacto! También se llama araña de cruz.' },
    { q: '¿Qué hace la ardilla en otoño?', answers: ['Vuela al sur', 'Entierra nueces', 'Cambia de piel'], right: 1, explain: '¡Correcto! Olvida muchos escondites y así crecen árboles nuevos.' },
    { q: '¿Qué animal es un mamífero?', answers: ['El murciélago', 'El lagarto', 'El sapo'], right: 0, explain: '¡Así es! Los murciélagos son los únicos mamíferos que vuelan de verdad.' },
    { q: '¿Cómo respiran las lombrices?', answers: ['Por la piel', 'Con branquias', 'Con pulmones'], right: 0, explain: '¡Correcto! Por eso salen a la superficie cuando llueve.' },
    { q: '¿Qué es un gusano blanco?', answers: ['Un caracol', 'La larva de un escarabajo', 'Un pájaro joven'], right: 1, explain: '¡Exacto! De ellos salen, por ejemplo, los abejorros sanjuaneros.' },
    { q: '¿Cuántos puntos tiene la mariquita más común?', answers: ['Dos', 'Siete', 'Doce'], right: 1, explain: '¡Correcto! La mariquita de siete puntos es muy común.' },
    { q: '¿Qué ave hace agujeros en los árboles?', answers: ['El pájaro carpintero', 'El carbonero', 'El gorrión'], right: 0, explain: '¡Así es! Los pájaros carpinteros golpean hasta 20 veces por segundo.' },
    { q: '¿Qué ayuda a las abejas silvestres en invierno?', answers: ['Quitar las hojas', 'Dejar los tallos huecos', 'Cortar el césped muy corto'], right: 1, explain: '¡Correcto! Muchas abejas silvestres invernan en tallos huecos.' },
    { q: '¿Cómo se llama una rana joven?', answers: ['Renacuajo', 'Oruga', 'Larvi'], right: 0, explain: '¡Exacto! Los renacuajos viven en el agua y respiran con branquias.' },
  ],
};

export const QUESTION_COUNT = QUESTIONS.de.length;

// Antworten pro Frage: { "q3": 1 } (Frage 3, gewählte Antwort 1)
const QUIZ_KEY = 'findimal-quiz';
export type QuizLog = Record<string, number>;

// Früher gab es eine Frage pro Tag ({ "2026-10-06": 1 }). Solche Einträge werden umgerechnet.
function migrate(log: QuizLog): QuizLog {
  const next: QuizLog = {};
  for (const [key, answer] of Object.entries(log)) {
    if (key.startsWith('q')) next[key] = answer;
    else {
      const [y, m, d] = key.split('-').map(Number);
      const n = Math.floor(new Date(y, m - 1, d).getTime() / 86400000);
      const q = `q${n % QUESTION_COUNT}`;
      if (!(q in next)) next[q] = answer;
    }
  }
  return next;
}

export async function loadQuiz(): Promise<QuizLog> {
  try {
    const raw = await AsyncStorage.getItem(QUIZ_KEY);
    return raw ? migrate(JSON.parse(raw) as QuizLog) : {};
  } catch {
    return {};
  }
}

export function question(index: number, lang: Lang): Question {
  return QUESTIONS[lang][index];
}

// Nächste noch nicht beantwortete Frage (oder null, wenn alle beantwortet sind)
export function nextQuestion(log: QuizLog): number | null {
  for (let i = 0; i < QUESTION_COUNT; i++) if (!(`q${i}` in log)) return i;
  return null;
}

export async function answerQuiz(log: QuizLog, index: number, answer: number): Promise<QuizLog> {
  const next = { ...log, [`q${index}`]: answer };
  await AsyncStorage.setItem(QUIZ_KEY, JSON.stringify(next)).catch(() => {});
  return next;
}

export function correctAnswers(log: QuizLog): number {
  return Object.entries(log).filter(([key, a]) => {
    const q = QUESTIONS.de[Number(key.slice(1))];
    return key.startsWith('q') && !!q && q.right === a;
  }).length;
}
