import { GroupId } from './groups';
import { Lang } from './i18n';

// Inhalte der Saison-Seite für die vier Jahreszeiten (Mitteleuropa), in vier Sprachen.

export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';

// Teile, die in allen Sprachen gleich sind
const BASE: Record<SeasonId, { icons: GroupId[]; sci: string[]; eventIcon: GroupId; eventMatch: string[] }> = {
  spring: {
    icons: ['amp', 'bird', 'ins', 'bird'],
    sci: ['Bufo bufo', 'Turdus merula', 'Gonepteryx rhamni', 'Ciconia ciconia'],
    eventIcon: 'bird',
    eventMatch: ['turdus merula', 'amsel', 'blackbird', 'merle', 'mirlo'],
  },
  summer: {
    icons: ['ins', 'bird', 'ins', 'amp'],
    sci: ['Lampyris noctiluca', 'Apus apus', 'Aeshna cyanea', 'Rana temporaria'],
    eventIcon: 'ins',
    eventMatch: ['odonata', 'libelle', 'jungfer', 'dragonfly', 'damselfly', 'libellule', 'demoiselle', 'libélula', 'caballito del diablo'],
  },
  autumn: {
    icons: ['bird', 'mam', 'mam', 'ara'],
    sci: ['Grus grus', 'Cervus elaphus', 'Erinaceus europaeus', 'Araneus diadematus'],
    eventIcon: 'mam',
    eventMatch: ['erinaceus', 'igel', 'hedgehog', 'hérisson', 'erizo'],
  },
  winter: {
    icons: ['bird', 'mam', 'bird', 'mam'],
    sci: ['Parus major', 'Vulpes vulpes', 'Anas platyrhynchos', 'Sciurus vulgaris'],
    eventIcon: 'bird',
    eventMatch: ['parus major', 'kohlmeise', 'great tit', 'mésange charbonnière', 'carbonero común'],
  },
};

type Text = {
  name: string;
  event: string;
  phenomena: { title: string; text: string; where: string }[];
  help: { title: string; text: string }[];
};

