import { Lang } from './i18n';
import { SeasonId } from './season';

// Natur-Tipps für die wöchentliche Mitteilung, abwechselnd:
// - find: wo man gerade ein Tier findet, das man wirklich fotografieren kann (Garten, Park, Teich)
// - protect: wie man Tieren hilft
// Je Jahreszeit 7 + 7, damit sich innerhalb eines Jahres nichts wiederholt (eine Jahreszeit hat ~13 Sonntage).
// Ton: freundlich, mit Augenzwinkern – soll ein Lächeln machen, nicht belehren.

export type Tip = { title: string; text: string };
type SeasonTips = { find: Tip[]; protect: Tip[] };

// Manche Tipps passen nur in bestimmte Monate (1 = Januar).
// Schlüssel: Jahreszeit.Art.Nummer in den Listen unten (gilt für alle Sprachen).
export const TIP_MONTHS: Record<string, number[]> = {
  'spring.protect.5': [3, 4], // Krötenwanderung
  'autumn.find.2': [9, 10], // Igel futtern (im November schlafen die meisten)
  'autumn.protect.4': [10, 11], // zu kleiner Igel
};

export const TIPS: Record<Lang, Record<SeasonId, SeasonTips>> = {
  de: {
    spring: {
      find: [
        { title: '🐦 Die Amsel hat einen Plattenvertrag', text: 'Jedenfalls singt sie jeden Morgen so. Such den Sänger ganz oben auf Antennen und Dachrinnen – und knips ihn!' },
        { title: '🐞 Sonnenbad nach dem Winterschlaf', text: 'Marienkäfer müssen erst mal auftanken. Schau mittags an warmen Mauern und Zaunpfählen – oft sitzen gleich mehrere beisammen.' },
        { title: '🐝 Königin auf Wohnungssuche', text: 'Die dicken Hummeln im Frühling sind Königinnen und suchen ein Nest. Sie brummen langsam und tief über den Boden – perfekt für ein Foto.' },
        { title: '🦋 Gelb wie eine Zitrone', text: 'Der Zitronenfalter ist oft der erste Schmetterling des Jahres. An sonnigen Tagen flattert er durch Gärten und Waldränder – kaum zu übersehen.' },
        { title: '🐸 Kaulquappen-Kindergarten', text: 'In Teichen wimmelt es jetzt von Kaulquappen. Halt dein Handy flach übers Wasser – vielleicht erwischst du die ganze Krabbelgruppe.' },
        { title: '🐌 Schnecken auf Ausflug', text: 'Nach einem Frühlingsregen gehen Schnecken auf Tour. Manche Weinbergschnecke ist über 20 Jahre alt – vielleicht fotografierst du einen echten Opa.' },
        { title: '🦆 Gänsemarsch – aber mit Enten', text: 'Ab April watscheln Entenküken hinter ihrer Mama her. Schau an Teichen und Flüssen im Park – Niedlichkeits-Alarm garantiert.' },
      ],
      protect: [
        { title: '🐝 Energieriegel für Hummeln', text: 'Liegt eine Hummel erschöpft am Boden? Ein Tropfen Zuckerwasser auf einem Löffel bringt sie wieder in Schwung. Bitte keinen Honig!' },
        { title: '🌼 Ein Sterne-Restaurant für Bienen', text: 'So sehen Wildbienen eine Löwenzahnwiese. Lass ruhig ein Stück blühen – die perfekte Ausrede, weniger Rasen zu mähen.' },
        { title: '🐣 Kein Grund zur Sorge', text: 'Junge Vögel mit Federn, die am Boden herumhüpfen, sind nicht verlassen – Mama und Papa füttern weiter. Einfach in Ruhe lassen und weitergehen.' },
        { title: '🌿 Psst, hier wird gebrütet', text: 'In Hecken sitzen jetzt Vogeleltern auf ihren Eiern. Große Schnitte warten bis Oktober – von März bis September ist das sogar Gesetz.' },
        { title: '🪵 Ein Hotel für Wildbienen', text: 'Bohr Löcher (3–8 mm) in ein Stück Hartholz und häng es in die Sonne. Wildbienen stechen fast nie – du kannst ihnen beim Einziehen zusehen.' },
        { title: '🐸 Achtung, Krötenwanderung', text: 'Im Frühling wandern Kröten nachts zu ihren Teichen, oft über Straßen. Wer abends an Teichen vorbeifährt: bitte langsam, da hüpft vielleicht jemand.' },
        { title: '🏠 Traumwohnung für Meisen', text: 'Ein Nistkasten am Balkon oder Baum ist für Meisen ein echter Glücksfall. In 2–3 Metern Höhe aufhängen, nicht in die pralle Sonne.' },
      ],
    },
    summer: {
      find: [
        { title: '🪽 Die Libelle hat einen Lieblingsplatz', text: 'Libellen landen immer wieder auf demselben Halm. Warte am Teich einfach daneben – sie kommt bestimmt zurück. Klick!' },
        { title: '🦋 Rushhour am Sommerflieder', text: 'Tagpfauenauge und Admiral lieben Sommerflieder. Steht irgendwo einer? Ein paar Minuten warten – da ist gleich Schmetterlings-Stau.' },
        { title: '🐝 Bienen in Pluderhosen', text: 'Bienen packen Blütenstaub in kleine „Höschen“ an ihren Hinterbeinen. Schau an Blüten genau hin – manche schleppen richtig dicke gelbe Pakete.' },
        { title: '🦗 Hüpfende Überraschung', text: 'Auf ungemähten Wiesen springen bei jedem Schritt Heuschrecken davon. Merk dir, wo eine landet – danach hält sie oft schön still.' },
        { title: '🦎 Sonnenbank für Eidechsen', text: 'Eidechsen wärmen sich morgens auf Steinen und Mauern. Schleich dich langsam an und lass deinen Schatten nicht auf sie fallen.' },
        { title: '🐞 Maskenball unter der Linde', text: 'Rot-schwarze Feuerwanzen sitzen oft zu Dutzenden am Fuß von Linden. Sie sehen aus wie kleine Masken – und halten super still fürs Foto.' },
        { title: '🐦 Spatzen im Wellnessbad', text: 'Spatzen baden gern im Staub – das hilft gegen lästige Federläuse. Schau auf sandigen Wegen nach kleinen Kuhlen und flatternden Staubwölkchen.' },
      ],
      protect: [
        { title: '💧 Die Bienen-Bar hat geöffnet', text: 'Bei Hitze haben auch Bienen Durst. Eine flache Schale Wasser mit ein paar Steinen als Landeplatz – fertig ist die beliebteste Bar im Garten.' },
        { title: '💡 Feierabend für Nachtfalter', text: 'Gartenlampen locken nachts Insekten an, die dann bis zur Erschöpfung kreisen. Licht aus heißt für sie: endlich Ruhe.' },
        { title: '🌾 Die wilde Ecke', text: 'Lass ein kleines Stück Rasen einfach wachsen. Nach ein paar Wochen ist dort mehr los als auf einem Stadtfest – nur leiser.' },
        { title: '🦔 Eine Rampe kann Leben retten', text: 'Igel und Frösche fallen manchmal in Pools oder Regentonnen und kommen nicht mehr heraus. Ein schräges Brett als Ausstieg hilft.' },
        { title: '🫙 Rettungsaktion Hummel', text: 'Hummel im Zimmer verirrt? Glas drüber, Postkarte drunter, draußen freilassen. Rettung erfolgreich – ganz ohne Stich.' },
        { title: '🐦 Freibad für Vögel', text: 'Auch Vögel brauchen im Sommer Wasser zum Trinken und Planschen. Eine flache Schale reicht – und du hast ein Freibad mit Showprogramm.' },
        { title: '🐞 Die besten Gärtner arbeiten umsonst', text: 'Ein Marienkäfer frisst bis zu 50 Blattläuse am Tag. Ohne Spritzmittel im Garten bleiben deine kleinen Helfer gesund.' },
      ],
    },
    autumn: {
      find: [
        { title: '🕸️ Schmuck aus Tau', text: 'An nebligen Morgen glitzern Spinnennetze wie Ketten aus Perlen. Kreuzspinnen sitzen oft genau in der Mitte – der schönste Fotomoment des Herbstes!' },
        { title: '🐿️ Die vergesslichsten Gärtner der Welt', text: 'Eichhörnchen verstecken jetzt tausende Nüsse – und vergessen viele. So pflanzen sie aus Versehen Bäume. Im Park sind sie gerade superfleißig.' },
        { title: '🦔 Schmatzen im Laub', text: 'Igel futtern sich jetzt Winterspeck an. Raschelt und schmatzt es abends unter der Hecke? Leise hinschauen – vielleicht ist es einer!' },
        { title: '🐦 Dein Fotomodell kommt von selbst', text: 'Rotkehlchen sind neugierig: Wenn du im Garten Laub harkst, hüpfen sie oft heran und suchen Würmer. Handy bereithalten!' },
        { title: '🦆 Großes Treffen am See', text: 'Auf Seen und Flüssen sammeln sich jetzt Enten und Gänse. Im Park kommst du ihnen nah – nur bitte kein Brot mitbringen.' },
        { title: '🐞 Marienkäfer ziehen um', text: 'An sonnigen Herbsttagen suchen Marienkäfer ein Winterquartier und sammeln sich an hellen Hauswänden und Fensterrahmen. Schau mal nach!' },
        { title: '🪵 Wer wohnt unter dem Holz?', text: 'Dreh im Wald vorsichtig ein Stück Totholz um: Asseln, Käfer und Tausendfüßer! Nach dem Foto bitte genau so zurücklegen – ist ja ihr Haus.' },
      ],
      protect: [
        { title: '🍂 Hotel mit Vollpension', text: 'Ein Laubhaufen in der Gartenecke ist ein Winterquartier für Igel, Käfer und Kröten. Einfach bis April liegen lassen – weniger Arbeit für dich!' },
        { title: '🥛 Igel mögen keine Milch', text: 'Sie bekommen davon Bauchweh. Wenn du helfen willst: eine flache Schale Wasser und etwas Katzenfutter.' },
        { title: '🌱 Stängel stehen lassen', text: 'In hohlen Pflanzenstängeln überwintern Wildbienen. Verblühte Stauden also stehen lassen – sieht im Raureif sogar richtig schick aus.' },
        { title: '🍁 Rechen statt Laubbläser', text: 'Laubbläser pusten auch Käfer, Spinnen und kleine Tiere durch die Gegend. Ein Rechen ist leiser – und für die Tiere viel netter.' },
        { title: '🦔 Ein Igel, zu klein für den Winter?', text: 'Ein sehr kleiner Igel, der im November noch tagsüber herumläuft, braucht oft Hilfe. Ruf eine Igelstation an, bevor du ihn mitnimmst.' },
        { title: '🪟 Vögel sehen den Himmel im Fenster', text: 'Und fliegen dagegen. Aufkleber oder Streifen außen am Glas helfen – je dichter, desto besser.' },
        { title: '🍎 Obstfest für Amseln', text: 'Lass ein paar Äpfel unter dem Baum liegen. Amseln, Drosseln und Schmetterlinge feiern damit ein kleines Herbstfest.' },
      ],
    },
    winter: {
      find: [
        { title: '🐦 Zehn Minuten Geduld', text: 'Setz dich ruhig ans Fenster beim Futterhaus. Nach etwa zehn Minuten haben die Meisen dich vergessen – und du bekommst Fotos aus nächster Nähe.' },
        { title: '🐾 Detektiv im Schnee', text: 'Nach frischem Schnee steht im Garten, wer nachts da war: Vögel, Katzen, vielleicht ein Eichhörnchen? Folge einer Spur – wer steckt dahinter?' },
        { title: '🦆 Warme Füße auf dem Eis', text: 'Enten stehen auf dem Eis, ohne zu frieren – ein cleverer Blutkreislauf hält ihre Füße warm. An eisfreien Stellen im Park sammeln sie sich jetzt.' },
        { title: '🐿️ Schnee auf der Nase', text: 'Eichhörnchen halten keinen Winterschlaf. An sonnigen Tagen graben sie im Park ihre Nüsse aus – oft mit Schnee auf der Nase.' },
        { title: '🎶 Ein Sänger im Winter', text: 'Das Rotkehlchen singt sogar bei Frost. Folge dem Gesang – oft sitzt es ganz offen auf einem Zweig und plustert sich zur runden Kugel auf.' },
        { title: '🐦‍⬛ Kluge Köpfe', text: 'Krähen und Elstern gehören zu den klügsten Vögeln und erkennen sogar Gesichter wieder. Sei also nett zu ihnen – und mach ein Porträt!' },
        { title: '🦢 Teenager am Teich', text: 'Am Wasser ist im Winter viel los: Schwäne, Möwen, Blässhühner. Möwen mit braunen Flecken sind übrigens Jugendliche.' },
      ],
      protect: [
        { title: '🍞 Brot macht Bauchweh', text: 'Brot quillt im Bauch von Enten und Vögeln auf. Besser: Haferflocken, Sonnenblumenkerne oder Meisenknödel ohne Netz.' },
        { title: '💧 Held im Vogelviertel', text: 'Wenn alles gefroren ist, finden Vögel kaum Wasser. Eine flache Schale mit frischem Wasser – und du bist der Held der Nachbarschaft.' },
        { title: '😴 Psst, hier schläft jemand', text: 'Igel schlafen jetzt tief in Laub- und Reisighaufen. Aufwachen kostet sie viel Kraft – also Haufen bitte in Ruhe lassen.' },
        { title: '🏠 Wohnung frei für neue Mieter', text: 'Bis Ende Februar alte Nester aus Nistkästen räumen – darin wohnen oft Flöhe. Danach ist alles bereit für die nächste Vogelfamilie.' },
        { title: '🧼 Bitte nicht ins Essen setzen', text: 'An schmutzigem Futter stecken sich Vögel gegenseitig an. Futtersäulen sind besser als offene Häuschen – da sitzt niemand im Essen.' },
        { title: '🌲 Leise durch den Winterwald', text: 'Waldtiere sparen im Winter jede Kraft. Wer auf den Wegen bleibt und den Hund an der Leine führt, erspart ihnen anstrengende Fluchten.' },
        { title: '🍎 Gute-Laune-Apfel', text: 'Amseln lieben im Winter halbierte Äpfel. Leg ein paar in eine geschützte Gartenecke – gute Laune für dich und die Amseln.' },
      ],
    },
  },
  en: {
    spring: {
      find: [
        { title: '🐦 The blackbird has a record deal', text: 'At least it sings like it every morning. Look for the singer on top of aerials and gutters – and snap it!' },
        { title: '🐞 Sunbathing after winter', text: 'Ladybirds need to recharge first. Check warm walls and fence posts around midday – often several sit together.' },
        { title: '🐝 A queen house-hunting', text: 'The big bumblebees in spring are queens looking for a nest. They buzz slowly and low over the ground – perfect for a photo.' },
        { title: '🦋 Yellow as a lemon', text: 'The brimstone is often the first butterfly of the year. On sunny days it flutters through gardens and forest edges – hard to miss.' },
        { title: '🐸 Tadpole nursery', text: 'Ponds are teeming with tadpoles now. Hold your phone flat above the water – maybe you’ll catch the whole playgroup.' },
        { title: '🐌 Snails on an outing', text: 'After a spring shower, snails go on tour. Some Roman snails are over 20 years old – you might be photographing a real grandpa.' },
        { title: '🦆 Single file, duck style', text: 'From April, ducklings waddle after their mum. Look at ponds and rivers in the park – cuteness alert guaranteed.' },
      ],
      protect: [
        { title: '🐝 An energy bar for bumblebees', text: 'Exhausted bumblebee on the ground? A drop of sugar water on a spoon gets it going again. Please no honey!' },
        { title: '🌼 A gourmet restaurant for bees', text: 'That’s how wild bees see a dandelion meadow. Let a patch bloom – the perfect excuse to mow less.' },
        { title: '🐣 No need to worry', text: 'Feathered young birds hopping on the ground aren’t abandoned – mum and dad keep feeding them. Just leave them be and walk on.' },
        { title: '🌿 Shh, nesting in progress', text: 'Bird parents are sitting on their eggs in hedges now. Save big trims for autumn.' },
        { title: '🪵 A hotel for wild bees', text: 'Drill holes (3–8 mm) into a piece of hardwood and hang it in the sun. Wild bees almost never sting – you can watch them move in.' },
        { title: '🐸 Toads crossing', text: 'In spring, toads walk to their ponds at night, often across roads. Driving past ponds in the evening? Slowly, please – someone might be hopping.' },
        { title: '🏠 A dream home for tits', text: 'A nest box on a balcony or tree is a real stroke of luck for tits. Hang it 2–3 metres high, out of the blazing sun.' },
      ],
    },
    summer: {
      find: [
        { title: '🪽 The dragonfly has a favourite spot', text: 'Dragonflies land on the same stem again and again. Just wait next to it at the pond – it will be back. Click!' },
        { title: '🦋 Rush hour at the butterfly bush', text: 'Peacock butterflies and red admirals love buddleia. See one somewhere? Wait a few minutes – there’ll be a butterfly traffic jam.' },
        { title: '🐝 Bees in baggy trousers', text: 'Bees pack pollen into little “trousers” on their hind legs. Look closely at flowers – some carry really big yellow parcels.' },
        { title: '🦗 A hopping surprise', text: 'In unmown meadows, grasshoppers jump away with every step. Watch where one lands – afterwards it often sits nice and still.' },
        { title: '🦎 A sunbed for lizards', text: 'Lizards warm up on stones and walls in the morning. Sneak up slowly and don’t let your shadow fall on them.' },
        { title: '🐞 Masked ball under the lime tree', text: 'Red-and-black firebugs often sit by the dozen at the foot of lime trees. They look like tiny masks – and keep very still for photos.' },
        { title: '🐦 Sparrows at the spa', text: 'Sparrows love a dust bath – it helps against pesky feather lice. Look for little hollows and puffs of dust on sandy paths.' },
      ],
      protect: [
        { title: '💧 The bee bar is open', text: 'Bees get thirsty in the heat too. A shallow dish of water with a few stones to land on – the most popular bar in the garden.' },
        { title: '💡 Closing time for moths', text: 'Garden lights attract insects at night, which then circle until exhausted. Lights off means: finally some peace.' },
        { title: '🌾 The wild corner', text: 'Let a small patch of lawn just grow. After a few weeks there’s more going on there than at a street party – only quieter.' },
        { title: '🦔 A ramp can save lives', text: 'Hedgehogs and frogs sometimes fall into pools or water butts and can’t get out. A sloping board as a way out helps.' },
        { title: '🫙 Operation bumblebee', text: 'Bumblebee lost in your room? Glass over it, postcard under it, set it free outside. Rescue complete – no sting.' },
        { title: '🐦 A pool party for birds', text: 'Birds need water to drink and splash in summer too. A shallow dish is enough – and you get a pool with a show.' },
        { title: '🐞 The best gardeners work for free', text: 'A ladybird eats up to 50 aphids a day. Without pesticides in the garden, your little helpers stay healthy.' },
      ],
    },
    autumn: {
      find: [
        { title: '🕸️ Jewellery made of dew', text: 'On foggy mornings, spider webs sparkle like strings of pearls. Garden spiders often sit right in the middle – the best photo moment of autumn!' },
        { title: '🐿️ The most forgetful gardeners', text: 'Squirrels are hiding thousands of nuts now – and forget many. That’s how they plant trees by accident. They’re super busy in parks.' },
        { title: '🦔 Munching in the leaves', text: 'Hedgehogs are eating their winter fat now. Rustling and munching under the hedge in the evening? Take a quiet look – maybe it’s one!' },
        { title: '🐦 Your model comes by itself', text: 'Robins are curious: when you rake leaves, they often hop over looking for worms. Keep your phone ready!' },
        { title: '🦆 Big meeting at the lake', text: 'Ducks and geese gather on lakes and rivers now. In the park you can get close – just please don’t bring bread.' },
        { title: '🐞 Ladybirds on the move', text: 'On sunny autumn days, ladybirds look for winter quarters and gather on bright house walls and window frames. Take a look!' },
        { title: '🪵 Who lives under the log?', text: 'Carefully turn over a piece of dead wood in the forest: woodlice, beetles and millipedes! After your photo, put it back exactly – it’s their home.' },
      ],
      protect: [
        { title: '🍂 A hotel with full board', text: 'A pile of leaves in a garden corner is winter quarters for hedgehogs, beetles and toads. Leave it until April – less work for you!' },
        { title: '🥛 Hedgehogs don’t like milk', text: 'It gives them a tummy ache. If you want to help: a shallow dish of water and some cat food.' },
        { title: '🌱 Leave the stems standing', text: 'Wild bees spend the winter in hollow plant stems. So leave faded plants standing – they even look great with frost on them.' },
        { title: '🍁 Rake, not leaf blower', text: 'Leaf blowers blast beetles, spiders and small animals around too. A rake is quieter – and much kinder to them.' },
        { title: '🦔 Too small for winter?', text: 'A very small hedgehog still walking around in daylight in November often needs help. Call a hedgehog rescue before taking it in.' },
        { title: '🪟 Birds see the sky in windows', text: 'And fly into them. Stickers or strips on the outside of the glass help – the closer together, the better.' },
        { title: '🍎 A fruit party for blackbirds', text: 'Leave a few apples under the tree. Blackbirds, thrushes and butterflies will throw a little autumn party.' },
      ],
    },
    winter: {
      find: [
        { title: '🐦 Ten minutes of patience', text: 'Sit quietly by the window near the bird feeder. After about ten minutes the tits forget you’re there – and you get close-up photos.' },
        { title: '🐾 Detective in the snow', text: 'After fresh snow, the garden shows who visited at night: birds, cats, maybe a squirrel? Follow a trail – who’s behind it?' },
        { title: '🦆 Warm feet on the ice', text: 'Ducks stand on ice without freezing – clever blood circulation keeps their feet warm. They gather on ice-free spots in the park now.' },
        { title: '🐿️ Snow on the nose', text: 'Squirrels don’t hibernate. On sunny days they dig up their nuts in the park – often with snow on their nose.' },
        { title: '🎶 A winter singer', text: 'The robin sings even in frost. Follow the song – it often sits in the open on a twig, puffed up into a round ball.' },
        { title: '🐦‍⬛ Clever heads', text: 'Crows and magpies are among the cleverest birds and even recognise faces. So be nice to them – and take a portrait!' },
        { title: '🦢 Teenagers at the pond', text: 'There’s a lot going on at the water in winter: swans, gulls, coots. By the way, gulls with brown spots are teenagers.' },
      ],
      protect: [
        { title: '🍞 Bread gives tummy ache', text: 'Bread swells in the stomachs of ducks and birds. Better: oats, sunflower seeds or fat balls without nets.' },
        { title: '💧 Hero of the bird street', text: 'When everything is frozen, birds can hardly find water. A shallow dish of fresh water – and you’re the hero of the neighbourhood.' },
        { title: '😴 Shh, someone’s sleeping', text: 'Hedgehogs are fast asleep in piles of leaves and twigs. Waking up costs them a lot of energy – so please leave the piles alone.' },
        { title: '🏠 Vacancy for new tenants', text: 'Clear old nests out of nest boxes by the end of February – they’re often full of fleas. Then all is ready for the next bird family.' },
        { title: '🧼 Please don’t sit in the food', text: 'Birds infect each other through dirty food. Feeder tubes are better than open bird tables – nobody sits in the food.' },
        { title: '🌲 Quietly through the winter woods', text: 'Forest animals save every bit of energy in winter. Staying on paths with your dog on a lead spares them exhausting escapes.' },
        { title: '🍎 A good-mood apple', text: 'Blackbirds love halved apples in winter. Put a few in a sheltered corner of the garden – good mood for you and the blackbirds.' },
      ],
    },
  },
  fr: {
    spring: {
      find: [
        { title: '🐦 Le merle a signé un contrat', text: 'En tout cas, il chante comme une star chaque matin. Cherche le chanteur en haut des antennes et des gouttières – et prends-le en photo !' },
        { title: '🐞 Bain de soleil après l’hiver', text: 'Les coccinelles doivent d’abord recharger leurs batteries. Regarde vers midi sur les murs et piquets chauds – souvent, elles sont plusieurs.' },
        { title: '🐝 Reine cherche logement', text: 'Les gros bourdons du printemps sont des reines qui cherchent un nid. Ils volent lentement, près du sol – parfait pour une photo.' },
        { title: '🦋 Jaune comme un citron', text: 'Le citron est souvent le premier papillon de l’année. Les jours de soleil, il volette dans les jardins et en lisière – impossible de le rater.' },
        { title: '🐸 La crèche des têtards', text: 'Les mares grouillent de têtards. Tiens ton téléphone bien à plat au-dessus de l’eau – tu attraperas peut-être toute la crèche.' },
        { title: '🐌 Les escargots en balade', text: 'Après une pluie de printemps, les escargots partent en tournée. Certains ont plus de 20 ans – tu photographies peut-être un vrai papy.' },
        { title: '🦆 En file indienne', text: 'Dès avril, les canetons se dandinent derrière leur maman. Regarde près des mares et rivières du parc – alerte mignonnerie garantie.' },
      ],
      protect: [
        { title: '🐝 Une barre énergétique pour bourdons', text: 'Un bourdon épuisé au sol ? Une goutte d’eau sucrée sur une cuillère le remet en forme. Pas de miel, s’il te plaît !' },
        { title: '🌼 Un restaurant étoilé pour abeilles', text: 'C’est ainsi que les abeilles sauvages voient un pré de pissenlits. Laisse fleurir un coin – l’excuse parfaite pour moins tondre.' },
        { title: '🐣 Pas de panique', text: 'Les jeunes oiseaux à plumes qui sautillent au sol ne sont pas abandonnés – papa et maman les nourrissent. Laisse-les tranquilles et passe ton chemin.' },
        { title: '🌿 Chut, on couve', text: 'Dans les haies, les parents oiseaux couvent leurs œufs. Garde les grosses tailles pour l’automne.' },
        { title: '🪵 Un hôtel pour abeilles sauvages', text: 'Perce des trous (3–8 mm) dans du bois dur et accroche-le au soleil. Les abeilles sauvages ne piquent presque jamais – regarde-les emménager.' },
        { title: '🐸 Attention, crapauds', text: 'Au printemps, les crapauds rejoignent leurs mares la nuit, souvent en traversant les routes. Le soir près des mares : doucement, quelqu’un saute peut-être.' },
        { title: '🏠 Un logement de rêve pour mésanges', text: 'Un nichoir au balcon ou dans un arbre, c’est le jackpot pour les mésanges. Accroche-le à 2–3 mètres, à l’abri du plein soleil.' },
      ],
    },
    summer: {
      find: [
        { title: '🪽 La libellule a sa place préférée', text: 'Les libellules se posent encore et encore sur la même tige. Attends juste à côté au bord de la mare – elle va revenir. Clic !' },
        { title: '🦋 Heure de pointe au buddleia', text: 'Paons du jour et vulcains adorent le buddleia. Tu en vois un ? Attends quelques minutes – embouteillage de papillons assuré.' },
        { title: '🐝 Des abeilles en culotte bouffante', text: 'Les abeilles rangent le pollen dans de petites « culottes » sur leurs pattes arrière. Regarde bien les fleurs – certaines portent de gros paquets jaunes.' },
        { title: '🦗 Surprise sautillante', text: 'Dans les prés non fauchés, les sauterelles sautent à chaque pas. Repère où l’une atterrit – ensuite, elle reste souvent bien immobile.' },
        { title: '🦎 Transat pour lézards', text: 'Le matin, les lézards se réchauffent sur les pierres et les murets. Approche doucement et ne leur fais pas d’ombre.' },
        { title: '🐞 Bal masqué sous le tilleul', text: 'Les gendarmes rouge et noir se rassemblent par dizaines au pied des tilleuls. On dirait de petits masques – et ils posent sans bouger.' },
        { title: '🐦 Les moineaux au spa', text: 'Les moineaux adorent les bains de poussière – contre les poux des plumes. Cherche de petits creux et des nuages de poussière sur les chemins sablonneux.' },
      ],
      protect: [
        { title: '💧 Le bar à abeilles est ouvert', text: 'Par forte chaleur, les abeilles ont soif aussi. Une coupelle d’eau avec quelques pierres pour se poser – le bar le plus couru du jardin.' },
        { title: '💡 Fin de service pour les papillons de nuit', text: 'La nuit, les lampes du jardin attirent les insectes qui tournent jusqu’à l’épuisement. Éteindre, c’est leur offrir enfin du calme.' },
        { title: '🌾 Le coin sauvage', text: 'Laisse un petit bout de pelouse pousser. Après quelques semaines, il s’y passe plus de choses qu’à une fête de quartier – en plus calme.' },
        { title: '🦔 Une rampe qui sauve des vies', text: 'Hérissons et grenouilles tombent parfois dans les piscines ou récupérateurs d’eau sans pouvoir ressortir. Une planche en pente les aide.' },
        { title: '🫙 Opération bourdon', text: 'Un bourdon perdu dans ta chambre ? Un verre dessus, une carte postale dessous, et dehors. Sauvetage réussi – sans piqûre.' },
        { title: '🐦 Une piscine pour oiseaux', text: 'L’été, les oiseaux ont besoin d’eau pour boire et barboter. Une coupelle suffit – et tu as une piscine avec spectacle.' },
        { title: '🐞 Les meilleurs jardiniers sont bénévoles', text: 'Une coccinelle mange jusqu’à 50 pucerons par jour. Sans pesticides au jardin, tes petits assistants restent en forme.' },
      ],
    },
    autumn: {
      find: [
        { title: '🕸️ Des bijoux de rosée', text: 'Les matins de brouillard, les toiles d’araignée brillent comme des colliers de perles. L’épeire est souvent pile au centre – la plus belle photo de l’automne !' },
        { title: '🐿️ Les jardiniers les plus distraits', text: 'Les écureuils cachent des milliers de noix – et en oublient beaucoup. Ils plantent ainsi des arbres sans le vouloir. Ils sont très actifs dans les parcs.' },
        { title: '🦔 Ça mâche dans les feuilles', text: 'Les hérissons font leurs réserves pour l’hiver. Ça froisse et ça mâche sous la haie le soir ? Regarde en silence – c’en est peut-être un !' },
        { title: '🐦 Ton modèle vient tout seul', text: 'Le rouge-gorge est curieux : quand tu ratisses les feuilles, il s’approche souvent pour chercher des vers. Téléphone prêt !' },
        { title: '🦆 Grand rendez-vous au lac', text: 'Canards et oies se rassemblent sur les lacs et rivières. Au parc, tu peux les approcher – mais sans pain, s’il te plaît.' },
        { title: '🐞 Les coccinelles déménagent', text: 'Les jours d’automne ensoleillés, les coccinelles cherchent un abri et se regroupent sur les murs clairs et les cadres de fenêtres. Jette un œil !' },
        { title: '🪵 Qui habite sous la bûche ?', text: 'En forêt, retourne doucement un morceau de bois mort : cloportes, scarabées et mille-pattes ! Après la photo, remets-le exactement – c’est leur maison.' },
      ],
      protect: [
        { title: '🍂 Un hôtel en pension complète', text: 'Un tas de feuilles dans un coin du jardin abrite hérissons, scarabées et crapauds en hiver. Laisse-le jusqu’en avril – moins de travail pour toi !' },
        { title: '🥛 Les hérissons n’aiment pas le lait', text: 'Ça leur donne mal au ventre. Pour les aider : une coupelle d’eau et un peu de pâtée pour chat.' },
        { title: '🌱 Garde les tiges', text: 'Des abeilles sauvages passent l’hiver dans les tiges creuses. Laisse les plantes fanées debout – avec le givre, c’est même très joli.' },
        { title: '🍁 Le râteau plutôt que le souffleur', text: 'Les souffleurs projettent aussi scarabées, araignées et petites bêtes. Le râteau est plus silencieux – et bien plus gentil.' },
        { title: '🦔 Trop petit pour l’hiver ?', text: 'Un tout petit hérisson qui se promène encore de jour en novembre a souvent besoin d’aide. Appelle un centre de soins avant de l’emporter.' },
        { title: '🪟 Les oiseaux voient le ciel dans les vitres', text: 'Et s’y cognent. Des autocollants ou des bandes à l’extérieur aident – plus ils sont serrés, mieux c’est.' },
        { title: '🍎 Fête des fruits pour les merles', text: 'Laisse quelques pommes sous l’arbre. Merles, grives et papillons vont s’offrir une petite fête d’automne.' },
      ],
    },
    winter: {
      find: [
        { title: '🐦 Dix minutes de patience', text: 'Assieds-toi calmement à la fenêtre près de la mangeoire. Après dix minutes, les mésanges t’oublient – et tu fais des photos de tout près.' },
        { title: '🐾 Détective dans la neige', text: 'Après la neige fraîche, le jardin révèle qui est passé la nuit : oiseaux, chats, peut-être un écureuil ? Suis une trace – qui se cache derrière ?' },
        { title: '🦆 Pieds au chaud sur la glace', text: 'Les canards tiennent sur la glace sans geler grâce à une circulation sanguine astucieuse. Ils se regroupent aux endroits non gelés du parc.' },
        { title: '🐿️ De la neige sur le nez', text: 'Les écureuils n’hibernent pas. Les jours de soleil, ils déterrent leurs noix au parc – souvent avec de la neige sur le nez.' },
        { title: '🎶 Un chanteur d’hiver', text: 'Le rouge-gorge chante même quand il gèle. Suis son chant – il se pose souvent à découvert sur une branche, gonflé comme une boule.' },
        { title: '🐦‍⬛ Têtes bien faites', text: 'Corneilles et pies sont parmi les oiseaux les plus intelligents et reconnaissent même les visages. Sois gentil avec elles – et fais leur portrait !' },
        { title: '🦢 Ados à l’étang', text: 'En hiver, il y a du monde au bord de l’eau : cygnes, mouettes, foulques. Au fait, les mouettes tachetées de brun sont des ados.' },
      ],
      protect: [
        { title: '🍞 Le pain donne mal au ventre', text: 'Le pain gonfle dans l’estomac des canards et des oiseaux. Mieux : flocons d’avoine, graines de tournesol ou boules de graisse sans filet.' },
        { title: '💧 Héros du quartier des oiseaux', text: 'Quand tout est gelé, les oiseaux trouvent à peine de l’eau. Une coupelle d’eau fraîche – et tu deviens le héros du voisinage.' },
        { title: '😴 Chut, quelqu’un dort', text: 'Les hérissons dorment profondément dans les tas de feuilles et de branches. Se réveiller leur coûte beaucoup d’énergie – laisse les tas tranquilles.' },
        { title: '🏠 Logement libre', text: 'Vide les vieux nids des nichoirs avant fin février – ils sont souvent pleins de puces. Tout sera prêt pour la prochaine famille.' },
        { title: '🧼 On ne s’assoit pas dans l’assiette', text: 'Les oiseaux se contaminent par la nourriture sale. Les silos valent mieux que les plateaux ouverts – personne ne marche dans les graines.' },
        { title: '🌲 En silence dans la forêt d’hiver', text: 'En hiver, les animaux de la forêt économisent chaque force. Rester sur les chemins avec le chien en laisse leur évite des fuites épuisantes.' },
        { title: '🍎 La pomme de bonne humeur', text: 'Les merles adorent les demi-pommes en hiver. Pose-en quelques-unes dans un coin abrité – bonne humeur pour toi et pour les merles.' },
      ],
    },
  },
  es: {
    spring: {
      find: [
        { title: '🐦 El mirlo tiene contrato discográfico', text: 'Al menos canta así cada mañana. Busca al cantante en lo alto de antenas y canalones… ¡y hazle una foto!' },
        { title: '🐞 Baño de sol tras el invierno', text: 'Las mariquitas primero tienen que recargar pilas. Mira al mediodía en muros y postes cálidos: a menudo hay varias juntas.' },
        { title: '🐝 Reina busca piso', text: 'Los abejorros grandes de primavera son reinas buscando nido. Vuelan despacio y bajito sobre el suelo: perfectos para una foto.' },
        { title: '🦋 Amarilla como un limón', text: 'La limonera suele ser la primera mariposa del año. En días soleados revolotea por jardines y bordes del bosque: imposible no verla.' },
        { title: '🐸 Guardería de renacuajos', text: 'Las charcas están llenas de renacuajos. Pon el móvil plano sobre el agua: quizá pilles a toda la guardería.' },
        { title: '🐌 Caracoles de excursión', text: 'Tras una lluvia de primavera, los caracoles salen de gira. Algunos tienen más de 20 años: quizá fotografíes a un auténtico abuelo.' },
        { title: '🦆 En fila india', text: 'Desde abril, los patitos caminan detrás de su mamá. Mira en charcas y ríos del parque: alerta de ternura garantizada.' },
      ],
      protect: [
        { title: '🐝 Una barrita energética para abejorros', text: '¿Un abejorro agotado en el suelo? Una gota de agua con azúcar en una cuchara lo pone en marcha otra vez. ¡Nada de miel!' },
        { title: '🌼 Un restaurante con estrellas para abejas', text: 'Así ven las abejas silvestres un prado de dientes de león. Deja florecer un trozo: la excusa perfecta para segar menos.' },
        { title: '🐣 No te preocupes', text: 'Los pollitos con plumas que saltan por el suelo no están abandonados: papá y mamá siguen alimentándolos. Déjalos tranquilos y sigue tu camino.' },
        { title: '🌿 Silencio, se incuba', text: 'En los setos, los padres pájaro están empollando sus huevos. Deja las podas grandes para el otoño.' },
        { title: '🪵 Un hotel para abejas silvestres', text: 'Haz agujeros (3–8 mm) en madera dura y cuélgala al sol. Las abejas silvestres casi nunca pican: podrás verlas mudarse.' },
        { title: '🐸 Atención, sapos cruzando', text: 'En primavera los sapos van de noche a sus charcas, a menudo cruzando carreteras. Si pasas en coche junto a charcas: despacio, alguien puede estar saltando.' },
        { title: '🏠 Un piso de ensueño para carboneros', text: 'Una caja nido en el balcón o en un árbol es una suerte para los carboneros. Cuélgala a 2–3 metros, sin sol directo.' },
      ],
    },
    summer: {
      find: [
        { title: '🪽 La libélula tiene su sitio favorito', text: 'Las libélulas se posan una y otra vez en el mismo tallo. Espera justo al lado en la charca: volverá. ¡Clic!' },
        { title: '🦋 Hora punta en la budleia', text: 'A la mariposa pavo real y a la vulcana les encanta la budleia. ¿Ves una? Espera unos minutos: habrá atasco de mariposas.' },
        { title: '🐝 Abejas con pantalones bombachos', text: 'Las abejas guardan el polen en pequeños «pantalones» en sus patas traseras. Mira bien las flores: algunas llevan paquetes amarillos enormes.' },
        { title: '🦗 Sorpresa saltarina', text: 'En prados sin segar, los saltamontes saltan a cada paso. Fíjate dónde aterriza uno: después suele quedarse muy quieto.' },
        { title: '🦎 Tumbona para lagartijas', text: 'Por la mañana las lagartijas se calientan en piedras y muros. Acércate despacio y no les hagas sombra.' },
        { title: '🐞 Baile de máscaras bajo el tilo', text: 'Las chinches rojas y negras se juntan por decenas al pie de los tilos. Parecen pequeñas máscaras… y posan sin moverse.' },
        { title: '🐦 Gorriones en el spa', text: 'A los gorriones les encantan los baños de polvo: ayudan contra los piojos de las plumas. Busca hoyitos y nubecitas de polvo en caminos de arena.' },
      ],
      protect: [
        { title: '💧 El bar de las abejas abre', text: 'Con calor, las abejas también tienen sed. Un plato llano con agua y unas piedras para posarse: el bar más popular del jardín.' },
        { title: '💡 Hora de cerrar para las polillas', text: 'De noche, las luces del jardín atraen insectos que dan vueltas hasta agotarse. Apagar la luz significa: por fin, tranquilidad.' },
        { title: '🌾 El rincón salvaje', text: 'Deja crecer un trocito de césped. En unas semanas habrá más movimiento que en una fiesta de barrio, pero más silencioso.' },
        { title: '🦔 Una rampa puede salvar vidas', text: 'Erizos y ranas a veces caen en piscinas o bidones y no pueden salir. Una tabla inclinada como salida les ayuda.' },
        { title: '🫙 Operación abejorro', text: '¿Un abejorro perdido en tu cuarto? Vaso encima, postal debajo y a soltarlo fuera. Rescate completado, sin picadura.' },
        { title: '🐦 Una piscina para pájaros', text: 'En verano los pájaros también necesitan agua para beber y chapotear. Basta un plato llano… y tienes piscina con espectáculo.' },
        { title: '🐞 Los mejores jardineros trabajan gratis', text: 'Una mariquita come hasta 50 pulgones al día. Sin pesticidas en el jardín, tus pequeños ayudantes siguen sanos.' },
      ],
    },
    autumn: {
      find: [
        { title: '🕸️ Joyas de rocío', text: 'En las mañanas de niebla, las telarañas brillan como collares de perlas. La araña suele estar justo en el centro: ¡la mejor foto del otoño!' },
        { title: '🐿️ Las jardineras más despistadas', text: 'Las ardillas esconden miles de frutos secos y olvidan muchos. Así plantan árboles sin querer. Ahora están muy ocupadas en los parques.' },
        { title: '🦔 Ruido entre las hojas', text: 'Los erizos acumulan grasa para el invierno. ¿Algo cruje y mastica bajo el seto al anochecer? Mira en silencio… ¡quizá sea uno!' },
        { title: '🐦 Tu modelo viene solo', text: 'El petirrojo es curioso: cuando rastrillas hojas, suele acercarse a buscar gusanos. ¡Ten el móvil listo!' },
        { title: '🦆 Gran reunión en el lago', text: 'Patos y gansos se reúnen ahora en lagos y ríos. En el parque puedes acercarte… pero sin pan, por favor.' },
        { title: '🐞 Las mariquitas se mudan', text: 'En días soleados de otoño, las mariquitas buscan refugio y se juntan en paredes claras y marcos de ventanas. ¡Echa un vistazo!' },
        { title: '🪵 ¿Quién vive bajo el tronco?', text: 'En el bosque, da la vuelta con cuidado a un trozo de madera muerta: ¡cochinillas, escarabajos y milpiés! Tras la foto, déjalo igual: es su casa.' },
      ],
      protect: [
        { title: '🍂 Hotel con pensión completa', text: 'Un montón de hojas en un rincón del jardín es refugio de invierno para erizos, escarabajos y sapos. Déjalo hasta abril: ¡menos trabajo para ti!' },
        { title: '🥛 A los erizos no les gusta la leche', text: 'Les duele la tripa. Si quieres ayudar: un plato llano con agua y algo de comida para gatos.' },
        { title: '🌱 Deja los tallos', text: 'Las abejas silvestres pasan el invierno en tallos huecos. Deja las plantas secas en pie: con escarcha quedan hasta bonitas.' },
        { title: '🍁 Rastrillo mejor que soplador', text: 'Los sopladores lanzan por los aires escarabajos, arañas y bichos pequeños. El rastrillo es más silencioso y mucho más amable.' },
        { title: '🦔 ¿Demasiado pequeño para el invierno?', text: 'Un erizo muy pequeño que todavía pasea de día en noviembre suele necesitar ayuda. Llama a un centro de recuperación antes de llevártelo.' },
        { title: '🪟 Los pájaros ven el cielo en las ventanas', text: 'Y chocan. Pegatinas o tiras por fuera del cristal ayudan: cuanto más juntas, mejor.' },
        { title: '🍎 Fiesta de fruta para mirlos', text: 'Deja unas manzanas bajo el árbol. Mirlos, zorzales y mariposas celebrarán una pequeña fiesta de otoño.' },
      ],
    },
    winter: {
      find: [
        { title: '🐦 Diez minutos de paciencia', text: 'Siéntate tranquilo junto a la ventana cerca del comedero. En unos diez minutos los carboneros se olvidan de ti y consigues fotos de cerca.' },
        { title: '🐾 Detective en la nieve', text: 'Tras una nevada, el jardín revela quién pasó por la noche: pájaros, gatos, ¿quizá una ardilla? Sigue una huella: ¿quién está detrás?' },
        { title: '🦆 Pies calentitos sobre el hielo', text: 'Los patos están sobre el hielo sin congelarse gracias a una circulación muy lista. Ahora se juntan en las zonas sin hielo del parque.' },
        { title: '🐿️ Nieve en la nariz', text: 'Las ardillas no hibernan. En días de sol desentierran sus frutos en el parque, a menudo con nieve en la nariz.' },
        { title: '🎶 Un cantante de invierno', text: 'El petirrojo canta incluso con helada. Sigue el canto: suele posarse a la vista en una rama, inflado como una bolita.' },
        { title: '🐦‍⬛ Cabezas listas', text: 'Cuervos y urracas están entre las aves más inteligentes y hasta reconocen caras. Así que sé amable… ¡y hazles un retrato!' },
        { title: '🦢 Adolescentes en el estanque', text: 'En invierno hay mucha vida junto al agua: cisnes, gaviotas, fochas. Por cierto, las gaviotas con manchas marrones son adolescentes.' },
      ],
      protect: [
        { title: '🍞 El pan da dolor de tripa', text: 'El pan se hincha en el estómago de patos y pájaros. Mejor: copos de avena, pipas de girasol o bolas de sebo sin red.' },
        { title: '💧 Héroe del barrio pajarero', text: 'Cuando todo está helado, los pájaros apenas encuentran agua. Un plato llano con agua fresca… y serás el héroe del vecindario.' },
        { title: '😴 Silencio, alguien duerme', text: 'Los erizos duermen profundamente en montones de hojas y ramas. Despertarse les cuesta mucha energía: deja los montones en paz.' },
        { title: '🏠 Se alquila piso', text: 'Saca los nidos viejos de las cajas nido antes de finales de febrero: suelen tener pulgas. Así todo estará listo para la próxima familia.' },
        { title: '🧼 No sentarse en la comida', text: 'Los pájaros se contagian con comida sucia. Los comederos de tubo son mejores que las bandejas: nadie pisa la comida.' },
        { title: '🌲 En silencio por el bosque', text: 'En invierno, los animales del bosque ahorran cada gota de energía. Ir por los caminos con el perro atado les evita huidas agotadoras.' },
        { title: '🍎 La manzana del buen humor', text: 'A los mirlos les encantan las medias manzanas en invierno. Pon unas cuantas en un rincón resguardado: buen humor para ti y para ellos.' },
      ],
    },
  },
};
