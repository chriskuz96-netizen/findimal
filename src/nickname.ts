// Spitznamen aus der Vorlage; pro App-Start wird einer zufällig gewählt.
const NICKNAMES = [
  'Naturbursche',
  'Moosflüsterer',
  'Spürnase',
  'Pfützenforscher',
  'Fährtenleser',
  'Blätterdetektiv',
  'Wurzelwanderer',
];

export const nickname = NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)];
