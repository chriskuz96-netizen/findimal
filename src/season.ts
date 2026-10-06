import { GroupId } from './groups';

// Inhalte der Saison-Seite für die vier Jahreszeiten (Mitteleuropa).

export type Phenomenon = { icon: GroupId; title: string; sci: string; text: string; where: string };
export type HelpTip = { title: string; text: string };
export type SeasonEvent = { title: string; sci: string; name: string };
export type Season = {
  name: string;
  event: SeasonEvent;
  phenomena: Phenomenon[];
  help: HelpTip[];
};

const SPRING: Season = {
  name: 'Frühling in Mitteleuropa',
  event: { title: 'Frühlings-Aktion: Entdecke eine Amsel', sci: 'Turdus merula', name: 'Amsel' },
  phenomena: [
    { icon: 'amp', title: 'Kröten wandern', sci: 'Bufo bufo', text: 'In milden, feuchten Nächten wandern Erdkröten zu ihren Laichgewässern, oft über Straßen. Viele Helfer tragen sie sicher hinüber.', where: 'Teiche und Waldwege, abends' },
    { icon: 'bird', title: 'Vogelkonzert am Morgen', sci: 'Turdus merula', text: 'Schon vor Sonnenaufgang singen Amseln, Rotkehlchen und Meisen um die Wette, um ihr Revier zu zeigen.', where: 'Gärten und Parks, früh morgens' },
    { icon: 'ins', title: 'Erste Schmetterlinge', sci: 'Gonepteryx rhamni', text: 'Der Zitronenfalter überwintert als fertiger Falter und gehört deshalb zu den allerersten Schmetterlingen im Jahr.', where: 'Waldränder an sonnigen Tagen' },
    { icon: 'bird', title: 'Störche kehren zurück', sci: 'Ciconia ciconia', text: 'Nach dem Winter in Afrika oder Spanien besetzen Weißstörche wieder ihre Nester auf Dächern und Masten.', where: 'Dörfer und feuchte Wiesen' },
  ],
  help: [
    { title: 'Nistkasten aufhängen', text: 'Am besten schon im März, an einer ruhigen Stelle, nicht in der prallen Sonne.' },
    { title: 'Löwenzahn blühen lassen', text: 'Frühblüher sind die erste Nahrung für Wildbienen und Hummeln.' },
    { title: 'Hecken in Ruhe lassen', text: 'Jetzt brüten Vögel. Starke Rückschnitte sind von März bis September verboten.' },
    { title: 'Kröten helfen', text: 'Langsam fahren an Krötenwanderwegen und Krötenzäune unterstützen.' },
  ],
};

const SUMMER: Season = {
  name: 'Sommer in Mitteleuropa',
  event: { title: 'Sommer-Aktion: Entdecke eine Libelle', sci: 'Odonata', name: 'Libelle' },
  phenomena: [
    { icon: 'ins', title: 'Glühwürmchen leuchten', sci: 'Lampyris noctiluca', text: 'In warmen Juninächten blinken die Leuchtkäfer. Die Männchen fliegen, die Weibchen leuchten am Boden.', where: 'Waldränder, nach Einbruch der Dunkelheit' },
    { icon: 'bird', title: 'Mauersegler jagen', sci: 'Apus apus', text: 'Mit schrillen Rufen sausen sie über die Dächer. Sie schlafen sogar im Flug und ziehen schon Anfang August wieder fort.', where: 'Über Städten, abends' },
    { icon: 'ins', title: 'Libellen am Teich', sci: 'Aeshna cyanea', text: 'Die Blaugrüne Mosaikjungfer patrouilliert an Gartenteichen und jagt kleine Insekten im Flug.', where: 'Teiche und Bäche, sonnig' },
    { icon: 'amp', title: 'Junge Frösche', sci: 'Rana temporaria', text: 'Aus Kaulquappen werden winzige Frösche, die das Wasser verlassen und das Land erkunden.', where: 'Ufer und feuchte Wiesen' },
  ],
  help: [
    { title: 'Insektentränke aufstellen', text: 'Eine flache Schale mit Wasser und ein paar Steinen als Landeplatz hilft Bienen bei Hitze.' },
    { title: 'Wilde Ecke wachsen lassen', text: 'Ein Stück Wiese nicht mähen: Blüten für Insekten, Verstecke für Kleintiere.' },
    { title: 'Licht aus', text: 'Weniger Außenbeleuchtung schützt nachtaktive Insekten und Fledermäuse.' },
    { title: 'Kein Gift im Garten', text: 'Ohne Spritzmittel bleiben Marienkäfer, Igel und Vögel gesund.' },
  ],
};