const TEXTS: Record<Lang, Record<SeasonId, Text>> = {
  de: {
    spring: {
      name: 'Frühling in Mitteleuropa',
      event: 'Frühlings-Aktion: Entdecke eine Amsel',
      phenomena: [
        { title: 'Kröten wandern', text: 'In milden, feuchten Nächten wandern Erdkröten zu ihren Laichgewässern, oft über Straßen. Viele Helfer tragen sie sicher hinüber.', where: 'Teiche und Waldwege, abends' },
        { title: 'Vogelkonzert am Morgen', text: 'Schon vor Sonnenaufgang singen Amseln, Rotkehlchen und Meisen um die Wette, um ihr Revier zu zeigen.', where: 'Gärten und Parks, früh morgens' },
        { title: 'Erste Schmetterlinge', text: 'Der Zitronenfalter überwintert als fertiger Falter und gehört deshalb zu den allerersten Schmetterlingen im Jahr.', where: 'Waldränder an sonnigen Tagen' },
        { title: 'Störche kehren zurück', text: 'Nach dem Winter in Afrika oder Spanien besetzen Weißstörche wieder ihre Nester auf Dächern und Masten.', where: 'Dörfer und feuchte Wiesen' },
      ],
      help: [
        { title: 'Nistkasten aufhängen', text: 'Am besten schon im März, an einer ruhigen Stelle, nicht in der prallen Sonne.' },
        { title: 'Löwenzahn blühen lassen', text: 'Frühblüher sind die erste Nahrung für Wildbienen und Hummeln.' },
        { title: 'Hecken in Ruhe lassen', text: 'Jetzt brüten Vögel. Starke Rückschnitte sind in Deutschland von März bis September verboten.' },
        { title: 'Kröten helfen', text: 'Langsam fahren an Krötenwanderwegen und Krötenzäune unterstützen.' },
      ],
    },
    summer: {
      name: 'Sommer in Mitteleuropa',
      event: 'Sommer-Aktion: Entdecke eine Libelle',
      phenomena: [
        { title: 'Glühwürmchen leuchten', text: 'In warmen Juninächten blinken die Leuchtkäfer. Die Männchen fliegen, die Weibchen leuchten am Boden.', where: 'Waldränder, nach Einbruch der Dunkelheit' },
        { title: 'Mauersegler jagen', text: 'Mit schrillen Rufen sausen sie über die Dächer. Sie schlafen sogar im Flug und ziehen schon Anfang August wieder fort.', where: 'Über Städten, abends' },
        { title: 'Libellen am Teich', text: 'Die Blaugrüne Mosaikjungfer patrouilliert an Gartenteichen und jagt kleine Insekten im Flug.', where: 'Teiche und Bäche, sonnig' },
        { title: 'Junge Frösche', text: 'Aus Kaulquappen werden winzige Frösche, die das Wasser verlassen und das Land erkunden.', where: 'Ufer und feuchte Wiesen' },
      ],
      help: [
        { title: 'Insektentränke aufstellen', text: 'Eine flache Schale mit Wasser und ein paar Steinen als Landeplatz hilft Bienen bei Hitze.' },
        { title: 'Wilde Ecke wachsen lassen', text: 'Ein Stück Wiese nicht mähen: Blüten für Insekten, Verstecke für Kleintiere.' },
        { title: 'Licht aus', text: 'Weniger Außenbeleuchtung schützt nachtaktive Insekten und Fledermäuse.' },
        { title: 'Kein Gift im Garten', text: 'Ohne Spritzmittel bleiben Marienkäfer, Igel und Vögel gesund.' },
      ],
    },
    autumn: {
      name: 'Herbst in Mitteleuropa',
      event: 'Igel-Herbst: Entdecke einen Igel',
      phenomena: [
        { title: 'Kraniche ziehen', text: 'In großen Keilformationen geht es nach Süden. Achte auf ihre trompetenden Rufe am Himmel.', where: 'Am Himmel, morgens und abends' },
        { title: 'Hirschbrunft', text: 'Bis Mitte Oktober röhren die Hirsche, um Rivalen zu beeindrucken. Beobachte nur aus großer Entfernung.', where: 'Waldränder in der Dämmerung' },
        { title: 'Igel futtern sich satt', text: 'Vor dem Winterschlaf brauchen sie viel Energie. Ein Laubhaufen im Garten ist ein perfektes Winterquartier.', where: 'Hecken und Gärten, abends' },
        { title: 'Spinnennetz-Zeit', text: 'Die Netze sind jetzt am größten. An nebligen Morgen glitzern sie voller Tau.', where: 'Zäune und Hecken, früh morgens' },
      ],
      help: [
        { title: 'Laub liegen lassen', text: 'Unter Laubhaufen überwintern Igel, Käfer und Spinnen. Lass einfach eine Ecke liegen.' },
        { title: 'Stängel stehen lassen', text: 'In hohlen Pflanzenstängeln überwintern Wildbienen. Erst im Frühling zurückschneiden.' },
        { title: 'Igeln richtig helfen', text: 'Niemals Milch geben, die macht sie krank. Eine flache Schale Wasser hilft mehr.' },
        { title: 'Licht aus', text: 'Weniger Außenbeleuchtung schützt nachtaktive Insekten und Fledermäuse.' },
      ],
    },
    winter: {
      name: 'Winter in Mitteleuropa',
      event: 'Winter-Aktion: Entdecke eine Kohlmeise',
      phenomena: [
        { title: 'Gäste am Futterhaus', text: 'Kohlmeisen, Blaumeisen und Rotkehlchen lassen sich jetzt besonders gut beobachten.', where: 'Gärten und Balkone, tagsüber' },
        { title: 'Spuren im Schnee', text: 'Füchse sind jetzt in der Paarungszeit viel unterwegs. Im Schnee siehst du ihre Spuren wie an einer Schnur aufgereiht.', where: 'Feldränder und Waldwege' },
        { title: 'Enten auf dem See', text: 'Auf eisfreien Gewässern sammeln sich Stockenten und viele Gäste aus dem Norden.', where: 'Seen und Flüsse' },
        { title: 'Eichhörnchen bleiben wach', text: 'Eichhörnchen halten keinen Winterschlaf. Sie suchen ihre im Herbst versteckten Nüsse.', where: 'Parks und Wälder' },
      ],
      help: [
        { title: 'Vögel richtig füttern', text: 'Sonnenblumenkerne und Meisenknödel ohne Netz, kein Brot. Das Futterhaus sauber halten.' },
        { title: 'Winterschläfer nicht stören', text: 'Laub- und Reisighaufen jetzt in Ruhe lassen, darin schlafen Igel.' },
        { title: 'Eisfreies Wasser', text: 'Eine flache Schale mit frischem Wasser hilft Vögeln bei Frost.' },
        { title: 'Nistkästen putzen', text: 'Bis Ende Februar alte Nester entfernen, damit im Frühling neu gebrütet werden kann.' },
      ],
    },
  },
  en: {
    spring: {
      name: 'Spring in Central Europe',
      event: 'Spring event: discover a blackbird',
      phenomena: [
        { title: 'Toads on the move', text: 'On mild, damp nights common toads migrate to their breeding ponds, often across roads. Many volunteers carry them safely over.', where: 'Ponds and forest paths, evenings' },
        { title: 'Dawn chorus', text: 'Even before sunrise, blackbirds, robins and tits sing against each other to mark their territory.', where: 'Gardens and parks, early morning' },
        { title: 'First butterflies', text: 'The brimstone spends the winter as an adult butterfly, so it is one of the very first butterflies of the year.', where: 'Forest edges on sunny days' },
        { title: 'Storks return', text: 'After the winter in Africa or Spain, white storks move back into their nests on roofs and poles.', where: 'Villages and wet meadows' },
      ],
      help: [
        { title: 'Hang up a nest box', text: 'Ideally in March, in a quiet spot and out of the full sun.' },
        { title: 'Let dandelions bloom', text: 'Early flowers are the first food for wild bees and bumblebees.' },
        { title: 'Leave hedges alone', text: 'Birds are nesting now. Hard cutting is not allowed in Germany from March to September.' },
        { title: 'Help the toads', text: 'Drive slowly near toad crossings and support toad fences.' },
      ],
    },
    summer: {
      name: 'Summer in Central Europe',
      event: 'Summer event: discover a dragonfly',
      phenomena: [
        { title: 'Glow-worms shine', text: 'On warm June nights the glow-worms light up. The males fly, the females glow on the ground.', where: 'Forest edges, after dark' },
        { title: 'Swifts hunting', text: 'With shrill calls they race over the rooftops. They even sleep while flying and leave again in early August.', where: 'Over towns, evenings' },
        { title: 'Dragonflies at the pond', text: 'The southern hawker patrols garden ponds and catches small insects in flight.', where: 'Ponds and streams, sunny' },
        { title: 'Young frogs', text: 'Tadpoles turn into tiny frogs that leave the water and explore the land.', where: 'Banks and wet meadows' },
      ],
      help: [
        { title: 'Set up a bee bath', text: 'A shallow dish of water with a few stones to land on helps bees in the heat.' },
        { title: 'Let a wild corner grow', text: 'Leave a patch of meadow unmown: flowers for insects, hiding places for small animals.' },
        { title: 'Lights off', text: 'Less outdoor lighting protects night insects and bats.' },
        { title: 'No poison in the garden', text: 'Without pesticides, ladybirds, hedgehogs and birds stay healthy.' },
      ],
    },
    autumn: {
      name: 'Autumn in Central Europe',
      event: 'Hedgehog autumn: find a hedgehog',
      phenomena: [
        { title: 'Cranes migrate', text: 'They fly south in large V-formations. Listen for their trumpeting calls overhead.', where: 'In the sky, morning and evening' },
        { title: 'Red deer rut', text: 'Until mid-October stags roar to impress rivals. Only watch from far away.', where: 'Forest edges at dusk' },
        { title: 'Hedgehogs feed up', text: 'They need lots of energy before hibernating. A leaf pile in the garden makes a perfect winter home.', where: 'Hedges and gardens, evenings' },
        { title: 'Spider web season', text: 'Webs are at their biggest now. On misty mornings they sparkle with dew.', where: 'Fences and hedges, early morning' },
      ],
      help: [
        { title: 'Leave the leaves', text: 'Hedgehogs, beetles and spiders spend the winter under leaf piles. Just leave one corner.' },
        { title: 'Keep plant stems', text: 'Wild bees overwinter in hollow stems. Cut back only in spring.' },
        { title: 'Help hedgehogs the right way', text: 'Never give milk, it makes them ill. A shallow dish of water helps more.' },
        { title: 'Lights off', text: 'Less outdoor lighting protects night insects and bats.' },
      ],
    },
    winter: {
      name: 'Winter in Central Europe',
      event: 'Winter event: discover a great tit',
      phenomena: [
        { title: 'Visitors at the feeder', text: 'Great tits, blue tits and robins are especially easy to watch now.', where: 'Gardens and balconies, daytime' },
        { title: 'Tracks in the snow', text: 'Foxes are busy now during their mating season. In the snow their tracks line up like beads on a string.', where: 'Field edges and forest paths' },
        { title: 'Ducks on the lake', text: 'Mallards and many visitors from the north gather on ice-free waters.', where: 'Lakes and rivers' },
        { title: 'Squirrels stay awake', text: 'Squirrels don’t hibernate. They look for the nuts they hid in autumn.', where: 'Parks and forests' },
      ],
      help: [
        { title: 'Feed birds the right way', text: 'Sunflower seeds and fat balls without nets, no bread. Keep the feeder clean.' },
        { title: 'Don’t disturb sleepers', text: 'Leave leaf and brush piles alone now, hedgehogs sleep inside.' },
        { title: 'Ice-free water', text: 'A shallow dish of fresh water helps birds when it freezes.' },
        { title: 'Clean nest boxes', text: 'Remove old nests by the end of February so birds can breed again in spring.' },
      ],
    },
  },
  fr: {
    spring: {
      name: 'Le printemps en Europe centrale',
      event: 'Action de printemps : découvre un merle',
      phenomena: [
        { title: 'Les crapauds migrent', text: 'Par les nuits douces et humides, les crapauds communs rejoignent leurs mares, souvent en traversant les routes. Des bénévoles les aident à passer.', where: 'Mares et chemins forestiers, le soir' },
        { title: 'Concert matinal', text: 'Avant même le lever du soleil, merles, rouges-gorges et mésanges chantent pour marquer leur territoire.', where: 'Jardins et parcs, tôt le matin' },
        { title: 'Premiers papillons', text: 'Le citron passe l’hiver sous forme de papillon adulte : c’est l’un des tout premiers papillons de l’année.', where: 'Lisières par temps ensoleillé' },
        { title: 'Retour des cigognes', text: 'Après l’hiver en Afrique ou en Espagne, les cigognes blanches réoccupent leurs nids sur les toits et les poteaux.', where: 'Villages et prairies humides' },
      ],
      help: [
        { title: 'Installer un nichoir', text: 'Idéalement dès mars, dans un endroit calme, pas en plein soleil.' },
        { title: 'Laisser fleurir les pissenlits', text: 'Les fleurs précoces sont la première nourriture des abeilles sauvages et des bourdons.' },
        { title: 'Laisser les haies tranquilles', text: 'Les oiseaux nichent maintenant. Évite de tailler les haies jusqu’à la fin de l’été.' },
        { title: 'Aider les crapauds', text: 'Rouler lentement près des passages de crapauds et soutenir les barrières.' },
      ],
    },
    summer: {
      name: 'L’été en Europe centrale',
      event: 'Action d’été : découvre une libellule',
      phenomena: [
        { title: 'Les vers luisants brillent', text: 'Par les chaudes nuits de juin, les lampyres s’illuminent. Les mâles volent, les femelles brillent au sol.', where: 'Lisières, à la nuit tombée' },
        { title: 'Les martinets chassent', text: 'Avec des cris stridents, ils filent au-dessus des toits. Ils dorment même en vol et repartent début août.', where: 'Au-dessus des villes, le soir' },
        { title: 'Libellules à la mare', text: 'L’aeschne bleue patrouille au-dessus des mares et attrape de petits insectes en vol.', where: 'Mares et ruisseaux, au soleil' },
        { title: 'Jeunes grenouilles', text: 'Les têtards deviennent de minuscules grenouilles qui quittent l’eau pour explorer la terre.', where: 'Berges et prairies humides' },
      ],
      help: [
        { title: 'Installer un abreuvoir', text: 'Une coupelle d’eau avec quelques pierres pour se poser aide les abeilles par forte chaleur.' },
        { title: 'Laisser un coin sauvage', text: 'Ne pas tondre un bout de prairie : des fleurs pour les insectes, des abris pour les petits animaux.' },
        { title: 'Éteins la lumière', text: 'Moins d’éclairage extérieur protège les insectes nocturnes et les chauves-souris.' },
        { title: 'Pas de poison au jardin', text: 'Sans pesticides, coccinelles, hérissons et oiseaux restent en bonne santé.' },
      ],
    },
    autumn: {
      name: 'L’automne en Europe centrale',
      event: 'Automne des hérissons : trouve un hérisson',
      phenomena: [
        { title: 'Les grues migrent', text: 'Elles partent vers le sud en grands V. Écoute leurs cris trompetants dans le ciel.', where: 'Dans le ciel, matin et soir' },
        { title: 'Le brame du cerf', text: 'Jusqu’à mi-octobre, les cerfs brament pour impressionner leurs rivaux. Observe de très loin.', where: 'Lisières au crépuscule' },
        { title: 'Les hérissons font des réserves', text: 'Ils ont besoin d’énergie avant l’hibernation. Un tas de feuilles au jardin est un abri parfait.', where: 'Haies et jardins, le soir' },
        { title: 'La saison des toiles', text: 'Les toiles sont au plus grand. Les matins brumeux, elles brillent de rosée.', where: 'Clôtures et haies, tôt le matin' },
      ],
      help: [
        { title: 'Laisse les feuilles', text: 'Hérissons, scarabées et araignées hivernent sous les feuilles. Laisse un coin tranquille.' },
        { title: 'Garde les tiges', text: 'Les abeilles sauvages hivernent dans les tiges creuses. Taille seulement au printemps.' },
        { title: 'Bien aider les hérissons', text: 'Ne donne jamais de lait, il les rend malades. Une coupelle d’eau aide davantage.' },
        { title: 'Éteins la lumière', text: 'Moins d’éclairage extérieur protège les insectes nocturnes et les chauves-souris.' },
      ],
    },
    winter: {
      name: 'L’hiver en Europe centrale',
      event: 'Action d’hiver : découvre une mésange charbonnière',
      phenomena: [
        { title: 'Visiteurs à la mangeoire', text: 'Mésanges charbonnières, mésanges bleues et rouges-gorges s’observent particulièrement bien maintenant.', where: 'Jardins et balcons, en journée' },
        { title: 'Traces dans la neige', text: 'Les renards sont très actifs pendant leur saison des amours. Dans la neige, leurs traces s’alignent comme sur un fil.', where: 'Bords des champs et chemins forestiers' },
        { title: 'Canards sur le lac', text: 'Les colverts et de nombreux visiteurs du Nord se rassemblent sur les eaux non gelées.', where: 'Lacs et rivières' },
        { title: 'Les écureuils restent éveillés', text: 'Les écureuils n’hibernent pas. Ils cherchent les noix cachées en automne.', where: 'Parcs et forêts' },
      ],
      help: [
        { title: 'Bien nourrir les oiseaux', text: 'Graines de tournesol et boules de graisse sans filet, pas de pain. Garde la mangeoire propre.' },
        { title: 'Ne pas déranger les dormeurs', text: 'Laisse les tas de feuilles et de branches tranquilles, des hérissons y dorment.' },
        { title: 'De l’eau non gelée', text: 'Une coupelle d’eau fraîche aide les oiseaux quand il gèle.' },
        { title: 'Nettoyer les nichoirs', text: 'Retire les vieux nids avant fin février pour que les oiseaux puissent nicher au printemps.' },
      ],
    },
  },
  es: {
    spring: {
      name: 'Primavera en Europa central',
      event: 'Acción de primavera: descubre un mirlo',
      phenomena: [
        { title: 'Los sapos migran', text: 'En noches templadas y húmedas, los sapos comunes van a sus charcas, a menudo cruzando carreteras. Muchos voluntarios les ayudan a pasar.', where: 'Charcas y caminos del bosque, al anochecer' },
        { title: 'Concierto al amanecer', text: 'Antes de que salga el sol, mirlos, petirrojos y carboneros cantan para marcar su territorio.', where: 'Jardines y parques, temprano' },
        { title: 'Primeras mariposas', text: 'La mariposa limonera pasa el invierno como adulta, por eso es de las primeras del año.', where: 'Bordes del bosque en días de sol' },
        { title: 'Vuelven las cigüeñas', text: 'Tras el invierno en África o España, las cigüeñas blancas ocupan de nuevo sus nidos en tejados y postes.', where: 'Pueblos y prados húmedos' },
      ],
      help: [
        { title: 'Colgar una caja nido', text: 'Mejor ya en marzo, en un lugar tranquilo y sin sol directo.' },
        { title: 'Dejar florecer los dientes de león', text: 'Las primeras flores son el primer alimento de abejas silvestres y abejorros.' },
        { title: 'No tocar los setos', text: 'Ahora anidan las aves. Evita podar los setos hasta el final del verano.' },
        { title: 'Ayudar a los sapos', text: 'Conducir despacio cerca de los pasos de sapos y apoyar las vallas de protección.' },
      ],
    },
    summer: {
      name: 'Verano en Europa central',
      event: 'Acción de verano: descubre una libélula',
      phenomena: [
        { title: 'Brillan las luciérnagas', text: 'En las noches cálidas de junio se encienden las luciérnagas. Los machos vuelan, las hembras brillan en el suelo.', where: 'Bordes del bosque, al oscurecer' },
        { title: 'Los vencejos cazan', text: 'Con chillidos agudos pasan rozando los tejados. Incluso duermen volando y se marchan a principios de agosto.', where: 'Sobre las ciudades, al atardecer' },
        { title: 'Libélulas en el estanque', text: 'La libélula azul patrulla los estanques del jardín y caza pequeños insectos al vuelo.', where: 'Estanques y arroyos, con sol' },
        { title: 'Ranitas jóvenes', text: 'Los renacuajos se convierten en ranas diminutas que salen del agua a explorar la tierra.', where: 'Orillas y prados húmedos' },
      ],
      help: [
        { title: 'Poner un bebedero', text: 'Un plato llano con agua y unas piedras para posarse ayuda a las abejas cuando hace calor.' },
        { title: 'Dejar un rincón salvaje', text: 'No segar un trozo de prado: flores para insectos, refugio para animales pequeños.' },
        { title: 'Apaga la luz', text: 'Menos luz exterior protege a los insectos nocturnos y a los murciélagos.' },
        { title: 'Nada de venenos', text: 'Sin pesticidas, mariquitas, erizos y aves se mantienen sanos.' },
      ],
    },
    autumn: {
      name: 'Otoño en Europa central',
      event: 'Otoño del erizo: encuentra un erizo',
      phenomena: [
        { title: 'Las grullas migran', text: 'Vuelan al sur en grandes formaciones en V. Escucha sus llamadas como trompetas.', where: 'En el cielo, mañana y tarde' },
        { title: 'La berrea del ciervo', text: 'Hasta mediados de octubre los ciervos braman para impresionar a sus rivales. Observa solo desde lejos.', where: 'Bordes del bosque al anochecer' },
        { title: 'Los erizos comen mucho', text: 'Necesitan energía antes de hibernar. Un montón de hojas en el jardín es un refugio perfecto.', where: 'Setos y jardines, al anochecer' },
        { title: 'Temporada de telarañas', text: 'Las telas son ahora más grandes. En mañanas de niebla brillan con rocío.', where: 'Vallas y setos, temprano' },
      ],
      help: [
        { title: 'Deja las hojas', text: 'Erizos, escarabajos y arañas pasan el invierno bajo las hojas. Deja un rincón sin limpiar.' },
        { title: 'Deja los tallos', text: 'Las abejas silvestres invernan en tallos huecos. Poda solo en primavera.' },
        { title: 'Ayuda bien a los erizos', text: 'Nunca les des leche, les enferma. Un plato llano con agua ayuda más.' },
        { title: 'Apaga la luz', text: 'Menos luz exterior protege a los insectos nocturnos y a los murciélagos.' },
      ],
    },
    winter: {
      name: 'Invierno en Europa central',
      event: 'Acción de invierno: descubre un carbonero común',
      phenomena: [
        { title: 'Visitas al comedero', text: 'Carboneros, herrerillos y petirrojos se observan ahora especialmente bien.', where: 'Jardines y balcones, de día' },
        { title: 'Huellas en la nieve', text: 'Los zorros están muy activos en su época de celo. En la nieve sus huellas van en fila como en un hilo.', where: 'Bordes de campos y caminos del bosque' },
        { title: 'Patos en el lago', text: 'Ánades reales y muchos visitantes del norte se reúnen en aguas sin hielo.', where: 'Lagos y ríos' },
        { title: 'Las ardillas no duermen', text: 'Las ardillas no hibernan. Buscan las nueces que escondieron en otoño.', where: 'Parques y bosques' },
      ],
      help: [
        { title: 'Alimentar bien a las aves', text: 'Pipas de girasol y bolas de sebo sin red, nada de pan. Mantén limpio el comedero.' },
        { title: 'No molestar a los dormilones', text: 'No toques ahora los montones de hojas y ramas: dentro duermen erizos.' },
        { title: 'Agua sin hielo', text: 'Un plato llano con agua fresca ayuda a las aves cuando hiela.' },
        { title: 'Limpiar las cajas nido', text: 'Quita los nidos viejos antes de finales de febrero para que puedan criar en primavera.' },
      ],
    },
  },
};

export type Phenomenon = { icon: GroupId; title: string; sci: string; text: string; where: string };
export type Season = {
  id: SeasonId;
  name: string;
  event: { title: string; icon: GroupId; match: string[] };
  phenomena: Phenomenon[];
  help: { title: string; text: string }[];
};

// Wissenschaftliche Namen der vier Saison-Tiere einer Jahreszeit (für das Abzeichen "Saison komplett")
export function seasonAnimals(id: SeasonId): string[] {
  return BASE[id].sci;
}

export function seasonId(date: Date): SeasonId {
  const m = date.getMonth(); // 0 = Januar
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 10) return 'autumn';
  return 'winter';
}

export function seasonFor(date: Date, lang: Lang): Season {
  const id = seasonId(date);
  const base = BASE[id];
  const text = TEXTS[lang][id];
  return {
    id,
    name: text.name,
    event: { title: text.event, icon: base.eventIcon, match: base.eventMatch },
    phenomena: text.phenomena.map((p, i) => ({ ...p, icon: base.icons[i], sci: base.sci[i] })),
    help: text.help,
  };
}
