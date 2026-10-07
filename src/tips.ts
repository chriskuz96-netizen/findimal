import { Lang } from './i18n';
import { SeasonId } from './season';

// Natur-Tipps für die wöchentliche Mitteilung: je Jahreszeit 6 Fund-Tipps ("wo finde ich Tiere?")
// und 6 Schutz-Tipps ("wie helfe ich Tieren?"). Jeder Tipp: eine überraschende Tatsache + was man tun kann.

export type Tip = { title: string; text: string };
type SeasonTips = { find: Tip[]; protect: Tip[] };

// Manche Tipps passen nur in bestimmte Monate (1 = Januar), z. B. röhren Hirsche nur im September/Oktober.
// Schlüssel: Jahreszeit.Art.Nummer in der Liste oben (gilt für alle Sprachen).
export const TIP_MONTHS: Record<string, number[]> = {
  'spring.find.0': [3, 4], // Grasfrösche
  'spring.protect.1': [3, 4], // Krötenwanderung
  'summer.find.0': [6, 7], // Glühwürmchen
  'summer.find.2': [6, 7], // Mauersegler (ziehen Anfang August fort)
  'summer.protect.4': [6, 7], // Mauersegler am Boden
  'autumn.find.2': [9, 10], // Hirschbrunft
  'autumn.find.4': [9, 10], // Igel futtern (im November schlafen die meisten)
  'autumn.protect.4': [10, 11], // zu kleiner Igel
};