const AUTUMN: Season = {
  name: 'Herbst in Mitteleuropa',
  event: { title: 'Igel-Herbst: Entdecke einen Igel', sci: 'Erinaceus europaeus', name: 'Igel' },
  phenomena: [
    { icon: 'bird', title: 'Kraniche ziehen', sci: 'Grus grus', text: 'In großen Keilformationen geht es nach Süden. Achte auf ihre trompetenden Rufe am Himmel.', where: 'Am Himmel, morgens und abends' },
    { icon: 'mam', title: 'Hirschbrunft', sci: 'Cervus elaphus', text: 'Bis Mitte Oktober röhren die Hirsche, um Rivalen zu beeindrucken. Beobachte nur aus großer Entfernung.', where: 'Waldränder in der Dämmerung' },
    { icon: 'mam', title: 'Igel futtern sich satt', sci: 'Erinaceus europaeus', text: 'Vor dem Winterschlaf brauchen sie viel Energie. Ein Laubhaufen im Garten ist ein perfektes Winterquartier.', where: 'Hecken und Gärten, abends' },
    { icon: 'ara', title: 'Spinnennetz-Zeit', sci: 'Araneus diadematus', text: 'Die Netze sind jetzt am größten. An nebligen Morgen glitzern sie voller Tau.', where: 'Zäune und Hecken, früh morgens' },
  ],
  help: [
    { title: 'Laub liegen lassen', text: 'Unter Laubhaufen überwintern Igel, Käfer und Spinnen. Lass einfach eine Ecke liegen.' },
    { title: 'Stängel stehen lassen', text: 'In hohlen Pflanzenstängeln überwintern Wildbienen. Erst im Frühling zurückschneiden.' },
    { title: 'Igeln richtig helfen', text: 'Niemals Milch geben, die macht sie krank. Eine flache Schale Wasser hilft mehr.' },
    { title: 'Licht aus', text: 'Weniger Außenbeleuchtung schützt nachtaktive Insekten und Fledermäuse.' },
  ],
};

const WINTER: Season = {
  name: 'Winter in Mitteleuropa',
  event: { title: 'Winter-Aktion: Entdecke eine Kohlmeise', sci: 'Parus major', name: 'Kohlmeise' },
  phenomena: [
    { icon: 'bird', title: 'Gäste am Futterhaus', sci: 'Parus major', text: 'Kohlmeisen, Blaumeisen und Rotkehlchen lassen sich jetzt besonders gut beobachten.', where: 'Gärten und Balkone, tagsüber' },
    { icon: 'mam', title: 'Spuren im Schnee', sci: 'Vulpes vulpes', text: 'Füchse sind jetzt in der Paarungszeit viel unterwegs. Im Schnee siehst du ihre Spuren wie an einer Schnur aufgereiht.', where: 'Feldränder und Waldwege' },
    { icon: 'bird', title: 'Enten auf dem See', sci: 'Anas platyrhynchos', text: 'Auf eisfreien Gewässern sammeln sich Stockenten und viele Gäste aus dem Norden.', where: 'Seen und Flüsse' },
    { icon: 'mam', title: 'Eichhörnchen bleiben wach', sci: 'Sciurus vulgaris', text: 'Eichhörnchen halten keinen Winterschlaf. Sie suchen ihre im Herbst versteckten Nüsse.', where: 'Parks und Wälder' },
  ],
  help: [
    { title: 'Vögel richtig füttern', text: 'Sonnenblumenkerne und Meisenknödel ohne Netz, kein Brot. Das Futterhaus sauber halten.' },
    { title: 'Winterschläfer nicht stören', text: 'Laub- und Reisighaufen jetzt in Ruhe lassen, darin schlafen Igel.' },
    { title: 'Eisfreies Wasser', text: 'Eine flache Schale mit frischem Wasser hilft Vögeln bei Frost.' },
    { title: 'Nistkästen putzen', text: 'Bis Ende Februar alte Nester entfernen, damit im Frühling neu gebrütet werden kann.' },
  ],
};

export const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

export function seasonFor(date: Date): Season {
  const m = date.getMonth(); // 0 = Januar
  if (m >= 2 && m <= 4) return SPRING;
  if (m >= 5 && m <= 7) return SUMMER;
  if (m >= 8 && m <= 10) return AUTUMN;
  return WINTER;
}