export const TIPS: Record<Lang, Record<SeasonId, SeasonTips>> = {
  de: {
    spring: {
      find: [
        { title: '🐸 Konzert am Teich', text: 'Grasfrösche knurren im Frühling wie kleine Motorboote. Geh an einem milden Abend an einen Teich, lausche – und leuchte dann vorsichtig das Ufer ab.' },
        { title: '🐦 Der frühe Vogel', text: 'Die Amsel singt schon eine Stunde vor Sonnenaufgang. Zwischen 6 und 8 Uhr sind Vögel am aktivsten – die beste Zeit für dein nächstes Foto.' },
        { title: '🦋 Der Frostprofi', text: 'Der Zitronenfalter überwintert ungeschützt im Gebüsch und übersteht bis zu minus 20 Grad. Am ersten warmen Tag sonnt er sich an Waldrändern.' },
        { title: '🐞 Marienkäfer-Treff', text: 'Nach dem Winter wärmen sich Marienkäfer oft in Gruppen. Schau an sonnigen Mittagen an Mauern und Zaunpfählen auf der Südseite.' },
        { title: '🐌 Nach dem Regen', text: 'Weinbergschnecken können bis zu 30 Jahre alt werden! Nach einem warmen Frühlingsregen kriechen sie an Mauern und Wegrändern heraus.' },
        { title: '🪺 Treue Störche', text: 'Weißstörche fliegen jedes Jahr bis zu 10.000 Kilometer und kehren oft zum selben Nest zurück. Schau in Dörfern auf Kirchtürme und hohe Masten.' },
      ],
      protect: [
        { title: '🐝 Hummel in Not', text: 'Eine erschöpfte Hummel am Boden braucht schnell Energie: Ein Tropfen Zuckerwasser (halb Zucker, halb Wasser) auf einem Löffel rettet sie oft. Bitte keinen Honig!' },
        { title: '🐸 Krötenretter gesucht', text: 'Im März wandern Kröten zu ihren Teichen, oft über Straßen. Naturschutzgruppen wie der NABU suchen Helfer zum Eimer-Tragen – frag doch mal nach.' },
        { title: '🐣 Vogelkind gefunden?', text: 'Junge Vögel mit Federn, die am Boden hüpfen, sind fast nie verlassen – die Eltern füttern weiter. Lass sie sitzen und geh ein Stück weg.' },
        { title: '🌼 Löwenzahn-Buffet', text: 'Löwenzahn ist im Frühling eine der wichtigsten Futterquellen für Wildbienen und Hummeln. Lass ruhig ein paar Ecken blühen, statt gleich zu mähen.' },
        { title: '🌿 Psst, hier wird gebrütet', text: 'Von März bis September brüten Vögel in Hecken. Große Rückschnitte sind in dieser Zeit sogar verboten – also lieber warten.' },
        { title: '🪵 Hotel für Wildbienen', text: 'Bohre Löcher (3–8 mm) in ein Stück Hartholz und häng es sonnig auf. Wildbienen stechen fast nie – du kannst ihnen ganz nah zuschauen.' },
      ],
    },
    summer: {
      find: [
        { title: '✨ Glühwürmchen-Nacht', text: 'Rund um den 24. Juni leuchten Glühwürmchen am stärksten. Geh nach 22 Uhr an einen Waldrand – und lass die Taschenlampe aus.' },
        { title: '🪽 Meisterjäger am Teich', text: 'Libellen fangen fast jede Beute, die sie jagen. Am Teich setzen sie sich immer wieder auf denselben Halm – warte dort einfach mit der Kamera.' },
        { title: '🐦 Leben in der Luft', text: 'Mauersegler fressen, trinken und schlafen im Flug – manchmal zehn Monate am Stück. Abends jagen sie kreischend über die Dächer.' },
        { title: '🦇 Mückenjäger', text: 'Eine winzige Zwergfledermaus frisst in einer Nacht bis zu 1.000 Mücken. Schau in der Dämmerung über Teiche oder unter Laternen.' },
        { title: '🦎 Sonnenbad am Morgen', text: 'Zauneidechsen wärmen sich morgens auf Steinen auf. Geh langsam und lass deinen Schatten nicht auf sie fallen – sonst sind sie blitzschnell weg.' },
        { title: '🦗 Wiesenmusik', text: 'Heuschrecken „singen“, indem sie ein Bein am Flügel reiben – jede Art klingt anders. Lausch an einem warmen Nachmittag auf einer ungemähten Wiese.' },
      ],
      protect: [
        { title: '💧 Bienen-Bar', text: 'Bei Hitze haben Bienen Durst. Eine flache Schale mit Wasser und ein paar Steinen als Landeplatz wird schnell zur beliebten Tränke.' },
        { title: '💡 Licht aus!', text: 'Lampen locken nachts Insekten an, die dann bis zur Erschöpfung kreisen. Mach Gartenlichter nachts aus oder nimm warmes, gelbes Licht.' },
        { title: '🌾 Die wilde Ecke', text: 'Lass ein Stück Rasen einfach wachsen. Schon nach wenigen Wochen summt und krabbelt es dort mehr als auf dem ganzen gemähten Rest.' },
        { title: '🦔 Ausstiegshilfe', text: 'Igel und Frösche können in Pools, Regentonnen und Kellerschächten ertrinken. Ein schräges Brett oder ein Ast als Ausstieg rettet Leben.' },
        { title: '🐦 Mauersegler am Boden', text: 'Ein Mauersegler am Boden kann oft nicht allein starten. Bitte nicht hochwerfen! Vorsichtig in einen Karton setzen und eine Wildvogelhilfe anrufen.' },
        { title: '🫙 Hummel im Zimmer', text: 'Hat sich eine Hummel ins Zimmer verirrt? Stülp ein Glas über sie, schieb eine Postkarte darunter und lass sie draußen frei.' },
      ],
    },
    autumn: {
      find: [
        { title: '🕊️ Trompeten am Himmel', text: 'Kraniche ziehen in großen Keilen nach Süden und rufen laut „grru-grru“. Oft hörst du sie, bevor du sie siehst – also immer mal nach oben schauen!' },
        { title: '🕸️ Netz in 30 Minuten', text: 'Eine Kreuzspinne baut ihr Netz in etwa einer halben Stunde und frisst es später oft wieder auf. An nebligen Morgen glitzern die Netze am schönsten.' },
        { title: '🦌 Das Röhren im Wald', text: 'Im September röhren Rothirsche so laut, dass man sie über einen Kilometer weit hört. Geh in der Dämmerung mit Erwachsenen an einen Waldrand – und halte Abstand.' },
        { title: '🐿️ Vergessliche Gärtner', text: 'Eichhörnchen verstecken im Herbst tausende Nüsse und finden viele nie wieder – so wachsen neue Bäume. Jetzt sind sie in Parks besonders fleißig.' },
        { title: '🦔 Schmatzen unter der Hecke', text: 'Igel futtern sich jetzt Winterspeck an. An milden Abenden hörst du sie oft schmatzen und rascheln – folge leise dem Geräusch.' },
        { title: '🌾 Rast auf dem Feld', text: 'Auf abgeernteten Feldern rasten jetzt Gänse und Stare auf dem Weg nach Süden. Stare fliegen abends in riesigen, wogenden Schwärmen.' },
      ],
      protect: [
        { title: '🍂 Fünf-Sterne-Hotel', text: 'Ein Laubhaufen in einer Gartenecke ist ein Winterquartier für Igel, Käfer und Kröten. Einfach bis April liegen lassen.' },
        { title: '🥛 Keine Milch für Igel', text: 'Igel vertragen keine Milch – sie werden davon krank. Wenn du helfen willst: eine flache Schale Wasser und etwas Katzenfutter.' },
        { title: '🌱 Stängel stehen lassen', text: 'In hohlen Pflanzenstängeln überwintern Wildbienen. Schneide verblühte Stauden deshalb erst im Frühling zurück.' },
        { title: '🍁 Rechen statt Bläser', text: 'Laubbläser und -sauger erwischen auch Käfer, Spinnen und kleine Tiere. Ein Rechen ist für sie viel schonender.' },
        { title: '🦔 Zu kleiner Igel?', text: 'Ein sehr kleiner Igel, der im November noch tagsüber herumläuft, braucht oft Hilfe. Ruf eine Igelstation an, bevor du ihn mitnimmst.' },
        { title: '🪟 Vorsicht, Glas!', text: 'Vögel sehen in Fenstern den Himmel und fliegen dagegen. Aufkleber oder Streifen außen am Glas helfen – am besten dicht nebeneinander.' },
      ],
    },
    winter: {
      find: [
        { title: '🐾 Spuren lesen', text: 'Nach frischem Schnee erzählt der Boden Geschichten: Fuchsspuren laufen wie auf einer Perlenschnur, Hasen hinterlassen ein „Y“. Geh früh morgens los!' },
        { title: '🐦 Geduld am Futterhaus', text: 'Am Futterhaus kommst du Meisen jetzt ganz nah. Setz dich ruhig ans Fenster – nach etwa zehn Minuten haben sie dich vergessen.' },
        { title: '🍒 Vögel mit Punkfrisur', text: 'In manchen Wintern kommen Seidenschwänze aus Skandinavien in Scharen und plündern Beerensträucher. Halt Ausschau nach Vögeln mit Federhaube!' },
        { title: '🦆 Warme Füße', text: 'Enten frieren nicht an den Füßen – ein besonderer Blutkreislauf schützt sie. Auf eisfreien Seen sammeln sich jetzt viele Gäste aus dem Norden.' },
        { title: '🐿️ Hellwach im Winter', text: 'Eichhörnchen halten keinen Winterschlaf. An sonnigen Tagen siehst du sie im Park, wie sie ihre versteckten Nüsse ausgraben.' },
        { title: '🎶 Wintersänger', text: 'Das Rotkehlchen singt als einer der wenigen Vögel auch im Winter – manchmal sogar nachts unter Laternen. Hör mal genau hin!' },
      ],
      protect: [
        { title: '🍞 Kein Brot!', text: 'Brot quillt im Magen von Vögeln und Enten auf und macht sie krank. Besser: Sonnenblumenkerne, Haferflocken mit Fett oder Meisenknödel ohne Netz.' },
        { title: '💧 Durst bei Frost', text: 'Wenn alles gefroren ist, finden Vögel kaum Wasser. Eine flache Schale mit frischem Wasser hilft – am besten jeden Tag neu.' },
        { title: '😴 Bitte nicht wecken', text: 'Wird ein Igel oder eine Fledermaus im Winterschlaf geweckt, kostet das viel Energie. Laubhaufen und Holzstapel jetzt in Ruhe lassen.' },
        { title: '🏠 Frühjahrsputz im Winter', text: 'Bis Ende Februar alte Nester aus Nistkästen entfernen – darin leben oft Flöhe. Dann ist der Kasten bereit für neue Bewohner.' },
        { title: '🦌 Auf den Wegen bleiben', text: 'Rehe sparen im Winter jede Kraft. Wer auf den Wegen bleibt und Hunde an der Leine führt, erspart ihnen anstrengende Fluchten.' },
        { title: '🧼 Saubere Futterstelle', text: 'An verschmutztem Futter stecken sich Vögel gegenseitig an. Futtersäulen sind besser als offene Häuschen, weil die Vögel nicht im Futter sitzen.' },
      ],
    },
  },
  en: {
    spring: {
      find: [
        { title: '🐸 Pond concert', text: 'In spring, common frogs purr like tiny motorboats. Visit a pond on a mild evening, listen – then gently shine a light along the bank.' },
        { title: '🐦 The early bird', text: 'Blackbirds start singing an hour before sunrise. Birds are most active between 6 and 8 am – the best time for your next photo.' },
        { title: '🦋 Frost champion', text: 'The brimstone butterfly spends winter unprotected in bushes and survives down to minus 20 degrees. On the first warm day it basks at forest edges.' },
        { title: '🐞 Ladybird meet-up', text: 'After winter, ladybirds often warm up in groups. Look on sunny walls and fence posts facing south around midday.' },
        { title: '🐌 After the rain', text: 'Roman snails can live up to 30 years! After a warm spring shower they come out on walls and path edges.' },
        { title: '🪺 Loyal storks', text: 'White storks fly up to 10,000 km every year and often return to the same nest. In villages, look up at church towers and tall poles.' },
      ],
      protect: [
        { title: '🐝 Bumblebee in trouble', text: 'An exhausted bumblebee on the ground needs energy fast: a drop of sugar water (half sugar, half water) on a spoon often saves it. Please no honey!' },
        { title: '🐸 Toad rescuers wanted', text: 'In March, toads migrate to their ponds, often across roads. Local nature groups look for helpers to carry them over in buckets – why not ask?' },
        { title: '🐣 Found a baby bird?', text: 'Feathered young birds hopping on the ground are almost never abandoned – their parents keep feeding them. Leave them be and step away.' },
        { title: '🌼 Dandelion buffet', text: 'In spring, dandelions are one of the most important foods for wild bees and bumblebees. Let a few corners bloom instead of mowing right away.' },
        { title: '🌿 Shh, nesting time', text: 'From March to September, birds nest in hedges. Wait with big trims until autumn – in some countries it is even forbidden.' },
        { title: '🪵 A hotel for wild bees', text: 'Drill holes (3–8 mm) into a piece of hardwood and hang it somewhere sunny. Wild bees almost never sting – you can watch them up close.' },
      ],
    },
    summer: {
      find: [
        { title: '✨ Firefly night', text: 'Around 24 June, fireflies glow the brightest. Go to a forest edge after 10 pm – and leave your torch off.' },
        { title: '🪽 Master hunter', text: 'Dragonflies catch almost every insect they chase. At a pond they land on the same stem again and again – just wait there with your camera.' },
        { title: '🐦 Life in the air', text: 'Swifts eat, drink and even sleep while flying – sometimes for ten months in a row. In the evening they race screaming over the rooftops.' },
        { title: '🦇 Mosquito hunter', text: 'A tiny pipistrelle bat can eat up to 1,000 mosquitoes in one night. At dusk, look over ponds or under street lamps.' },
        { title: '🦎 Morning sunbath', text: 'Sand lizards warm up on stones in the morning. Move slowly and don’t let your shadow fall on them – or they’re gone in a flash.' },
        { title: '🦗 Meadow music', text: 'Grasshoppers “sing” by rubbing a leg against a wing – every species sounds different. Listen in an unmown meadow on a warm afternoon.' },
      ],
      protect: [
        { title: '💧 Bee bar', text: 'Bees get thirsty in the heat. A shallow dish of water with a few stones as landing spots quickly becomes a popular drinking spot.' },
        { title: '💡 Lights off!', text: 'Lamps attract insects at night, which then circle until they are exhausted. Switch garden lights off at night or use warm, yellow light.' },
        { title: '🌾 The wild corner', text: 'Just let a patch of lawn grow. After a few weeks, more creatures buzz and crawl there than in the whole mown rest.' },
        { title: '🦔 A way out', text: 'Hedgehogs and frogs can drown in pools, rain barrels and window wells. A sloping board or branch as a ramp saves lives.' },
        { title: '🐦 Swift on the ground', text: 'A swift on the ground often can’t take off by itself. Please don’t throw it into the air! Put it gently in a box and call a wild bird rescue.' },
        { title: '🫙 Bumblebee indoors', text: 'A bumblebee lost in your room? Put a glass over it, slide a postcard underneath and set it free outside.' },
      ],
    },
    autumn: {
      find: [
        { title: '🕊️ Trumpets in the sky', text: 'Cranes fly south in large V shapes, calling a loud “grru-grru”. You often hear them before you see them – so keep looking up!' },
        { title: '🕸️ A web in 30 minutes', text: 'A garden spider builds its web in about half an hour and often eats it again later. On foggy mornings the webs sparkle the most.' },
        { title: '🦌 Roaring in the woods', text: 'In September, red deer stags roar so loudly you can hear them over a kilometre away. Visit a forest edge at dusk with an adult – and keep your distance.' },
        { title: '🐿️ Forgetful gardeners', text: 'Squirrels hide thousands of nuts in autumn and never find many of them – that’s how new trees grow. Right now they are extra busy in parks.' },
        { title: '🦔 Munching under the hedge', text: 'Hedgehogs are eating their winter fat now. On mild evenings you can often hear them munch and rustle – quietly follow the sound.' },
        { title: '🌾 Rest stop on the fields', text: 'Geese and starlings rest on harvested fields on their way south. In the evening, starlings fly in huge, swirling flocks.' },
      ],
      protect: [
        { title: '🍂 Five-star hotel', text: 'A pile of leaves in a corner of the garden is a winter home for hedgehogs, beetles and toads. Just leave it until April.' },
        { title: '🥛 No milk for hedgehogs', text: 'Hedgehogs can’t digest milk – it makes them ill. If you want to help: a shallow dish of water and some cat food.' },
        { title: '🌱 Leave the stems', text: 'Wild bees spend the winter inside hollow plant stems. So only cut back faded plants in spring.' },
        { title: '🍁 Rake, not blower', text: 'Leaf blowers and vacuums also catch beetles, spiders and small animals. A rake is much gentler for them.' },
        { title: '🦔 Too small a hedgehog?', text: 'A very small hedgehog still walking around in daylight in November often needs help. Call a hedgehog rescue before taking it in.' },
        { title: '🪟 Watch out, glass!', text: 'Birds see the sky reflected in windows and fly into them. Stickers or strips on the outside help – best placed close together.' },
      ],
    },
    winter: {
      find: [
        { title: '🐾 Reading tracks', text: 'After fresh snow the ground tells stories: fox tracks run like beads on a string, hares leave a “Y”. Head out early in the morning!' },
        { title: '🐦 Patience at the feeder', text: 'At the bird feeder you can get really close to tits now. Sit quietly by the window – after about ten minutes they’ll forget you’re there.' },
        { title: '🍒 Birds with punk hair', text: 'In some winters, waxwings arrive from Scandinavia in flocks and raid berry bushes. Look out for birds with a crest!' },
        { title: '🦆 Warm feet', text: 'Ducks don’t get cold feet – a special blood circulation protects them. Many visitors from the north now gather on ice-free lakes.' },
        { title: '🐿️ Wide awake in winter', text: 'Squirrels don’t hibernate. On sunny days you can see them in the park digging up their hidden nuts.' },
        { title: '🎶 Winter singer', text: 'The robin is one of the few birds that also sings in winter – sometimes even at night under street lamps. Listen closely!' },
      ],
      protect: [
        { title: '🍞 No bread!', text: 'Bread swells in the stomachs of birds and ducks and makes them ill. Better: sunflower seeds, oats mixed with fat, or fat balls without nets.' },
        { title: '💧 Thirsty in the frost', text: 'When everything is frozen, birds can hardly find water. A shallow dish of fresh water helps – ideally refilled every day.' },
        { title: '😴 Please don’t wake them', text: 'Waking a hibernating hedgehog or bat costs it a lot of energy. Leave leaf piles and woodpiles alone now.' },
        { title: '🏠 Spring cleaning in winter', text: 'Remove old nests from nest boxes by the end of February – they are often full of fleas. Then the box is ready for new tenants.' },
        { title: '🦌 Stay on the paths', text: 'Deer save every bit of energy in winter. Staying on paths and keeping dogs on a lead spares them exhausting escapes.' },
        { title: '🧼 Clean feeding spot', text: 'Birds can infect each other through dirty food. Feeder tubes are better than open bird tables because birds don’t sit in the food.' },
      ],
    },
  },
  fr: {
    spring: {
      find: [
        { title: '🐸 Concert à la mare', text: 'Au printemps, les grenouilles rousses ronronnent comme de petits bateaux à moteur. Va à une mare un soir doux, écoute – puis éclaire doucement la rive.' },
        { title: '🐦 L’oiseau matinal', text: 'Le merle chante déjà une heure avant le lever du soleil. Entre 6 h et 8 h, les oiseaux sont les plus actifs – le meilleur moment pour ta prochaine photo.' },
        { title: '🦋 Champion du gel', text: 'Le citron passe l’hiver sans abri dans les buissons et supporte jusqu’à moins 20 degrés. Au premier jour chaud, il se chauffe en lisière de forêt.' },
        { title: '🐞 Rendez-vous des coccinelles', text: 'Après l’hiver, les coccinelles se réchauffent souvent en groupe. Regarde vers midi sur les murs et piquets ensoleillés, côté sud.' },
        { title: '🐌 Après la pluie', text: 'L’escargot de Bourgogne peut vivre jusqu’à 30 ans ! Après une pluie de printemps tiède, il sort sur les murs et au bord des chemins.' },
        { title: '🪺 Cigognes fidèles', text: 'Les cigognes blanches parcourent jusqu’à 10 000 km chaque année et reviennent souvent au même nid. Dans les villages, regarde les clochers et les poteaux.' },
      ],
      protect: [
        { title: '🐝 Bourdon en détresse', text: 'Un bourdon épuisé au sol a besoin d’énergie : une goutte d’eau sucrée (moitié sucre, moitié eau) sur une cuillère le sauve souvent. Pas de miel !' },
        { title: '🐸 Sauveteurs de crapauds', text: 'En mars, les crapauds migrent vers leurs mares, souvent en traversant les routes. Des associations cherchent des bénévoles pour les porter en seau – renseigne-toi !' },
        { title: '🐣 Un oisillon au sol ?', text: 'Les jeunes oiseaux à plumes qui sautillent au sol ne sont presque jamais abandonnés – leurs parents les nourrissent. Laisse-les et éloigne-toi.' },
        { title: '🌼 Buffet de pissenlits', text: 'Au printemps, le pissenlit est l’une des nourritures les plus importantes pour les abeilles sauvages et les bourdons. Laisse fleurir quelques coins.' },
        { title: '🌿 Chut, on couve', text: 'De mars à septembre, les oiseaux nichent dans les haies. Attends l’automne pour les grosses tailles.' },
        { title: '🪵 Hôtel à abeilles', text: 'Perce des trous (3–8 mm) dans un morceau de bois dur et accroche-le au soleil. Les abeilles sauvages ne piquent presque jamais – observe-les de près.' },
      ],
    },
    summer: {
      find: [
        { title: '✨ Nuit des lucioles', text: 'Vers le 24 juin, les vers luisants brillent le plus. Va en lisière de forêt après 22 h – et laisse ta lampe éteinte.' },
        { title: '🪽 Chasseuse hors pair', text: 'Les libellules attrapent presque toutes les proies qu’elles poursuivent. Au bord de la mare, elles se posent sans cesse sur la même tige – attends-les là.' },
        { title: '🐦 Vivre dans les airs', text: 'Les martinets mangent, boivent et dorment en vol – parfois dix mois d’affilée. Le soir, ils filent en criant au-dessus des toits.' },
        { title: '🦇 Chasseuse de moustiques', text: 'Une minuscule pipistrelle peut manger jusqu’à 1 000 moustiques en une nuit. Au crépuscule, regarde au-dessus des mares ou sous les lampadaires.' },
        { title: '🦎 Bain de soleil', text: 'Le matin, les lézards se réchauffent sur les pierres. Avance lentement et ne fais pas d’ombre sur eux – sinon, ils filent en un éclair.' },
        { title: '🦗 Musique de prairie', text: 'Les sauterelles « chantent » en frottant une patte contre une aile – chaque espèce a son chant. Écoute dans une prairie non fauchée un après-midi chaud.' },
      ],
      protect: [
        { title: '💧 Bar à abeilles', text: 'Par forte chaleur, les abeilles ont soif. Une coupelle d’eau avec quelques pierres pour se poser devient vite un abreuvoir très fréquenté.' },
        { title: '💡 On éteint !', text: 'La nuit, les lampes attirent les insectes qui tournent jusqu’à l’épuisement. Éteins les lumières du jardin ou choisis une lumière jaune et chaude.' },
        { title: '🌾 Le coin sauvage', text: 'Laisse simplement pousser un bout de pelouse. En quelques semaines, il y aura plus de petites bêtes que dans tout le reste tondu.' },
        { title: '🦔 Une sortie de secours', text: 'Hérissons et grenouilles peuvent se noyer dans les piscines, tonneaux et soupiraux. Une planche ou une branche en pente leur sauve la vie.' },
        { title: '🐦 Martinet au sol', text: 'Un martinet au sol ne peut souvent pas redécoller seul. Ne le lance surtout pas ! Mets-le doucement dans un carton et appelle un centre de soins.' },
        { title: '🫙 Bourdon dans la maison', text: 'Un bourdon perdu dans ta chambre ? Pose un verre dessus, glisse une carte postale dessous et libère-le dehors.' },
      ],
    },
    autumn: {
      find: [
        { title: '🕊️ Trompettes dans le ciel', text: 'Les grues partent vers le sud en grands V en criant « grrou-grrou ». On les entend souvent avant de les voir – lève les yeux !' },
        { title: '🕸️ Une toile en 30 minutes', text: 'L’épeire diadème tisse sa toile en une demi-heure environ et la mange souvent ensuite. Les matins de brouillard, les toiles scintillent.' },
        { title: '🦌 Le brame en forêt', text: 'En septembre, les cerfs brament si fort qu’on les entend à plus d’un kilomètre. Va en lisière au crépuscule avec un adulte – et garde tes distances.' },
        { title: '🐿️ Jardiniers distraits', text: 'Les écureuils cachent des milliers de noix en automne et en oublient beaucoup – c’est ainsi que poussent de nouveaux arbres. Ils sont très actifs dans les parcs.' },
        { title: '🦔 Ça mâche sous la haie', text: 'Les hérissons font leurs réserves pour l’hiver. Les soirs doux, on les entend souvent mâcher et froisser les feuilles – suis le bruit en silence.' },
        { title: '🌾 Halte dans les champs', text: 'Oies et étourneaux se reposent dans les champs moissonnés en route vers le sud. Le soir, les étourneaux volent en nuées immenses.' },
      ],
      protect: [
        { title: '🍂 Hôtel cinq étoiles', text: 'Un tas de feuilles dans un coin du jardin est un abri d’hiver pour hérissons, scarabées et crapauds. Laisse-le jusqu’en avril.' },
        { title: '🥛 Pas de lait aux hérissons', text: 'Les hérissons ne digèrent pas le lait – il les rend malades. Pour les aider : une coupelle d’eau et un peu de pâtée pour chat.' },
        { title: '🌱 Garde les tiges', text: 'Des abeilles sauvages passent l’hiver dans les tiges creuses. Ne coupe les plantes fanées qu’au printemps.' },
        { title: '🍁 Râteau plutôt que souffleur', text: 'Les souffleurs et aspirateurs de feuilles emportent aussi scarabées, araignées et petites bêtes. Un râteau est bien plus doux.' },
        { title: '🦔 Hérisson trop petit ?', text: 'Un tout petit hérisson qui se promène de jour en novembre a souvent besoin d’aide. Appelle un centre de soins avant de l’emporter.' },
        { title: '🪟 Attention, vitre !', text: 'Les oiseaux voient le ciel dans les vitres et s’y cognent. Des autocollants ou des bandes à l’extérieur aident – bien serrés.' },
      ],
    },
    winter: {
      find: [
        { title: '🐾 Lire les traces', text: 'Après la neige fraîche, le sol raconte des histoires : les traces du renard s’alignent comme un collier, le lièvre laisse un « Y ». Pars tôt le matin !' },
        { title: '🐦 Patience à la mangeoire', text: 'À la mangeoire, tu peux approcher les mésanges de très près. Assieds-toi calmement à la fenêtre – après dix minutes, elles t’oublient.' },
        { title: '🍒 Oiseaux à crête', text: 'Certains hivers, les jaseurs boréaux arrivent en bandes de Scandinavie et pillent les arbustes à baies. Guette les oiseaux à huppe !' },
        { title: '🦆 Pieds au chaud', text: 'Les canards n’ont pas froid aux pattes grâce à une circulation sanguine spéciale. Beaucoup de visiteurs du Nord se rassemblent sur les lacs non gelés.' },
        { title: '🐿️ Bien réveillé', text: 'Les écureuils n’hibernent pas. Les jours de soleil, tu les vois dans les parcs déterrer leurs noix cachées.' },
        { title: '🎶 Chanteur d’hiver', text: 'Le rouge-gorge est l’un des rares oiseaux à chanter aussi en hiver – parfois même la nuit sous les lampadaires. Tends l’oreille !' },
      ],
      protect: [
        { title: '🍞 Pas de pain !', text: 'Le pain gonfle dans l’estomac des oiseaux et des canards et les rend malades. Mieux : graines de tournesol, flocons d’avoine avec de la graisse, boules sans filet.' },
        { title: '💧 Soif par grand froid', text: 'Quand tout est gelé, les oiseaux trouvent à peine de l’eau. Une coupelle d’eau fraîche les aide – à changer chaque jour.' },
        { title: '😴 Ne pas réveiller', text: 'Réveiller un hérisson ou une chauve-souris en hibernation lui coûte beaucoup d’énergie. Ne touche pas aux tas de feuilles et de bois.' },
        { title: '🏠 Grand ménage d’hiver', text: 'Retire les vieux nids des nichoirs avant fin février – ils sont souvent pleins de puces. Le nichoir sera prêt pour de nouveaux habitants.' },
        { title: '🦌 Reste sur les chemins', text: 'En hiver, les chevreuils économisent chaque force. Rester sur les chemins et tenir les chiens en laisse leur évite des fuites épuisantes.' },
        { title: '🧼 Mangeoire propre', text: 'Les oiseaux se contaminent par la nourriture sale. Les silos sont mieux que les plateaux ouverts, car les oiseaux ne marchent pas dans les graines.' },
      ],
    },
  },
  es: {
    spring: {
      find: [
        { title: '🐸 Concierto en la charca', text: 'En primavera, las ranas bermejas ronronean como pequeñas lanchas. Ve a una charca una tarde templada, escucha… y alumbra con cuidado la orilla.' },
        { title: '🐦 Al que madruga', text: 'El mirlo canta ya una hora antes del amanecer. Entre las 6 y las 8 las aves están más activas: el mejor momento para tu próxima foto.' },
        { title: '🦋 Campeona del frío', text: 'La limonera pasa el invierno sin refugio entre los arbustos y aguanta hasta 20 grados bajo cero. El primer día cálido toma el sol en los bordes del bosque.' },
        { title: '🐞 Reunión de mariquitas', text: 'Tras el invierno, las mariquitas suelen calentarse en grupo. Busca al mediodía en muros y postes soleados orientados al sur.' },
        { title: '🐌 Después de la lluvia', text: '¡El caracol de Borgoña puede vivir hasta 30 años! Tras una lluvia templada de primavera sale en muros y bordes de caminos.' },
        { title: '🪺 Cigüeñas fieles', text: 'Las cigüeñas blancas vuelan hasta 10 000 km cada año y a menudo vuelven al mismo nido. En los pueblos, mira campanarios y postes altos.' },
      ],
      protect: [
        { title: '🐝 Abejorro en apuros', text: 'Un abejorro agotado en el suelo necesita energía rápida: una gota de agua con azúcar (mitad y mitad) en una cuchara suele salvarlo. ¡Nada de miel!' },
        { title: '🐸 Se buscan rescatadores', text: 'En marzo los sapos van hacia sus charcas, a menudo cruzando carreteras. Grupos de naturaleza buscan voluntarios para llevarlos en cubos: ¡pregunta!' },
        { title: '🐣 ¿Un pollito en el suelo?', text: 'Las crías con plumas que saltan por el suelo casi nunca están abandonadas: sus padres siguen alimentándolas. Déjalas y apártate.' },
        { title: '🌼 Bufé de dientes de león', text: 'En primavera, el diente de león es uno de los alimentos más importantes para abejas silvestres y abejorros. Deja florecer algunos rincones.' },
        { title: '🌿 Silencio, se anida', text: 'De marzo a septiembre las aves anidan en los setos. Espera al otoño para las podas grandes.' },
        { title: '🪵 Hotel para abejas', text: 'Haz agujeros (3–8 mm) en un trozo de madera dura y cuélgalo al sol. Las abejas silvestres casi nunca pican: podrás verlas de cerca.' },
      ],
    },
    summer: {
      find: [
        { title: '✨ Noche de luciérnagas', text: 'Alrededor del 24 de junio las luciérnagas brillan más. Ve al borde de un bosque después de las 22 h… y deja la linterna apagada.' },
        { title: '🪽 Cazadora experta', text: 'Las libélulas atrapan casi todas las presas que persiguen. En la charca se posan una y otra vez en el mismo tallo: espera allí con la cámara.' },
        { title: '🐦 Vivir en el aire', text: 'Los vencejos comen, beben y duermen volando, a veces diez meses seguidos. Al atardecer pasan chillando sobre los tejados.' },
        { title: '🦇 Cazador de mosquitos', text: 'Un diminuto murciélago enano puede comer hasta 1000 mosquitos en una noche. Al anochecer, mira sobre las charcas o bajo las farolas.' },
        { title: '🦎 Baño de sol', text: 'Por la mañana las lagartijas se calientan sobre las piedras. Muévete despacio y no les hagas sombra, o desaparecerán en un segundo.' },
        { title: '🦗 Música de pradera', text: 'Los saltamontes «cantan» frotando una pata contra el ala, y cada especie suena distinta. Escucha en un prado sin segar una tarde cálida.' },
      ],
      protect: [
        { title: '💧 Bar de abejas', text: 'Con calor, las abejas tienen sed. Un plato llano con agua y unas piedras para posarse se convierte pronto en un bebedero muy visitado.' },
        { title: '💡 ¡Luces fuera!', text: 'De noche, las lámparas atraen insectos que dan vueltas hasta agotarse. Apaga las luces del jardín o usa luz cálida y amarilla.' },
        { title: '🌾 El rincón salvaje', text: 'Deja crecer un trozo de césped. En pocas semanas habrá más bichos zumbando y trepando que en todo el resto segado.' },
        { title: '🦔 Una salida', text: 'Erizos y ranas pueden ahogarse en piscinas, bidones y tragaluces. Una tabla o rama inclinada como rampa salva vidas.' },
        { title: '🐦 Vencejo en el suelo', text: 'Un vencejo en el suelo a menudo no puede despegar solo. ¡No lo lances al aire! Ponlo con cuidado en una caja y llama a un centro de recuperación.' },
        { title: '🫙 Abejorro en casa', text: '¿Un abejorro perdido en tu habitación? Pon un vaso encima, desliza una postal por debajo y suéltalo fuera.' },
      ],
    },
    autumn: {
      find: [
        { title: '🕊️ Trompetas en el cielo', text: 'Las grullas vuelan al sur en grandes uves y llaman «grru-grru». A menudo las oyes antes de verlas: ¡mira hacia arriba!' },
        { title: '🕸️ Una tela en 30 minutos', text: 'La araña de jardín teje su tela en una media hora y luego suele comérsela. En las mañanas de niebla, las telas brillan más que nunca.' },
        { title: '🦌 La berrea', text: 'En septiembre los ciervos braman tan fuerte que se oyen a más de un kilómetro. Ve al borde del bosque al anochecer con un adulto y guarda distancia.' },
        { title: '🐿️ Jardineras despistadas', text: 'Las ardillas esconden miles de frutos secos en otoño y olvidan muchos: así crecen árboles nuevos. Ahora están muy activas en los parques.' },
        { title: '🦔 Ruido bajo el seto', text: 'Los erizos acumulan grasa para el invierno. En las tardes templadas se les oye masticar y hacer crujir las hojas: sigue el sonido en silencio.' },
        { title: '🌾 Parada en los campos', text: 'Gansos y estorninos descansan en los campos segados camino al sur. Al atardecer, los estorninos vuelan en enormes nubes.' },
      ],
      protect: [
        { title: '🍂 Hotel de cinco estrellas', text: 'Un montón de hojas en un rincón del jardín es un refugio de invierno para erizos, escarabajos y sapos. Déjalo hasta abril.' },
        { title: '🥛 Nada de leche', text: 'Los erizos no digieren la leche: les pone enfermos. Si quieres ayudar: un plato llano con agua y algo de comida para gatos.' },
        { title: '🌱 Deja los tallos', text: 'Las abejas silvestres pasan el invierno dentro de tallos huecos. Corta las plantas secas solo en primavera.' },
        { title: '🍁 Rastrillo, no soplador', text: 'Los sopladores y aspiradores de hojas atrapan también escarabajos, arañas y bichos pequeños. Un rastrillo es mucho más suave.' },
        { title: '🦔 ¿Erizo demasiado pequeño?', text: 'Un erizo muy pequeño que pasea de día en noviembre a menudo necesita ayuda. Llama a un centro de recuperación antes de llevártelo.' },
        { title: '🪟 ¡Cuidado, cristal!', text: 'Las aves ven el cielo reflejado en las ventanas y chocan. Pegatinas o tiras por fuera ayudan, mejor bien juntas.' },
      ],
    },
    winter: {
      find: [
        { title: '🐾 Leer huellas', text: 'Tras una nevada, el suelo cuenta historias: las huellas del zorro van en fila como un collar y la liebre deja una «Y». ¡Sal temprano!' },
        { title: '🐦 Paciencia en el comedero', text: 'En el comedero puedes ver a los carboneros muy de cerca. Siéntate tranquilo junto a la ventana: en unos diez minutos se olvidan de ti.' },
        { title: '🍒 Aves con cresta', text: 'Algunos inviernos llegan bandadas de ampelis desde Escandinavia y saquean los arbustos con bayas. ¡Busca aves con penacho!' },
        { title: '🦆 Pies calentitos', text: 'Los patos no pasan frío en las patas gracias a una circulación especial. Muchos visitantes del norte se reúnen ahora en lagos sin hielo.' },
        { title: '🐿️ Despierta en invierno', text: 'Las ardillas no hibernan. En los días de sol las verás en el parque desenterrando sus frutos escondidos.' },
        { title: '🎶 Cantor de invierno', text: 'El petirrojo es de los pocos pájaros que cantan también en invierno, a veces incluso de noche bajo las farolas. ¡Escucha bien!' },
      ],
      protect: [
        { title: '🍞 ¡Nada de pan!', text: 'El pan se hincha en el estómago de aves y patos y les enferma. Mejor: pipas de girasol, copos de avena con grasa o bolas de sebo sin red.' },
        { title: '💧 Sed con helada', text: 'Cuando todo está helado, las aves apenas encuentran agua. Un plato llano con agua fresca ayuda; mejor cambiarla cada día.' },
        { title: '😴 No despertar', text: 'Despertar a un erizo o un murciélago que hiberna le cuesta mucha energía. No toques ahora montones de hojas ni pilas de leña.' },
        { title: '🏠 Limpieza en invierno', text: 'Quita los nidos viejos de las cajas nido antes de finales de febrero: suelen tener pulgas. Así la caja estará lista para nuevos inquilinos.' },
        { title: '🦌 Por los caminos', text: 'En invierno los corzos ahorran cada gota de energía. Ir por los caminos y llevar al perro atado les evita huidas agotadoras.' },
        { title: '🧼 Comedero limpio', text: 'Las aves se contagian a través de comida sucia. Los comederos de tubo son mejores que las bandejas, porque las aves no pisan la comida.' },
      ],
    },
  },
};
