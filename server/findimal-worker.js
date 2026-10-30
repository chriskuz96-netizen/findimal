// Findimal-Server als Cloudflare Worker.
//
// 1. Tierbestimmung: Die App schickt ein Foto; der Worker fragt Claude, welches Tier es ist,
//    und gibt einen kurzen Steckbrief zurück (den ausführlichen erst auf Wunsch).
//    Erst fragt das günstige Modell (Haiku); ist es unsicher, übernimmt das genauere (Sonnet).
// 2. "Jetzt in deiner Nähe": drei Tiere, die man gerade in der Region entdecken kann.
// 3. Rangliste mit Freunden und weltweit (Spitzname und Punkte, gespeichert im Cloudflare-KV-Speicher).
//
// Der Claude-API-Schlüssel liegt nur hier im Worker (als geheime Variable), nie in der App
// oder auf GitHub.
//
// Geheime Variablen in Cloudflare (Settings -> Variables and Secrets):
//   ANTHROPIC_API_KEY  dein Claude-API-Schlüssel (sk-ant-...)
//   (Sprachen: Die App schickt "lang" mit, Claude antwortet dann auf Deutsch, Englisch,
//    Französisch oder Spanisch.)
//   APP_KEY            ein selbst ausgedachtes Passwort ("Findimal-Code"); die App fragt einmal danach
//
// Normale Variablen (Settings -> Variables and Secrets, Typ "Text"):
//   OFFEN              "ja" = die App funktioniert auch ohne Findimal-Code (für TestFlight und
//                      App Store). Dann schützen Grenzen pro Handy, pro Internetanschluss und
//                      pro Tag vor Missbrauch. Wer den Findimal-Code kennt, darf Plus testen.
//   TAGES_GRENZE       höchstens so viele KI-Anfragen am Tag für alle ohne Code zusammen
//                      (Standard 300, etwa 2 € am Tag)
//
// Rangliste: braucht einen KV-Speicher (Storage & Databases -> KV), der im Worker unter
// Bindings mit dem Variablennamen DB verbunden ist. Gespeichert werden nur Spitzname,
// XP, Stufe, Anzahl Arten und Profilbild – keine Orte. Ein eigenes Foto als Profilbild (Plus) kommt
// nur als kleines Vorschaubild (160 × 160) und erst nach einer KI-Prüfung (nur Tiere/Natur, keine Menschen).
//
// Dieser Code wird direkt im Cloudflare-Editor eingefügt. Dort gibt es kein npm,
// deshalb ruft er die Claude-API mit fetch auf statt mit dem Anthropic-SDK.

// Erst das schnelle, günstige Modell fragen; ist es unsicher oder klappt etwas nicht, übernimmt das genauere.
const CHEAP_MODEL = 'claude-haiku-5-5';
const MODEL = 'claude-sonnet-5-5';

// Gratis-Fotos pro Handy und Tag (zählt nur, wenn der Speicher DB verbunden ist).
// Weitere Fotos zum selben Tier ("extra") haben ein eigenes, großzügigeres Limit.
const DAILY_PHOTOS = 3;
const DAILY_EXTRA = 6;
const DAILY_KORREKTUR = 5; // „Stimmt nicht?“ – Vermutung am vorhandenen Foto prüfen (genaues Modell, pro Tag)
// Findimal Plus (Testphase, bis es das echte Abo gibt): "unbegrenzt", zur Sicherheit aber
// höchstens 30 Fotos pro Handy und Tag. Geht nur mit dem richtigen APP_KEY.
const DAILY_PLUS = 30;
// Ohne Findimal-Code (OFFEN = "ja"): KI-Anfragen pro Internetanschluss und Tag
// (großzügig, weil sich Familien und Schulklassen einen Anschluss teilen)
const DAILY_PER_IP = 150; // eine Schulklasse im selben WLAN soll nicht ausgebremst werden
const DAILY_TOTAL = 300;

const TEXT = { type: 'string' };
const GRUPPE = {
  type: 'string',
  enum: ['saeugetier', 'vogel', 'insekt', 'amphibie', 'reptil', 'fisch', 'weichtier', 'spinnentier', 'andere'],
};

// ---------- 1. Tierbestimmung ----------

const SYSTEM = `Du bist der Tierexperte der App Findimal, einer freundlichen App zum Bestimmen und Sammeln von Tieren.
Du bekommst ein Foto und bestimmst das Tier darauf so genau wie möglich (am liebsten bis zur Art).
Antworte freundlich und gut verständlich für Kinder und Erwachsene.
Gib nur Fakten an, bei denen du dir sicher bist. Nenne die konkrete Art (z. B. "Gartenkreuzspinne",
"Hauswinkelspinne", "Lachmöwe", "Stockente", "Kleiner Fuchs", "Rote Waldameise", "Weinbergschnecke",
"Bachforelle") – nie nur eine Großgruppe wie "Spinne", "Käfer", "Vogel", "Möwe", "Ente", "Fliege", "Biene",
"Ameise", "Schmetterling", "Raupe", "Schnecke", "Fisch" oder "Frosch", denn das weiß jeder schon.
Ausnahme: Bei sehr bekannten Tieren, deren Alltagsname schon klar ist, darf "name" der gewohnte Name sein
(z. B. "Marienkäfer", "Hummel", "Libelle", "Igel", "Eichhörnchen", "Maulwurf"); die genaue Art steht dann in
"wissenschaftlicher_name" und, wenn spannend, in der Kurzbeschreibung (z. B. "ein Siebenpunkt-Marienkäfer",
"eine Dunkle Erdhummel", "eine Blaugrüne Mosaikjungfer"). Bist du dir bei der Art nicht ganz sicher, nenne die wahrscheinlichste Art,
setze "sicherheit" auf "wahrscheinlich" oder "unsicher" und nenne in "hinweis" kurz, woran man sie erkennt oder
welche ähnliche Art es sein könnte. Nur wenn auf dem Foto wirklich keine Art zu erkennen ist, nenne die engste
mögliche Gruppe (z. B. "Eine Schwebfliege", nicht "Ein Insekt") und setze "sicherheit" auf "unsicher".
"wissenschaftlicher_name" ist der volle Artname aus Gattung und Art (z. B. "Araneus diadematus").
Wenn kein Tier zu sehen ist, setze "tier_gefunden" auf false, lass die Tierfelder leer und erkläre in
"hinweis" kurz und freundlich, was du siehst und wie ein besseres Foto gelingt.
Halte die Texte kurz: "kurzbeschreibung" höchstens zwei kurze Sätze, "wusstest_du" ein kurzer, überraschender
Satz. "hinweis" nur, wenn kein Tier zu sehen ist oder das Foto die Bestimmung schwer macht, sonst leer.
Bei Haus- und Nutztieren (z. B. Hund, Katze, Huhn, Pferd, Rind, Schaf, Ziege, Kaninchen, Meerschweinchen)
bestimme zusätzlich die Rasse und schreibe sie kurz in "rasse" (höchstens drei Wörter, z. B. "Golden Retriever",
"Brahma", "Haflinger"). Sieht das Tier nach einer Mischung aus, schreibe z. B. "Labrador-Mischling" oder nur
"Mischling". Schreibe nie "vermutlich" in "rasse"; bist du dir bei der Rasse nicht sicher, setze stattdessen
"rasse_sicher" auf false. "name" bleibt die Tierart (z. B. "Haushund", "Haushuhn").
Bei Wildtieren bleibt "rasse" leer und "rasse_sicher" ist true.
"sicherheit" bezieht sich nur auf die Tierart, nie auf die Rasse: Ein klar erkennbares Huhn, ein Hund oder eine
Katze ist "sicher", auch wenn die Rasse unklar ist (dafür gibt es "rasse_sicher").
Setze "gefaehrdet" auf true, wenn die Art auf der Roten Liste Deutschlands oder weltweit (IUCN) mindestens als
"gefährdet" eingestuft ist. Bei Haus- und Nutztieren, häufigen Arten oder wenn du unsicher bist: false.
Setze "giftig" auf true, wenn das Tier giftig ist oder mit Gift stechen oder beißen kann (z. B. Wespe, Biene,
Kreuzotter, Feuersalamander), sonst false.
Setze "gross" auf true, wenn ein ausgewachsenes Tier dieser Art größer oder länger als 1 Meter ist (z. B. Reh,
Pferd, Rind, Schwan, Wildschwein), sonst false.
Setze "schmetterling" auf true bei Schmetterlingen und Faltern (auch Nachtfalter und Raupen), sonst false.
Setze "wasser" auf true, wenn die Art im oder direkt am Wasser lebt (z. B. Fisch, Ente, Schwan, Frosch, Libelle,
Graureiher), sonst false.
Setze "winzig" auf true, wenn ein ausgewachsenes Tier dieser Art kleiner als 1 Zentimeter ist (z. B. Blattlaus,
Ameise, Springspinne), sonst false.
"bildart" sagt, was fotografiert wurde: "echt" = ein echtes Tier (auch im Zoo, im Tierpark oder als Haustier);
"zeichnung" = Zeichnung, Gemälde, Comic oder computererzeugtes Bild; "spielzeug" = Plüschtier, Figur, Statue oder
ausgestopftes Tier; "bildschirm" = abfotografierter Bildschirm oder Screenshot; "druck" = Foto aus Buch, Zeitschrift,
Poster oder ein abfotografiertes Papierfoto; "internet" = eindeutig ein Bild aus dem Internet (z. B. Wasserzeichen,
Logo einer Bildagentur, Text oder Rahmen einer Webseite, Collage) – ein gutes, scharfes Foto allein reicht dafür
nicht. Bestimme das Tier trotzdem ganz normal. Im Zweifel "echt" – lieber ein
echtes Tier durchlassen als jemandem seinen Fund wegnehmen. Ohne Tier: "echt".`;

// Kurzer Steckbrief direkt nach dem Foto
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'tier_gefunden', 'name', 'rasse', 'rasse_sicher', 'wissenschaftlicher_name', 'gruppe', 'sicherheit',
    'kurzbeschreibung', 'wusstest_du', 'hinweis', 'gefaehrdet', 'giftig', 'gross', 'schmetterling',
    'wasser', 'winzig', 'bildart',
  ],
  properties: {
    tier_gefunden: { type: 'boolean' },
    bildart: { type: 'string', enum: ['echt', 'zeichnung', 'spielzeug', 'bildschirm', 'druck', 'internet'] },
    name: TEXT,
    rasse: TEXT,
    rasse_sicher: { type: 'boolean' },
    gefaehrdet: { type: 'boolean' },
    giftig: { type: 'boolean' },
    gross: { type: 'boolean' },
    schmetterling: { type: 'boolean' },
    wasser: { type: 'boolean' },
    winzig: { type: 'boolean' },
    wissenschaftlicher_name: TEXT,
    gruppe: GRUPPE,
    sicherheit: { type: 'string', enum: ['sicher', 'wahrscheinlich', 'unsicher'] },
    kurzbeschreibung: TEXT,
    wusstest_du: TEXT,
    hinweis: TEXT,
  },
};

// Ausführlicher Steckbrief – erst, wenn jemand "Steckbrief anzeigen" tippt (ohne Foto, sehr günstig)
const DETAILS_SYSTEM = `Du bist der Tierexperte der App Findimal. Du bekommst den Namen eines Tieres und schreibst
einen kurzen Steckbrief, freundlich und gut verständlich für Kinder und Erwachsene. Jedes Feld nur ein bis zwei
kurze Sätze oder Stichworte. Gib nur Fakten an, bei denen du dir sicher bist.
Gefährdungsstatus bitte mit IUCN-Kürzel, z. B. "Nicht gefährdet (IUCN: LC)". Bei Haustieren passt "Haustier" o. Ä.`;

const DETAILS_FIELDS = [
  'klasse', 'familie', 'groesse', 'aktiv', 'lebensraum', 'verbreitung', 'gefaehrdung',
  'rolle_in_der_natur', 'nahrung', 'fressfeinde',
];
const DETAILS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: DETAILS_FIELDS,
  properties: Object.fromEntries(DETAILS_FIELDS.map((f) => [f, TEXT])),
};

// ---------- 2. Jetzt in deiner Nähe ----------

const NEARBY_SYSTEM = `Du bist der Tierexperte der App Findimal.
Schlage drei häufige, wild lebende Tiere vor, die man in der genannten Region zur genannten Jahres- und
Tageszeit mit etwas Glück selbst entdecken kann (keine Haustiere, keine seltenen oder gefährlichen Arten).
Wähle möglichst verschiedene Tiergruppen. Antworte kurz und freundlich.
"wo" sind höchstens fünf Wörter (z. B. "Hecken und Laubhaufen"), "tipp" ist ein kurzer Satz.`;

const NEARBY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['tiere'],
  properties: {
    tiere: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'wissenschaftlicher_name', 'gruppe', 'wo', 'tipp'],
        properties: {
          name: TEXT,
          wissenschaftlicher_name: TEXT,
          gruppe: GRUPPE,
          wo: TEXT,
          tipp: TEXT,
        },
      },
    },
  },
};

// Sprache der Antwort (die App schickt de, en, fr oder es)
// ---------- Saison-Seite für Länder außerhalb Mitteleuropas ----------
// Wird pro Land, Monat und Sprache nur einmal erzeugt und dann für alle Nutzer gespeichert.

const SAISON_SYSTEM = `Du bist der Naturexperte der Familien-App Findimal.
Beschreibe für das genannte Land und den genannten Monat die Jahreszeit, wie sie dort für die Tierwelt gerade ist
(z. B. "Regenzeit in Thailand", "Frühling in Australien", "Herbst in Spanien").
- name: Jahreszeit + Land, höchstens 5 Wörter.
- stimmung: welche Stimmung am besten passt (fruehling, sommer, herbst, winter, regen oder trocken).
- start_monat und end_monat (1–12): wann diese Jahreszeit dort beginnt und endet; der genannte Monat liegt dazwischen.
- tiere: genau 4 häufige, wild lebende Tiere, die Familien dort jetzt mit etwas Glück selbst sehen und fotografieren
  können – in Gärten, Parks, am Wasser oder am Strand. Keine seltenen, gefährlichen oder streng geschützten Arten,
  keine Haustiere. Möglichst verschiedene Tiergruppen.
  titel: 2–4 Wörter (z. B. "Geckos auf Jagd"), text: 1–2 kurze, freundliche Sätze, was die Tiere jetzt tun,
  wo: höchstens 6 Wörter, gruppe: passende Gruppe,
  gattungen: 1–10 wissenschaftliche Gattungsnamen (oder "gattung art") in Kleinbuchstaben, die dazu passen –
  daran erkennt die App, ob ein Fund dazugehört.
- schauspiele: 2 Naturschauspiele zum Staunen, die es dort jetzt gibt. kurz: ein passendes Emoji + 1–3 Wörter.
- hilfe: 3 oder 4 konkrete Tipps, wie man Tieren dort jetzt helfen kann.
Schreibe nur, was du sicher weißt.`;

const SAISON_ITEM = {
  type: 'object',
  additionalProperties: false,
  required: ['titel', 'text', 'wo'],
  properties: { titel: TEXT, text: TEXT, wo: TEXT },
};
const SAISON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'stimmung', 'start_monat', 'end_monat', 'tiere', 'schauspiele', 'hilfe'],
  properties: {
    name: TEXT,
    stimmung: { type: 'string', enum: ['fruehling', 'sommer', 'herbst', 'winter', 'regen', 'trocken'] },
    start_monat: { type: 'integer' },
    end_monat: { type: 'integer' },
    tiere: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['titel', 'text', 'wo', 'gruppe', 'gattungen'],
        properties: {
          titel: TEXT,
          text: TEXT,
          wo: TEXT,
          gruppe: { type: 'string', enum: ['mam', 'bird', 'ins', 'amp', 'mol', 'ara', 'fish', 'rep'] },
          gattungen: { type: 'array', items: TEXT },
        },
      },
    },
    schauspiele: {
      type: 'array',
      items: { ...SAISON_ITEM, required: ['kurz', 'titel', 'text', 'wo'], properties: { kurz: TEXT, ...SAISON_ITEM.properties } },
    },
    hilfe: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['titel', 'text'], properties: { titel: TEXT, text: TEXT } },
    },
  },
};

// Antwort prüfen und kürzen; null, wenn sie nicht brauchbar ist
function cleanSaison(d) {
  const str = (v, n) => String(v || '').trim().slice(0, n);
  const month = (v) => (Number.isInteger(v) && v >= 1 && v <= 12 ? v : null);
  if (!d || !Array.isArray(d.tiere) || d.tiere.length < 4) return null;
  const tiere = d.tiere.slice(0, 4).map((t) => ({
    titel: str(t.titel, 60),
    text: str(t.text, 300),
    wo: str(t.wo, 80),
    gruppe: t.gruppe,
    gattungen: (Array.isArray(t.gattungen) ? t.gattungen : [])
      .map((g) => String(g).trim().toLowerCase())
      .filter((g) => /^[a-z]+( [a-z-]+)?$/.test(g))
      .slice(0, 12),
  }));
  if (tiere.some((t) => !t.titel || !t.text || !t.gattungen.length)) return null;
  return {
    name: str(d.name, 60),
    stimmung: d.stimmung,
    start_monat: month(d.start_monat),
    end_monat: month(d.end_monat),
    tiere,
    schauspiele: (Array.isArray(d.schauspiele) ? d.schauspiele : []).slice(0, 3).map((x) => ({
      kurz: str(x.kurz, 30),
      titel: str(x.titel, 60),
      text: str(x.text, 300),
      wo: str(x.wo, 80),
    })),
    hilfe: (Array.isArray(d.hilfe) ? d.hilfe : []).slice(0, 4).map((x) => ({ titel: str(x.titel, 60), text: str(x.text, 300) })),
  };
}

const LANGUAGES = { de: 'Deutsch', en: 'Englisch', fr: 'Französisch', es: 'Spanisch' };

function languageRule(lang) {
  const name = LANGUAGES[lang] || LANGUAGES.de;
  return `\n\nSchreibe alle Texte auf ${name}. Die Werte für "gruppe" und "sicherheit" bleiben genau wie im Schema vorgegeben.`;
}

// ---------- Übersetzen gespeicherter Funde (nach einem Sprachwechsel in der App) ----------

const TRANSLATE_SYSTEM = `Du bist der Tierexperte der App Findimal. Du bekommst die Texte eines Tier-Steckbriefs als JSON
und übersetzt jeden Wert in die Zielsprache. Tier- und Rassennamen: der übliche Name in der Zielsprache
(z. B. "Amsel" -> "Blackbird", "Mischling" -> "Mixed breed"). Bleib freundlich und gut verständlich für Kinder
und Erwachsene, ändere keine Fakten und lass leere Werte leer.`;
const TRANSLATE_FIELDS = ['name', 'rasse', 'kurzbeschreibung', 'wusstest_du', 'hinweis', ...DETAILS_FIELDS];

// ---------- 3. Rangliste mit Freunden ----------

const CODE = /^[A-HJ-NP-Z2-9]{6}$/; // Freundescode, z. B. "K7QX2M" (ohne 0/O und 1/I)
const int = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const TOP_SIZE = 100;
const publicEntry = (id, e) => ({ id, name: e.name, xp: e.xp, level: e.level, species: e.species, avatar: e.avatar });

// Weltweite Bestenliste als eine Liste (KV kann nicht sortieren). entry = null entfernt den Eintrag.
// Spitznamen prüfen: keine Schimpfwörter, keine Links, E-Mails oder Telefonnummern
// (Kinder nutzen die App). Ungeeignete Namen werden durch "Entdecker" ersetzt.
const BAD_WORDS = [
  'fick', 'hure', 'nutte', 'wichs', 'wixx', 'arschloch', 'fotze', 'schlampe', 'missgeburt', 'spast',
  'schwuchtel', 'neger', 'nazi', 'hitler', 'kanake', 'bumsen', 'porno', 'titten', 'muschi', 'penis', 'vagina',
  'fuck', 'shit', 'bitch', 'cunt', 'cock', 'pussy', 'nigg', 'faggot', 'whore', 'slut', 'rape', 'porn',
  'sex', 'putain', 'merde', 'salope', 'puta', 'mierda', 'cabron', 'polla',
];
function cleanName(raw) {
  const name = String(raw || '').replace(/[\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);
  if (!name) return 'Entdecker';
  const flat = name
    .toLowerCase()
    .replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/@/g, 'a')
    .replace(/[^a-zäöüß]/g, '');
  const contact = /(https?:|www\.|\.(com|de|net|org)\b|@|\d{5,})/i.test(name.replace(/\s/g, ''));
  if (contact || BAD_WORDS.some((w) => flat.includes(w))) return 'Entdecker';
  return name;
}

async function updateTop(env, id, entry) {
  const top = (await env.DB.get('top', 'json')) || [];
  const was = top.some((x) => x.id === id);
  const rest = top.filter((x) => x.id !== id);
  const fits = entry && !entry.hidden && (rest.length < TOP_SIZE || entry.xp > rest[rest.length - 1].xp);
  if (!was && !fits) return; // nichts zu ändern (spart Schreibzugriffe)
  const next = fits ? [...rest, publicEntry(id, entry)].sort((a, b) => b.xp - a.xp).slice(0, TOP_SIZE) : rest;
  await env.DB.put('top', JSON.stringify(next));
}

async function board(env, body, request) {
  if (!env.DB) return json({ fehler: 'keine_datenbank' }, 503);

  if (body.mode === 'board_top') {
    return json({ people: (await env.DB.get('top', 'json')) || [] });
  }

  // Alles außer "board_get" braucht Code + Geheimnis (nur der Besitzer darf seinen Eintrag ändern)
  if (body.mode !== 'board_get') {
    const id = String(body.id || '');
    const secret = String(body.secret || '');
    if (!CODE.test(id) || secret.length < 16 || secret.length > 64) return json({ fehler: 'Ungültig.' }, 400);
    const hash = await sha256(secret);
    const old = await env.DB.get('p:' + id, 'json');
    if (old && old.hash !== hash) return json({ fehler: 'Code vergeben.' }, 403);

    if (body.mode === 'board_save') {
      const entry = {
        hash,
        name: cleanName(body.name),
        xp: int(body.xp, 1_000_000),
        level: int(body.level, 100),
        species: int(body.species, 100_000),
        // "u:<Code>.…" (eigenes Foto) setzt nur board_photo – und nur für den eigenen Code
        avatar: ((a) => (a.startsWith('u:') && !a.startsWith(`u:${id}.`) ? '' : a))(String(body.avatar || '').slice(0, 20)),
        updated: Date.now(),
        created: old ? old.created || 0 : Date.now(), // seit wann dabei (für den Einladungs-Bonus)
        dev: deviceOf(request) || (old && old.dev) || '', // Handy (nur für den Bonus, nie öffentlich)
        ...(old && old.hidden ? { hidden: true } : {}), // nach Meldungen ausgeblendet: bleibt so
      };
      await env.DB.put('p:' + id, JSON.stringify(entry));
      await updateTop(env, id, entry);
      return json({ ok: true });
    }
    if (!old) return json({ fehler: 'Unbekannt.' }, 404);

    if (body.mode === 'board_photo') return boardPhoto(env, body, id, old);
    if (body.mode === 'board_delete') {
      await env.DB.delete('p:' + id);
      await env.DB.delete('f:' + id);
      await env.DB.delete('ph:' + id);
      await env.DB.delete('rq:' + id);
      await updateTop(env, id, null);
      return json({ ok: true });
    }
    // Freund hinzugefügt: beim Freund vermerken, damit er einen auch sieht
    if (body.mode === 'board_link') {
      const friend = String(body.friend || '');
      if (!CODE.test(friend) || friend === id) return json({ fehler: 'Ungültig.' }, 400);
      const list = (await env.DB.get('f:' + friend, 'json')) || [];
      if (!list.includes(id)) await env.DB.put('f:' + friend, JSON.stringify([...list, id].slice(-200)));
      // Einladungs-Bonus: wer neu dabei ist und einen Freund hinzufügt, der schon länger dabei ist,
      // bekommt mit ihm je 1 Gratis-Foto extra. Pro Handy nur einmal, pro Einladendem höchstens 10-mal.
      let bonus = false;
      const dev = deviceOf(request);
      const inviter = await env.DB.get('p:' + friend, 'json');
      const isNew = old.created && Date.now() - old.created < 3 * 24 * 60 * 60 * 1000;
      if (dev && inviter && isNew && (inviter.created || 0) < old.created && inviter.dev !== dev) {
        if (!(await env.DB.get('invited:' + dev))) {
          await env.DB.put('invited:' + dev, friend);
          await addBonus(env, dev);
          // höchstens 10 Boni pro einladendem Handy (nicht pro Code – Codes kann man neu würfeln)
          const n = inviter.dev ? Number(await env.DB.get('invdev:' + inviter.dev)) || 0 : 10;
          if (n < 10) {
            await env.DB.put('invdev:' + inviter.dev, String(n + 1));
            await addBonus(env, inviter.dev);
          }
          bonus = true;
        }
      }
      return json({ ok: true, bonus });
    }
    // Eintrag melden: nach 3 Meldungen von verschiedenen Leuten verschwindet er aus der weltweiten Liste.
    // Gemeldete Einträge stehen im KV-Speicher unter "rep:<Code>" (zum Nachschauen in Cloudflare).
    if (body.mode === 'board_report') {
      const target = String(body.target || '');
      if (!CODE.test(target) || target === id) return json({ fehler: 'Ungültig.' }, 400);
      const reporters = (await env.DB.get('rep:' + target, 'json')) || [];
      if (!reporters.includes(id)) {
        reporters.push(id);
        await env.DB.put('rep:' + target, JSON.stringify(reporters.slice(-50)));
      }
      if (reporters.length >= 3) {
        const entry = await env.DB.get('p:' + target, 'json');
        if (entry && !entry.hidden) {
          await env.DB.put('p:' + target, JSON.stringify({ ...entry, hidden: true }));
          await updateTop(env, target, null);
        }
      }
      return json({ ok: true });
    }
    // Freundschaftsanfrage (z. B. aus der weltweiten Liste): der andere muss erst zustimmen.
    // Offene Anfragen an <Code> stehen unter "rq:<Code>". Hat der andere mich schon hinzugefügt, gilt es sofort.
    if (body.mode === 'board_request') {
      const friend = String(body.friend || '');
      if (!CODE.test(friend) || friend === id) return json({ fehler: 'Ungültig.' }, 400);
      if (!(await env.DB.get('p:' + friend))) return json({ fehler: 'Unbekannt.' }, 404);
      const mine = (await env.DB.get('f:' + id, 'json')) || [];
      if (mine.includes(friend)) {
        const theirs = (await env.DB.get('f:' + friend, 'json')) || [];
        if (!theirs.includes(id)) await env.DB.put('f:' + friend, JSON.stringify([...theirs, id].slice(-200)));
        return json({ ok: true, status: 'linked' });
      }
      const open = (await env.DB.get('rq:' + friend, 'json')) || [];
      if (!open.includes(id)) await env.DB.put('rq:' + friend, JSON.stringify([...open, id].slice(-100)));
      return json({ ok: true, status: 'requested' });
    }
    // Anfrage beantworten: angenommen -> der Anfragende sieht mich ab jetzt (über seinen Eingang)
    if (body.mode === 'board_answer') {
      const from = String(body.from || '');
      if (!CODE.test(from)) return json({ fehler: 'Ungültig.' }, 400);
      const open = (await env.DB.get('rq:' + id, 'json')) || [];
      if (open.includes(from)) await env.DB.put('rq:' + id, JSON.stringify(open.filter((x) => x !== from)));
      if (body.accept) {
        const theirs = (await env.DB.get('f:' + from, 'json')) || [];
        if (!theirs.includes(id)) await env.DB.put('f:' + from, JSON.stringify([...theirs, id].slice(-200)));
      }
      return json({ ok: true });
    }
    // Wer hat mich hinzugefügt – und wer fragt noch an?
    if (body.mode === 'board_inbox') {
      const dev = deviceOf(request);
      const bonus = dev ? Number(await env.DB.get('bonus:' + dev)) || 0 : 0; // offene Extra-Fotos
      const [ids, requests] = await Promise.all([env.DB.get('f:' + id, 'json'), env.DB.get('rq:' + id, 'json')]);
      return json({ ids: ids || [], bonus, requests: requests || [] });
    }
    return json({ fehler: 'Ungültig.' }, 400);
  }

  // Einträge zu einer Liste von Freundescodes holen
  const ids = (Array.isArray(body.ids) ? body.ids : []).map(String).filter((i) => CODE.test(i)).slice(0, 50);
  const entries = await Promise.all(ids.map((id) => env.DB.get('p:' + id, 'json')));
  const people = [];
  entries.forEach((e, i) => {
    if (e) people.push(publicEntry(ids[i], e));
  });
  return json({ people });
}

// Eigenes Foto als Profilbild (Plus): kleines JPEG (höchstens 40 KB), vorher prüft die KI, ob es für eine
// Kinder-App passt (Tier oder Natur, keine Menschen, nichts Unangemessenes). Höchstens 5 Versuche am Tag.
// Gespeichert unter "ph:<Code>"; im Eintrag steht dann avatar "u:<Code>.<Kennung>" (Kennung ändert sich
// mit jedem neuen Bild, damit Handys nicht das alte aus dem Zwischenspeicher zeigen).
const PHOTO_SYSTEM =
  'Du prüfst Profilbilder für eine Tier-Entdecker-App, die auch Kinder nutzen. Erlaubt ist ein Foto, das vor allem ' +
  'ein Tier oder Natur zeigt. Nicht erlaubt: erkennbare Menschen oder Gesichter (auch Teile wie Hände sind okay, ' +
  'Gesichter nicht), Schrift oder Logos als Hauptmotiv, Gewalt, Blut, tote oder verletzte Tiere in Großaufnahme, ' +
  'Nacktheit oder sonst Unangemessenes. Antworte nur mit dem JSON.';
const PHOTO_SCHEMA = {
  type: 'object',
  properties: { erlaubt: { type: 'boolean' } },
  required: ['erlaubt'],
  additionalProperties: false,
};
async function boardPhoto(env, body, id, old) {
  if (!old) return json({ fehler: 'Unbekannt.' }, 404);
  const image = String(body.image || '');
  if (!/^[A-Za-z0-9+/=]+$/.test(image) || image.length > 55_000 || !image.startsWith('/9j/')) return json({ fehler: 'Kein passendes Bild.' }, 400);
  const day = new Date().toISOString().slice(0, 10);
  const countKey = `phc:${day}:${id}`;
  const tries = Number(await env.DB.get(countKey)) || 0;
  if (tries >= 5) return json({ fehler: 'Heute schon oft gewechselt.' }, 429);
  await safePut(env, countKey, String(tries + 1), { expirationTtl: 60 * 60 * 26 });
  const r = await claude(env, CHEAP_MODEL, PHOTO_SYSTEM, PHOTO_SCHEMA, [
    { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
    { type: 'text', text: 'Ist dieses Profilbild erlaubt?' },
  ], 10_000);
  if (r.error) return r.error;
  if (!r.data.erlaubt) return json({ ok: false, grund: 'nicht_erlaubt' });
  await env.DB.put('ph:' + id, image);
  const avatar = `u:${id}.${(await sha256(image)).slice(0, 8)}`;
  const entry = { ...old, avatar, updated: Date.now() };
  await env.DB.put('p:' + id, JSON.stringify(entry));
  await updateTop(env, id, entry);
  return json({ ok: true, avatar });
}

// Profilbild-Foto ausliefern (GET /profilbild/<Code>) – nicht bei ausgeblendeten (gemeldeten) Einträgen
async function photoResponse(env, id) {
  if (!env.DB || !CODE.test(id)) return new Response('', { status: 404, headers: CORS });
  const [image, entry] = await Promise.all([env.DB.get('ph:' + id), env.DB.get('p:' + id, 'json')]);
  if (!image || !entry || entry.hidden || !String(entry.avatar || '').startsWith('u:')) return new Response('', { status: 404, headers: CORS });
  const bytes = Uint8Array.from(atob(image), (c) => c.charCodeAt(0));
  return new Response(bytes, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400', ...CORS } });
}

// Einladungsseite: https-Link aus WhatsApp & Co. -> öffnet Findimal (Expo Go) mit dem Freundescode
// App-Symbol (Fuchs, 256 × 256) für Link-Vorschauen (iMessage, WhatsApp …) und die Webseiten
const ICON_PNG = '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';
function iconResponse() {
  const bin = Uint8Array.from(atob(ICON_PNG), (c) => c.charCodeAt(0));
  return new Response(bin, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=604800' } });
}

const INVITE_TEXT = {
  de: ['lädt dich zu Findimal ein!', 'Sammelt zusammen Tiere und vergleicht eure Punkte. Ihr bekommt beide 1 Gratis-Foto extra und 50 XP.', 'Findimal öffnen', 'Du brauchst die App „Expo Go“:', 'Expo Go im App Store', 'Freundescode'],
  en: ['invites you to Findimal!', 'Collect animals together and compare your points. You both get 1 extra free photo and 50 XP.', 'Open Findimal', 'You need the “Expo Go” app:', 'Expo Go on the App Store', 'Friend code'],
  fr: ['t’invite sur Findimal !', 'Collectionnez des animaux ensemble et comparez vos points. Vous recevez tous les deux 1 photo gratuite en plus et 50 XP.', 'Ouvrir Findimal', 'Il te faut l’app « Expo Go » :', 'Expo Go sur l’App Store', 'Code ami'],
  es: ['te invita a Findimal!', 'Coleccionad animales juntos y comparad vuestros puntos. Los dos recibís 1 foto gratis extra y 50 XP.', 'Abrir Findimal', 'Necesitas la app «Expo Go»:', 'Expo Go en la App Store', 'Código de amigo'],
};
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function invitePage(url) {
  const code = (url.searchParams.get('c') || '').toUpperCase();
  const name = (url.searchParams.get('n') || 'Jemand').slice(0, 20);
  const app = url.searchParams.get('u') || '';
  const tx = INVITE_TEXT[url.searchParams.get('l')] || INVITE_TEXT.de;
  // nur Links in Findimal bzw. Expo Go erlauben (keine Weiterleitung auf fremde Seiten)
  const ok = CODE.test(code) && /^(exps?|findimal):\/\//.test(app);
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(name)} ${esc(tx[0])}</title>
<meta property="og:title" content="${esc(name)} ${esc(tx[0])}"><meta property="og:description" content="${esc(tx[1])}">
<meta property="og:image" content="${url.origin}/icon.png"><meta property="og:site_name" content="Findimal">
<link rel="apple-touch-icon" href="/icon.png"><link rel="icon" href="/icon.png"><style>
body{margin:0;font-family:-apple-system,system-ui,sans-serif;background:#143F2A;color:#fff;text-align:center;padding:48px 20px}
img.logo{width:96px;height:96px;border-radius:22px;margin-bottom:16px}
h1{font-size:26px;margin:0 0 8px}p{opacity:.85;line-height:1.4}
a.b{display:inline-block;margin:22px 0;background:#E8833A;color:#13261C;font-weight:700;font-size:18px;padding:15px 28px;border-radius:16px;text-decoration:none}
.c{font-size:26px;letter-spacing:3px;font-weight:700;color:#FFD2A8}small a{color:#FFD2A8}</style></head><body>
<img class="logo" src="/icon.png" alt=""><h1>${esc(name)} ${esc(tx[0])}</h1><p>${esc(tx[1])}</p>
${ok ? `<a class="b" href="${esc(app)}">${esc(tx[2])}</a>` : ''}
<p>${esc(tx[5])}</p><div class="c">${esc(code.slice(0, 3))} ${esc(code.slice(3, 6))}</div>
<p><small>${esc(tx[3])} <a href="https://apps.apple.com/app/expo-go/id982107779">${esc(tx[4])}</a></small></p>
</body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ---------- Datenschutz und Impressum ----------
// Erreichbar unter /datenschutz (Deutsch) und /datenschutz?l=en (Englisch).
// Name und Anschrift kommen aus den Cloudflare-Variablen IMPRESSUM_NAME und IMPRESSUM_ADRESSE
// (nicht im öffentlichen GitHub-Code). Fehlen sie, erscheinen die Platzhalter unten.
const OPERATOR = {
  name: '[Vor- und Nachname]',
  address: '[Straße und Hausnummer], [PLZ Ort], Deutschland',
  email: 'findimal26@gmail.com',
};
const PRIVACY_DATE = {
  de: 'Stand: Oktober 2026',
  en: 'Last updated: October 2026',
  fr: 'Mise à jour : octobre 2026',
  es: 'Actualizado: octubre de 2026',
};

const PRIVACY = {
  de: {
    title: 'Datenschutz und Impressum',
    sections: [
      ['Kurz gesagt', `<ul>
<li>Für Findimal brauchst du kein Konto, keine E-Mail-Adresse und keinen echten Namen.</li>
<li>Deine Funde und Fotos bleiben auf deinem Handy.</li>
<li>Nur das Foto, das du bestimmen lässt, geht kurz an unseren Server und an den KI-Dienst Anthropic. Wir speichern es dort nicht.</li>
<li>In der Rangliste stehen nur Spitzname, Punkte und Profilbild – keine Orte. Wählst du mit Plus ein eigenes Tierfoto als Profilbild, wird davon ein kleines Vorschaubild gespeichert und für die Rangliste gezeigt; vorher wird automatisch geprüft, dass darauf keine Menschen zu sehen sind. Du kannst die Rangliste im Profil jederzeit ausschalten – dann wird auch das Bild gelöscht.</li>
</ul>`],
      ['Fotos zur Tierbestimmung', `<p>Wenn du ein Foto bestimmen lässt, schickt die App eine verkleinerte Kopie des Fotos – ohne Ortsangaben – an den Findimal-Server, dazu höchstens die grobe Gegend („Mitteleuropa“ oder „Mittelmeerraum“), damit die KI ähnliche Arten besser unterscheiden kann. Er leitet das Foto an die KI von Anthropic PBC (USA) weiter und schickt das Ergebnis zurück. Der Findimal-Server speichert das Foto nicht. Anthropic verarbeitet die Daten nach seinen Geschäftsbedingungen für Unternehmenskunden: Sie werden nicht zum Training der KI verwendet und nur für begrenzte Zeit gespeichert, z. B. zur Erkennung von Missbrauch. Die Übermittlung in die USA erfolgt auf Grundlage geeigneter Garantien (EU-Standardvertragsklauseln bzw. EU-US Data Privacy Framework).</p>
<p>Zweck: die Bestimmung, die du anforderst. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Nutzung der App-Funktion).</p>
<p>Bitte fotografiere keine Menschen, Gesichter oder Autokennzeichen.</p>`],
      ['Was auf deinem Handy bleibt', `<p>Deine Sammlung (Fotos, Tiernamen, Datum), dein Name, deine Quiz-Antworten, Einstellungen und Abzeichen werden nur auf deinem Handy gespeichert. Mit „Profil zurücksetzen“ im Profil oder durch Löschen der App sind sie weg.</p>
<p><b>Region:</b> Für „Jetzt in deiner Nähe“ gibst du deine Region selbst ein. Wenn du sie per Standort bestimmen lässt, ermittelt das iPhone den Ortsnamen über den Ortsdienst von Apple. Gespeichert wird nur der Ortsname, auf deinem Handy. Tippst du die Region selbst ein, fragt das iPhone den Ortsdienst von Apple nur, in welchem Land sie liegt; gespeichert wird davon nur das Land (für die Saison-Seite). Genauso bekommt jeder Fund den Namen des Ortes, an dem das Foto entstand – aus deinem Standort (nur wenn du ihn erlaubt hast), sonst aus dem Ort, den du in der App angegeben hast. Du kannst ihn bei jedem Fund ändern. Ortsdaten in deinen Fotos liest Findimal nicht. Auch hier wird nur der Name gespeichert, nie die genaue Position, und er bleibt auf deinem Handy.</p>`],
      ['„Jetzt in deiner Nähe“', `<p>Für die Tipps auf der Startseite schickt die App die Region, die du selbst eingetragen hast (z. B. „München“), die Tageszeit und die Sprache an den Server. Das Ergebnis wird bis zu 26 Stunden zwischengespeichert und für alle Nutzer derselben Region verwendet. Ein Bezug zu dir wird nicht gespeichert.</p>`],
      ['Saison in deinem Land', `<p>Bist du außerhalb Mitteleuropas, schickt die App für die Saison-Seite nur dein Land (z. B. „TH“ für Thailand), den Monat und die Sprache an den Server. Die KI beschreibt daraus einmal die Jahreszeit dort; das Ergebnis wird gespeichert und für alle Nutzer aus diesem Land verwendet. Ein Ort oder dein Gerät wird dabei nicht übertragen.</p>`],
      ['Beliebteste Tiere der Saison', `<p>Wenn ein Wildtier bestimmt wird, zählt der Server anonym mit, welche Tierart es war und in welcher Jahreszeit – ohne Foto, Gerät, Ort oder Namen. Daraus entsteht die Liste der am häufigsten entdeckten Tiere auf der Saison-Seite. Haustiere werden nicht gezählt. Ein Bezug zu dir ist nicht möglich.</p>`],
      ['Tageslimit für Gratis-Fotos', `<p>Damit Gratis-Fotos begrenzt werden können, erzeugt die App eine zufällige Kennung für dein Handy. Der Server zählt damit, wie viele Fotos am Tag bestimmt wurden. Ohne Kennung wird ersatzweise die IP-Adresse verwendet. Die Zähler werden nach 48 Stunden automatisch gelöscht. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Schutz vor Missbrauch und unbegrenzten Kosten).</p>`],
      ['Rangliste', `<p>Wer sich bei der Einrichtung einen Entdecker-Namen (Spitznamen) gibt, ist automatisch in der Rangliste dabei; du kannst das jederzeit im Profil mit „In der Rangliste zeigen“ ausschalten. Wenn du bei der Rangliste dabei bist, speichert der Server deinen Spitznamen, deine Punkte (XP), Stufe, Zahl der Arten, dein Profilbild, deinen Freundescode und mit wem du befreundet bist. Freunde sehen diese Angaben; die 100 Entdecker mit den meisten Punkten erscheinen in der weltweiten Rangliste. Spitznamen mit Schimpfwörtern, Links oder Telefonnummern werden automatisch durch „Entdecker“ ersetzt. Meldest du einen Eintrag, speichern wir deinen Freundescode beim gemeldeten Eintrag; nach mehreren Meldungen wird er ausgeblendet. Für den Einladungs-Bonus (ein Gratis-Foto extra) speichert der Server außerdem die zufällige Kennung deines Handys bei deinem Eintrag und merkt sich, dass dieses Handy den Bonus schon bekommen hat; die Kennung ist für niemanden sichtbar. Mit „Rangliste verlassen“ wird dein Eintrag gelöscht. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer gemeinsamen Rangliste als Teil des Spiels); du kannst jederzeit widersprechen, indem du die Rangliste im Profil ausschaltest. Wer selbst über „Mitmachen“ beitritt, tut das mit Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).</p>`],
      ['Server bei Cloudflare', `<p>Der Findimal-Server läuft bei Cloudflare, Inc. (USA) als Auftragsverarbeiter. Dabei wird technisch bedingt deine IP-Adresse verarbeitet. Cloudflare ist unter dem EU-US Data Privacy Framework zertifiziert.</p>`],
      ['Werbung', `<p>In der kostenlosen Version zeigt Findimal einige kleine, als „Anzeige“ gekennzeichnete Werbeplätze. In der Testversion sind das nur Platzhalter. In der fertigen App kommen die Anzeigen von Google AdMob (Google Ireland Ltd.) und sind <b>nicht personalisiert</b> und familiengeeignet eingestellt. Google verarbeitet dabei technische Daten wie IP-Adresse und Gerätetyp, um die Anzeige auszuliefern und Betrug zu verhindern. Mit Findimal Plus gibt es keine Werbung. Diese Erklärung wird ergänzt, sobald die Werbung eingebaut ist.</p>`],
      ['Käufe (Findimal Plus)', `<p>Das Abo wird über Apple abgeschlossen und bezahlt. Wir erhalten keine Zahlungsdaten, sondern nur die Bestätigung, dass ein Abo besteht.</p>`],
      ['Kinder', `<p>Findimal ist für Familien gedacht. Die App verlangt keine persönlichen Angaben; als Spitzname reicht ein Fantasiename. Wir empfehlen, dass Eltern Kinder unter 16 Jahren bei der Nutzung der Rangliste begleiten.</p>`],
      ['Deine Rechte', `<p>Du hast das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung, auf Datenübertragbarkeit, auf Widerspruch und auf Widerruf einer Einwilligung. Schreib uns dazu an die oben genannte E-Mail-Adresse. Du kannst dich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren, z. B. beim Bayerischen Landesamt für Datenschutzaufsicht.</p>
<p>Weil fast alles nur auf deinem Handy liegt, kannst du die meisten Daten selbst löschen: „Profil zurücksetzen“ im Profil, „Rangliste verlassen“ in den Challenges oder die App löschen.</p>`],
      ['Verantwortlich', `<p>Name und Anschrift findest du im Impressum direkt darunter. E-Mail: {EMAIL}</p>`],
      ['Impressum', `<p>Angaben gemäß § 5 DDG:<br>{OPERATOR}</p>`],
    ],
  },
  en: {
    title: 'Privacy policy and legal notice',
    sections: [
      ['In short', `<ul>
<li>Findimal needs no account, no email address and no real name.</li>
<li>Your finds and photos stay on your phone.</li>
<li>Only the photo you want identified is sent briefly to our server and to the AI service Anthropic. We do not store it there.</li>
<li>The leaderboard only shows nickname, points and profile picture – no locations. If you choose one of your own animal photos as your profile picture with Plus, a small thumbnail is stored and shown in the leaderboard; it is checked automatically beforehand to make sure no people are visible. You can turn off the leaderboard in your profile at any time – the picture is then deleted too.</li>
</ul>`],
      ['Photos for identification', `<p>When you identify a photo, the app sends a reduced copy – without location data – to the Findimal server, plus at most the rough area (“Central Europe” or “Mediterranean”) so the AI can tell similar species apart. It forwards the photo to the AI of Anthropic PBC (USA) and returns the result. The Findimal server does not store the photo. Anthropic processes the data under its commercial terms: it is not used to train the AI and is kept only for a limited time, e.g. to detect abuse. Transfers to the USA are based on appropriate safeguards (EU standard contractual clauses or the EU-US Data Privacy Framework).</p>
<p>Purpose: the identification you request. Legal basis: Art. 6(1)(b) GDPR (use of the app feature).</p>
<p>Please do not photograph people, faces or licence plates.</p>`],
      ['What stays on your phone', `<p>Your collection (photos, animal names, date), your name, quiz answers, settings and badges are stored only on your phone. “Reset profile” in your profile or deleting the app removes them.</p>
<p><b>Region:</b> For “Near you now” you enter your region yourself. If you let the app detect it, the iPhone looks up the place name using Apple's location service. Only the place name is stored, on your phone. If you type the region yourself, the iPhone only asks Apple's location service which country it is in; only the country is stored (for the season page). In the same way, each find gets the name of the place where the photo was taken – from your location (only if you allowed it), otherwise from the place you entered in the app. You can change it for every find. Findimal does not read location data stored in your photos. Here too only the name is stored, never the exact position, and it stays on your phone.</p>`],
      ['“Near you now”', `<p>For the tips on the home screen, the app sends the region you entered yourself (e.g. “Munich”), the time of day and the language to the server. The result is cached for up to 26 hours and shared by all users of that region. Nothing linking it to you is stored.</p>`],
      ['Season in your country', `<p>If you are outside Central Europe, the app sends only your country (e.g. “TH” for Thailand), the month and the language to the server for the season page. The AI describes the season there once; the result is stored and used for all users from that country. No place and no device information is sent.</p>`],
      ['Most spotted animals of the season', `<p>When a wild animal is identified, the server anonymously counts which species it was and in which season – without photo, device, place or name. This makes the list of the most spotted animals on the Season page. Pets are not counted. It cannot be linked to you.</p>`],
      ['Daily limit for free photos', `<p>To limit free photos, the app creates a random identifier for your phone. The server uses it to count how many photos were identified per day; without it, the IP address is used instead. The counters are deleted automatically after 48 hours. Legal basis: Art. 6(1)(f) GDPR (protection against abuse and unlimited costs).</p>`],
      ['Leaderboard', `<p>If you choose an explorer name (nickname) during setup, you appear on the leaderboard automatically; you can turn this off at any time in your profile with “Show me on the leaderboard”. If you are on the leaderboard, the server stores your nickname, points (XP), level, number of species, profile picture, friend code and who your friends are. Friends can see this; the top 100 explorers appear on the worldwide leaderboard. Nicknames with swear words, links or phone numbers are automatically replaced with “Entdecker”. If you report an entry, we store your friend code with the reported entry; after several reports it is hidden. For the invite bonus (one extra free photo), the server also stores your phone’s random identifier with your entry and remembers that this phone has already received the bonus; the identifier is never shown to anyone. “Leave leaderboard” deletes your entry. Legal basis: Art. 6(1)(f) GDPR (legitimate interest in a shared leaderboard as part of the game); you can object at any time by turning the leaderboard off in your profile. If you join yourself via “Join”, you do so with consent (Art. 6(1)(a) GDPR).</p>`],
      ['Server at Cloudflare', `<p>The Findimal server runs at Cloudflare, Inc. (USA) as a processor. Your IP address is processed for technical reasons. Cloudflare is certified under the EU-US Data Privacy Framework.</p>`],
      ['Advertising', `<p>The free version shows a few small spaces marked “Ad”. In the test version these are placeholders only. In the finished app, ads come from Google AdMob (Google Ireland Ltd.) and are set to <b>non-personalised</b> and family-friendly. Google processes technical data such as IP address and device type to deliver ads and prevent fraud. Findimal Plus has no ads. This policy will be updated once ads are added.</p>`],
      ['Purchases (Findimal Plus)', `<p>The subscription is purchased and paid through Apple. We receive no payment data, only confirmation that a subscription exists.</p>`],
      ['Children', `<p>Findimal is made for families. The app asks for no personal data; a made-up nickname is enough. We recommend that parents accompany children under 16 when using the leaderboard.</p>`],
      ['Your rights', `<p>You have the right of access, rectification, erasure, restriction of processing, data portability, objection and withdrawal of consent. Write to the email address above. You may also lodge a complaint with a data protection supervisory authority.</p>
<p>As almost everything is stored only on your phone, you can delete most data yourself: “Reset profile” in your profile, “Leave leaderboard” in Challenges, or delete the app.</p>`],
      ['Controller', `<p>Name and postal address: see the legal notice right below. Email: {EMAIL}</p>`],
      ['Legal notice', `<p>{OPERATOR}</p>`],
    ],
  },
  fr: {
    title: 'Confidentialité et mentions légales',
    sections: [
      ['En bref', `<ul>
<li>Findimal ne demande ni compte, ni adresse e-mail, ni vrai nom.</li>
<li>Tes trouvailles et tes photos restent sur ton téléphone.</li>
<li>Seule la photo que tu veux faire identifier est envoyée brièvement à notre serveur et au service d’IA Anthropic. Nous ne l’y conservons pas.</li>
<li>Dans le classement, on ne voit que ton pseudo, tes points et ta photo de profil – ni photos, ni lieux. Tu peux le désactiver à tout moment dans ton profil.</li>
</ul>`],
      ['Photos pour l’identification', `<p>Quand tu fais identifier une photo, l’app envoie une copie réduite – sans données de localisation – au serveur Findimal, avec au plus la zone approximative (« Europe centrale » ou « Méditerranée ») pour aider l’IA à distinguer les espèces proches. Il la transmet à l’IA d’Anthropic PBC (États-Unis) et renvoie le résultat. Le serveur Findimal ne conserve pas la photo. Anthropic traite les données selon ses conditions pour les clients professionnels : elles ne servent pas à entraîner l’IA et ne sont conservées que pour une durée limitée, par ex. pour détecter les abus. Le transfert vers les États-Unis repose sur des garanties appropriées (clauses contractuelles types de l’UE ou EU-US Data Privacy Framework).</p>
<p>Finalité : l’identification que tu demandes. Base juridique : art. 6, par. 1, point b du RGPD (utilisation de la fonction de l’app).</p>
<p>Merci de ne pas photographier de personnes, de visages ni de plaques d’immatriculation.</p>`],
      ['Ce qui reste sur ton téléphone', `<p>Ta collection (photos, noms des animaux, date), ton prénom, tes réponses au quiz, tes réglages et tes badges sont enregistrés uniquement sur ton téléphone. « Réinitialiser le profil » dans ton profil ou la suppression de l’app les efface.</p>
<p><b>Région :</b> pour « Près de toi maintenant », tu indiques toi-même ta région. Si tu la fais détecter, l’iPhone trouve le nom du lieu grâce au service de localisation d’Apple. Seul le nom du lieu est enregistré, sur ton téléphone. Si tu tapes la région toi-même, l’iPhone demande seulement au service de localisation d’Apple dans quel pays elle se trouve ; seul le pays est enregistré (pour la page Saison). De la même façon, chaque trouvaille reçoit le nom du lieu où la photo a été prise – grâce à ta position (seulement si tu l’as autorisée), sinon le lieu que tu as indiqué dans l’app. Tu peux le modifier pour chaque trouvaille. Findimal ne lit pas les données de lieu enregistrées dans tes photos. Là aussi, seul le nom est enregistré, jamais la position exacte, et il reste sur ton téléphone.</p>`],
      ['« Près de toi maintenant »', `<p>Pour les conseils de l’écran d’accueil, l’app envoie au serveur la région que tu as indiquée (par ex. « Lyon »), le moment de la journée et la langue. Le résultat est mis en cache jusqu’à 26 heures et partagé par tous les utilisateurs de cette région. Aucun lien avec toi n’est enregistré.</p>`],
      ['La saison dans ton pays', `<p>Si tu es hors d’Europe centrale, l’app envoie seulement ton pays (p. ex. « TH » pour la Thaïlande), le mois et la langue au serveur pour la page Saison. L’IA décrit une fois la saison là-bas ; le résultat est enregistré et utilisé pour tous les utilisateurs de ce pays. Aucun lieu ni appareil n’est transmis.</p>`],
      ['Animaux les plus repérés de la saison', `<p>Quand un animal sauvage est identifié, le serveur compte de façon anonyme de quelle espèce il s’agit et en quelle saison – sans photo, appareil, lieu ni nom. Cela donne la liste des animaux les plus repérés sur la page Saison. Les animaux de compagnie ne sont pas comptés. Aucun lien avec toi n’est possible.</p>`],
      ['Limite quotidienne de photos gratuites', `<p>Pour limiter les photos gratuites, l’app crée un identifiant aléatoire pour ton téléphone. Le serveur s’en sert pour compter les photos identifiées par jour ; à défaut, l’adresse IP est utilisée. Les compteurs sont supprimés automatiquement après 48 heures. Base juridique : art. 6, par. 1, point f du RGPD (protection contre les abus et les coûts illimités).</p>`],
      ['Classement', `<p>Si tu choisis un nom d’explorateur (pseudo) lors de la configuration, tu apparais automatiquement dans le classement ; tu peux le désactiver à tout moment dans ton profil avec « Apparaître dans le classement ». Si tu es dans le classement, le serveur enregistre ton pseudo, tes points (XP), ton niveau, le nombre d’espèces, ta photo de profil, ton code ami et tes amis. Tes amis voient ces informations ; les 100 explorateurs ayant le plus de points apparaissent dans le classement mondial. Les pseudos contenant des insultes, des liens ou des numéros de téléphone sont remplacés automatiquement par « Entdecker ». Si tu signales une entrée, nous enregistrons ton code ami avec l’entrée signalée ; après plusieurs signalements, elle est masquée. Pour le bonus d’invitation (une photo gratuite en plus), le serveur enregistre aussi l’identifiant aléatoire de ton téléphone avec ton entrée et retient que ce téléphone a déjà reçu le bonus ; l’identifiant n’est visible par personne. « Quitter le classement » supprime ton entrée. Base juridique : art. 6, par. 1, point f du RGPD (intérêt légitime à un classement commun dans le cadre du jeu) ; tu peux t’y opposer à tout moment en désactivant le classement dans ton profil. Si tu rejoins toi-même via « Participer », c’est avec ton consentement (art. 6, par. 1, point a du RGPD).</p>`],
      ['Serveur chez Cloudflare', `<p>Le serveur Findimal fonctionne chez Cloudflare, Inc. (États-Unis) en tant que sous-traitant. Ton adresse IP est traitée pour des raisons techniques. Cloudflare est certifié selon l’EU-US Data Privacy Framework.</p>`],
      ['Publicité', `<p>La version gratuite affiche quelques petits emplacements marqués « Publicité ». Dans la version de test, ce ne sont que des espaces réservés. Dans l’app finale, les publicités proviennent de Google AdMob (Google Ireland Ltd.) et sont réglées comme <b>non personnalisées</b> et adaptées aux familles. Google traite des données techniques comme l’adresse IP et le type d’appareil pour diffuser les publicités et prévenir la fraude. Findimal Plus est sans publicité. Cette politique sera complétée dès l’ajout de la publicité.</p>`],
      ['Achats (Findimal Plus)', `<p>L’abonnement est souscrit et payé via Apple. Nous ne recevons aucune donnée de paiement, seulement la confirmation qu’un abonnement existe.</p>`],
      ['Enfants', `<p>Findimal est conçu pour les familles. L’app ne demande aucune donnée personnelle ; un pseudo imaginaire suffit. Nous recommandons aux parents d’accompagner les enfants de moins de 16 ans lors de l’utilisation du classement.</p>`],
      ['Tes droits', `<p>Tu as le droit d’accès, de rectification, d’effacement, de limitation du traitement, de portabilité des données, d’opposition et de retrait de ton consentement. Écris-nous à l’adresse e-mail ci-dessus. Tu peux aussi introduire une réclamation auprès d’une autorité de protection des données, par ex. la CNIL.</p>
<p>Comme presque tout est enregistré uniquement sur ton téléphone, tu peux supprimer toi-même la plupart des données : « Réinitialiser le profil » dans ton profil, « Quitter le classement » dans Défis, ou supprimer l’app.</p>`],
      ['Responsable', `<p>Nom et adresse postale : voir les mentions légales juste en dessous. E-mail : {EMAIL}</p>`],
      ['Mentions légales', `<p>{OPERATOR}</p>`],
    ],
  },
  es: {
    title: 'Privacidad y aviso legal',
    sections: [
      ['En resumen', `<ul>
<li>Findimal no necesita cuenta, correo electrónico ni nombre real.</li>
<li>Tus hallazgos y tus fotos se quedan en tu móvil.</li>
<li>Solo la foto que quieres identificar se envía brevemente a nuestro servidor y al servicio de IA Anthropic. No la guardamos allí.</li>
<li>La clasificación solo muestra tu apodo, tus puntos y tu foto de perfil – ni fotos ni lugares. Puedes desactivarla en tu perfil en cualquier momento.</li>
</ul>`],
      ['Fotos para la identificación', `<p>Cuando identificas una foto, la app envía una copia reducida – sin datos de ubicación – al servidor de Findimal, y como mucho la zona aproximada («Europa Central» o «Mediterráneo») para que la IA distinga mejor especies parecidas. Este la reenvía a la IA de Anthropic PBC (EE. UU.) y devuelve el resultado. El servidor de Findimal no guarda la foto. Anthropic trata los datos según sus condiciones para clientes empresariales: no se usan para entrenar la IA y solo se conservan durante un tiempo limitado, p. ej. para detectar abusos. La transferencia a EE. UU. se basa en garantías adecuadas (cláusulas contractuales tipo de la UE o EU-US Data Privacy Framework).</p>
<p>Finalidad: la identificación que solicitas. Base jurídica: art. 6.1.b del RGPD (uso de la función de la app).</p>
<p>Por favor, no fotografíes personas, caras ni matrículas.</p>`],
      ['Lo que se queda en tu móvil', `<p>Tu colección (fotos, nombres de animales, fecha), tu nombre, tus respuestas del quiz, tus ajustes e insignias se guardan solo en tu móvil. «Restablecer perfil» en tu perfil o borrar la app los elimina.</p>
<p><b>Región:</b> para «Cerca de ti ahora» indicas tú mismo tu región. Si dejas que la app la detecte, el iPhone busca el nombre del lugar con el servicio de ubicación de Apple. Solo se guarda el nombre del lugar, en tu móvil. Si escribes la región tú mismo, el iPhone solo pregunta al servicio de ubicación de Apple en qué país está; solo se guarda el país (para la página de temporada). Del mismo modo, cada hallazgo recibe el nombre del lugar donde se hizo la foto, a partir de tu ubicación (solo si la permitiste) o, si no, del lugar que indicaste en la app. Puedes cambiarlo en cada hallazgo. Findimal no lee los datos de ubicación guardados en tus fotos. También aquí solo se guarda el nombre, nunca la posición exacta, y se queda en tu móvil.</p>`],
      ['«Cerca de ti ahora»', `<p>Para los consejos de la pantalla de inicio, la app envía al servidor la región que indicaste (p. ej. «Valencia»), el momento del día y el idioma. El resultado se guarda en caché hasta 26 horas y lo comparten todos los usuarios de esa región. No se guarda nada que lo relacione contigo.</p>`],
      ['La temporada en tu país', `<p>Si estás fuera de Europa Central, la app envía solo tu país (p. ej. «TH» para Tailandia), el mes y el idioma al servidor para la página de temporada. La IA describe una vez la temporada allí; el resultado se guarda y se usa para todos los usuarios de ese país. No se envía ningún lugar ni dato del dispositivo.</p>`],
      ['Animales más vistos de la temporada', `<p>Cuando se identifica un animal salvaje, el servidor cuenta de forma anónima qué especie era y en qué estación, sin foto, dispositivo, lugar ni nombre. Así se crea la lista de los animales más vistos en la página Temporada. Las mascotas no se cuentan. No es posible relacionarlo contigo.</p>`],
      ['Límite diario de fotos gratis', `<p>Para limitar las fotos gratis, la app crea un identificador aleatorio para tu móvil. El servidor lo usa para contar cuántas fotos se identifican al día; si no existe, se usa la dirección IP. Los contadores se borran automáticamente a las 48 horas. Base jurídica: art. 6.1.f del RGPD (protección contra abusos y costes ilimitados).</p>`],
      ['Clasificación', `<p>Si eliges un nombre de explorador (apodo) durante la configuración, apareces automáticamente en la clasificación; puedes desactivarlo cuando quieras en tu perfil con «Aparecer en la clasificación». Si estás en la clasificación, el servidor guarda tu apodo, tus puntos (XP), nivel, número de especies, foto de perfil, código de amigo y quiénes son tus amigos. Tus amigos ven estos datos; los 100 exploradores con más puntos aparecen en la clasificación mundial. Los apodos con insultos, enlaces o números de teléfono se sustituyen automáticamente por «Entdecker». Si denuncias una entrada, guardamos tu código de amigo junto a la entrada denunciada; tras varias denuncias se oculta. Para el bono por invitación (una foto gratis extra), el servidor guarda también el identificador aleatorio de tu móvil junto a tu entrada y recuerda que ese móvil ya recibió el bono; el identificador no lo ve nadie. «Salir de la clasificación» borra tu entrada. Base jurídica: art. 6.1.f del RGPD (interés legítimo en una clasificación común como parte del juego); puedes oponerte en cualquier momento desactivando la clasificación en tu perfil. Si te unes tú mismo con «Participar», lo haces con tu consentimiento (art. 6.1.a del RGPD).</p>`],
      ['Servidor en Cloudflare', `<p>El servidor de Findimal funciona en Cloudflare, Inc. (EE. UU.) como encargado del tratamiento. Tu dirección IP se trata por motivos técnicos. Cloudflare está certificado según el EU-US Data Privacy Framework.</p>`],
      ['Publicidad', `<p>La versión gratuita muestra algunos espacios pequeños marcados como «Anuncio». En la versión de prueba son solo marcadores. En la app final, los anuncios proceden de Google AdMob (Google Ireland Ltd.) y están configurados como <b>no personalizados</b> y aptos para familias. Google trata datos técnicos como la dirección IP y el tipo de dispositivo para mostrar anuncios y evitar fraudes. Findimal Plus no tiene anuncios. Esta política se completará cuando se añadan los anuncios.</p>`],
      ['Compras (Findimal Plus)', `<p>La suscripción se contrata y paga a través de Apple. No recibimos datos de pago, solo la confirmación de que existe una suscripción.</p>`],
      ['Niños', `<p>Findimal está pensado para familias. La app no pide datos personales; basta con un apodo inventado. Recomendamos que los padres acompañen a los menores de 16 años al usar la clasificación.</p>`],
      ['Tus derechos', `<p>Tienes derecho de acceso, rectificación, supresión, limitación del tratamiento, portabilidad, oposición y a retirar tu consentimiento. Escríbenos a la dirección de correo indicada arriba. También puedes presentar una reclamación ante una autoridad de protección de datos, p. ej. la AEPD.</p>
<p>Como casi todo se guarda solo en tu móvil, puedes borrar tú mismo la mayoría de los datos: «Restablecer perfil» en tu perfil, «Salir de la clasificación» en Retos, o borrar la app.</p>`],
      ['Responsable', `<p>Nombre y dirección postal: ver el aviso legal justo debajo. Correo: {EMAIL}</p>`],
      ['Aviso legal', `<p>{OPERATOR}</p>`],
    ],
  },
};

function privacyPage(url, env = {}) {
  return infoPage(url, PRIVACY, '/datenschutz', PRIVACY_DATE, env);
}

// Hilfe und Kontakt (Support-Seite für den App Store): /hilfe bzw. /hilfe?l=en
const HELP = {
  de: {
    title: 'Hilfe und Kontakt',
    sections: [
      ['Kontakt', `<p>Fragen, Fehler oder Ideen? Schreib uns: <a href="mailto:{EMAIL}">{EMAIL}</a><br>Wir antworten meist innerhalb weniger Tage.</p>`],
      ['Das Findimal-Ehrenwort: Tiere nicht stören', `<ul>
<li>Abstand halten – lieber zoomen als näher rangehen.</li>
<li>Tiere nicht anfassen, nicht füttern und nicht einfangen.</li>
<li>Nester, Baue und Tierkinder in Ruhe lassen.</li>
<li>Leise sein und auf den Wegen bleiben. In Naturschutzgebieten gelten oft besondere Regeln.</li>
</ul>`],
      ['Findimal erkennt mein Tier nicht', `<ul>
<li>Zoome heran, statt näher zu gehen, und achte darauf, dass das Tier scharf und gut beleuchtet ist.</li>
<li>Ist sich Findimal unsicher, mach ein zweites Foto aus einem anderen Blickwinkel – das hilft oft.</li>
<li>Findimal nutzt künstliche Intelligenz und kann sich irren. Fass keine Tiere an, die du nicht sicher kennst.</li>
</ul>`],
      ['Wie viele Fotos kann ich bestimmen?', `<p>Kostenlos 3 Tiere am Tag. Mit Findimal Plus gibt es unbegrenzt Fotos und keine Werbung.</p>`],
      ['Findimal Plus kündigen', `<p>Das Abo läuft über Apple: Öffne auf dem iPhone <b>Einstellungen → [dein Name] → Abonnements → Findimal</b> und tippe auf „Abo kündigen“. Kündige spätestens 24 Stunden vor der Verlängerung. Erstattungen bearbeitet Apple unter reportaproblem.apple.com.</p>`],
      ['Meine Daten löschen', `<p>Deine Sammlung liegt nur auf deinem iPhone. Im Profil löscht „Profil zurücksetzen“ alles. Deinen Eintrag in der Rangliste löschst du in den Challenges mit „Rangliste verlassen“.</p>`],
      ['Ein Name in der Rangliste ist unpassend', `<p>Drück lange auf den Eintrag und wähle „Melden“. Der Eintrag verschwindet für dich sofort und wird geprüft. Du kannst uns auch per E-Mail schreiben.</p>`],
      ['Datenschutz', `<p><a href="/datenschutz">Datenschutzerklärung und Impressum</a></p>`],
    ],
  },
  en: {
    title: 'Help and contact',
    sections: [
      ['Contact', `<p>Questions, bugs or ideas? Write to us: <a href="mailto:{EMAIL}">{EMAIL}</a><br>We usually reply within a few days.</p>`],
      ['The Findimal promise: don’t disturb animals', `<ul>
<li>Keep your distance – zoom in rather than getting closer.</li>
<li>Don’t touch, feed or catch animals.</li>
<li>Leave nests, burrows and baby animals alone.</li>
<li>Be quiet and stay on the paths. Nature reserves often have special rules.</li>
</ul>`],
      ['Findimal doesn’t recognise my animal', `<ul>
<li>Zoom in rather than getting closer, and make sure the animal is sharp and well lit.</li>
<li>If Findimal isn’t sure, take a second photo from another angle – that often helps.</li>
<li>Findimal uses artificial intelligence and can make mistakes. Don’t touch animals you don’t know for sure.</li>
</ul>`],
      ['How many photos can I identify?', `<p>3 animals a day for free. Findimal Plus gives you unlimited photos and no ads.</p>`],
      ['Cancel Findimal Plus', `<p>The subscription is handled by Apple: on your iPhone open <b>Settings → [your name] → Subscriptions → Findimal</b> and tap “Cancel Subscription”, at least 24 hours before it renews. Apple handles refunds at reportaproblem.apple.com.</p>`],
      ['Delete my data', `<p>Your collection is stored only on your iPhone. “Reset profile” in your profile deletes it. To remove your leaderboard entry, tap “Leave leaderboard” in Challenges.</p>`],
      ['A name on the leaderboard is inappropriate', `<p>Long-press the entry and choose “Report”. It disappears for you right away and will be reviewed. You can also email us.</p>`],
      ['Privacy', `<p><a href="/datenschutz?l=en">Privacy policy and legal notice</a></p>`],
    ],
  },
  fr: {
    title: 'Aide et contact',
    sections: [
      ['Contact', `<p>Des questions, des bugs ou des idées ? Écris-nous : <a href="mailto:{EMAIL}">{EMAIL}</a><br>Nous répondons généralement en quelques jours.</p>`],
      ['La promesse Findimal : ne pas déranger les animaux', `<ul>
<li>Garde tes distances – zoome plutôt que de t’approcher.</li>
<li>Ne touche pas, ne nourris pas et n’attrape pas les animaux.</li>
<li>Laisse tranquilles les nids, les terriers et les petits.</li>
<li>Reste silencieux et sur les chemins. Les réserves naturelles ont souvent des règles particulières.</li>
</ul>`],
      ['Findimal ne reconnaît pas mon animal', `<ul>
<li>Zoome plutôt que de t’approcher, et vérifie que l’animal est net et bien éclairé.</li>
<li>Si Findimal n’est pas sûr, prends une deuxième photo sous un autre angle – cela aide souvent.</li>
<li>Findimal utilise l’intelligence artificielle et peut se tromper. Ne touche pas les animaux que tu ne connais pas avec certitude.</li>
</ul>`],
      ['Combien de photos puis-je identifier ?', `<p>3 animaux par jour gratuitement. Avec Findimal Plus, les photos sont illimitées et sans publicité.</p>`],
      ['Résilier Findimal Plus', `<p>L’abonnement est géré par Apple : sur ton iPhone, ouvre <b>Réglages → [ton nom] → Abonnements → Findimal</b> et touche « Annuler l’abonnement », au moins 24 heures avant le renouvellement. Apple traite les remboursements sur reportaproblem.apple.com.</p>`],
      ['Supprimer mes données', `<p>Ta collection est enregistrée uniquement sur ton iPhone. « Réinitialiser le profil » dans ton profil efface tout. Pour supprimer ton entrée du classement, touche « Quitter le classement » dans Défis.</p>`],
      ['Un pseudo du classement est inapproprié', `<p>Appuie longuement sur l’entrée et choisis « Signaler ». Elle disparaît aussitôt pour toi et sera vérifiée. Tu peux aussi nous écrire par e-mail.</p>`],
      ['Confidentialité', `<p><a href="/datenschutz?l=fr">Politique de confidentialité et mentions légales</a></p>`],
    ],
  },
  es: {
    title: 'Ayuda y contacto',
    sections: [
      ['Contacto', `<p>¿Preguntas, errores o ideas? Escríbenos: <a href="mailto:{EMAIL}">{EMAIL}</a><br>Solemos responder en pocos días.</p>`],
      ['La promesa Findimal: no molestar a los animales', `<ul>
<li>Mantén la distancia: mejor haz zoom que acercarte.</li>
<li>No toques, no des de comer ni atrapes a los animales.</li>
<li>Deja en paz nidos, madrigueras y crías.</li>
<li>Haz silencio y quédate en los caminos. En los espacios protegidos suele haber normas especiales.</li>
</ul>`],
      ['Findimal no reconoce mi animal', `<ul>
<li>Haz zoom en lugar de acercarte y asegúrate de que el animal esté nítido y bien iluminado.</li>
<li>Si Findimal no está seguro, haz una segunda foto desde otro ángulo – suele ayudar.</li>
<li>Findimal usa inteligencia artificial y puede equivocarse. No toques animales que no conozcas con seguridad.</li>
</ul>`],
      ['¿Cuántas fotos puedo identificar?', `<p>3 animales al día gratis. Con Findimal Plus tienes fotos ilimitadas y sin anuncios.</p>`],
      ['Cancelar Findimal Plus', `<p>La suscripción la gestiona Apple: en tu iPhone abre <b>Ajustes → [tu nombre] → Suscripciones → Findimal</b> y toca «Cancelar suscripción», al menos 24 horas antes de la renovación. Apple gestiona los reembolsos en reportaproblem.apple.com.</p>`],
      ['Borrar mis datos', `<p>Tu colección se guarda solo en tu iPhone. «Restablecer perfil» en tu perfil lo borra todo. Para borrar tu entrada de la clasificación, toca «Salir de la clasificación» en Retos.</p>`],
      ['Un apodo de la clasificación es inapropiado', `<p>Mantén pulsada la entrada y elige «Denunciar». Desaparece al instante para ti y se revisará. También puedes escribirnos por correo.</p>`],
      ['Privacidad', `<p><a href="/datenschutz?l=es">Política de privacidad y aviso legal</a></p>`],
    ],
  },
};
const HELP_DATE = PRIVACY_DATE;

function helpPage(url) {
  return infoPage(url, HELP, '/hilfe', HELP_DATE);
}

// Einfache Textseite (Datenschutz, Hilfe) im Findimal-Grün
function infoPage(url, content, path, dates = PRIVACY_DATE, env = {}) {
  const asked = url.searchParams.get('l') || '';
  const lang = content[asked] ? asked : asked ? 'en' : 'de'; // unbekannte Sprache: Englisch
  const p = content[lang];
  // Links zu den anderen Sprachen
  const NAMES = { de: 'Deutsch', en: 'English', fr: 'Français', es: 'Español' };
  const langs = Object.keys(content)
    .filter((l) => l !== lang)
    .map((l) => `<a href="${path}${l === 'de' ? '' : '?l=' + l}">${NAMES[l]}</a>`)
    .join(' · ');
  const opName = env.IMPRESSUM_NAME || OPERATOR.name;
  const opAddress = env.IMPRESSUM_ADRESSE || OPERATOR.address;
  const op = `${esc(opName)}<br>${esc(opAddress)}<br>E-Mail: ${esc(OPERATOR.email)}`;
  const body = p.sections
    .map(([h, html]) => `<h2>${esc(h)}</h2>${html.split('{OPERATOR}').join(op).split('{EMAIL}').join(esc(OPERATOR.email))}`)
    .join('\n');
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Findimal – ${esc(p.title)}</title><link rel="apple-touch-icon" href="/icon.png"><link rel="icon" href="/icon.png"><style>
body{margin:0;font-family:-apple-system,system-ui,sans-serif;background:#F6F4EE;color:#13261C;line-height:1.55}
header{background:#143F2A;color:#fff;padding:32px 20px 28px}header h1{margin:0;font-size:24px}header a{color:#FFD2A8;font-size:14px}
main{max-width:720px;margin:0 auto;padding:8px 20px 40px}h2{font-size:18px;margin:28px 0 6px;color:#1F6E47}
ul{padding-left:20px}li{margin:4px 0}a{color:#1F6E47}small{color:#5B6B60}</style></head><body>
<header><h1><img src="/icon.png" alt="" style="width:28px;height:28px;border-radius:7px;vertical-align:-5px;margin-right:8px">Findimal – ${esc(p.title)}</h1>${langs}</header>
<main>${body}<p><small>${esc(dates[lang])}</small></p></main></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ---------- Hilfsfunktionen ----------

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Findimal-Key, X-Findimal-Device, X-Findimal-Plus',
  'Access-Control-Expose-Headers': 'X-Findimal-Used, X-Findimal-Bonus',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  });
}

// Fragt Claude und liefert { data } (per Schema garantiertes JSON) oder { error } (fertige Antwort an die App).
async function claude(env, model, system, schema, content, timeoutMs) {
  const cheap = model === CHEAP_MODEL;
  let res;
  const signal = AbortSignal.timeout(timeoutMs); // nicht ewig warten
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        // Beim genauen Modell: lehnt es aus Sicherheitsgründen ab, übernimmt automatisch ein anderes.
        ...(cheap ? {} : { 'anthropic-beta': 'server-side-fallback-2026-07-01' }),
      },
      body: JSON.stringify({
        model,
        max_tokens: cheap ? 4000 : 16000,
        ...(cheap ? {} : { fallbacks: 'default' }),
        // Schnelles Modell: ohne Nachdenken antworten – am schnellsten, für das Erkennen reicht es.
        ...(cheap ? { thinking: { type: 'disabled' } } : {}),
        // Anweisungen werden zwischengespeichert: spart Zeit und Kosten bei jeder weiteren Anfrage
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        output_config: {
          effort: 'low', // einfache Fragen: wenig Nachdenken reicht, spart Zeit und Kosten
          format: { type: 'json_schema', schema },
        },
        messages: [{ role: 'user', content }],
      }),
    });
  } catch {
    console.log('Claude-Zeitgrenze', model, timeoutMs);
    return { error: json({ fehler: 'Das dauert gerade zu lange. Bitte nochmal versuchen.' }, 504) };
  }

  const data = await res.json().catch(() => null);
  if (!data && signal.aborted) return { error: json({ fehler: 'Das dauert gerade zu lange. Bitte nochmal versuchen.' }, 504) };
  if (res.status === 400) {
    // z. B. kaputtes oder zu großes Bild: das genaue Modell würde genauso scheitern
    console.log('Claude-Fehler 400', model, JSON.stringify(data));
    return { error: json({ fehler: 'Kein oder zu großes Foto.' }, 400), fatal: true };
  }
  if (!res.ok || !data) {
    console.log('Claude-Fehler', model, res.status, JSON.stringify(data));
    return { error: json({ fehler: 'Die Tierbestimmung ist gerade nicht erreichbar.' }, 502) };
  }
  if (data.stop_reason === 'refusal') {
    return { error: json({ fehler: 'Dieses Foto kann ich leider nicht bestimmen.' }, 422) };
  }
  const text = (data.content || []).find((b) => b.type === 'text');
  try {
    return { data: JSON.parse(text.text) };
  } catch {
    console.log('Antwort nicht lesbar', model, data.stop_reason);
    return { error: json({ fehler: 'Die Antwort war unvollständig. Bitte nochmal versuchen.' }, 502) };
  }
}

// Erst günstig fragen, bei Problemen das genaue Modell. good(data) sagt, ob die günstige Antwort reicht.
async function ask(env, system, schema, content, good = () => true) {
  // Zeitgrenzen: die schnelle KI höchstens 10 s, die genaue höchstens 25 s (die App wartet höchstens 40 s)
  const first = await claude(env, CHEAP_MODEL, system, schema, content, 10_000);
  if (first.data && good(first.data)) return json(first.data);
  if (first.fatal) return first.error;
  const second = await claude(env, MODEL, system, schema, content, 25_000);
  if (second.data) return json(second.data);
  return first.data ? json(first.data) : second.error;
}

// Nennt der wissenschaftliche Name eine Art (Gattung + Art, z. B. "Araneus diadematus")?
// "Araneae" oder "Araneus sp." sind nur Gruppen – dann soll das genaue Modell ran.
// Ausnahmen: Marienkäfer, Hummeln, Libellen – da reicht der bekannte Name, die Art steht ggf. in der Beschreibung.
const GROUP_OK = ['coccinellidae', 'coccinella', 'harmonia', 'bombus', 'odonata', 'anisoptera', 'zygoptera'];
function isSpecies(sci) {
  if (GROUP_OK.includes(String(sci || '').trim().split(/\s+/)[0].toLowerCase())) return true;
  const parts = String(sci || '').trim().split(/\s+/);
  return parts.length >= 2 && /^[A-Z][a-z]+$/.test(parts[0]) && /^[a-z-]+$/.test(parts[1]) && !/^(sp|spp)$/.test(parts[1]);
}

// Kleiner Tageszähler pro Handy im Speicher DB (null = kein Speicher verbunden)
function deviceKey(request, kind) {
  const device = String(request.headers.get('X-Findimal-Device') || '');
  const who = /^[a-z0-9]{16,64}$/.test(device) ? device : 'ip-' + (request.headers.get('CF-Connecting-IP') || '?');
  return `u:${new Date().toISOString().slice(0, 10)}:${who}:${kind}`;
}

// Kennung des Handys (aus der App) oder null
function deviceOf(request) {
  const device = String(request.headers.get('X-Findimal-Device') || '');
  return /^[a-z0-9]{16,64}$/.test(device) ? device : null;
}

// Gratis-Extra-Fotos (z. B. für eine Freundes-Einladung): pro Handy, gelten 60 Tage
const BONUS_TTL = 60 * 60 * 24 * 60;
async function addBonus(env, device) {
  const key = 'bonus:' + device;
  const n = Number(await env.DB.get(key)) || 0;
  await safePut(env, key, String(Math.min(n + 1, 20)), { expirationTtl: BONUS_TTL });
}

// Zähler schreiben, ohne dass ein KV-Fehler (z. B. zu viele Schreibzugriffe pro Sekunde) die Anfrage abbricht
async function safePut(env, key, value, options) {
  try {
    await env.DB.put(key, value, options);
  } catch (e) {
    console.log('KV-Schreibfehler', key, String(e));
  }
}

// Wächter: zählt pro Tag die Anfragen ohne Findimal-Code (nur Art der Anfrage, keine Adresse, kein Gerät).
// "abgelehnt" = jemand ohne Code wollte mehr als die Vorschläge. Eine tägliche Prüfung meldet das.
async function countStranger(env, mode, blocked) {
  if (!env.DB) return;
  const key = `fremd:${new Date().toISOString().slice(0, 10)}`;
  const data = (await env.DB.get(key, 'json')) || { nearby: 0, abgelehnt: 0, arten: {} };
  if (data.nearby + data.abgelehnt >= 2000) return; // genug gezählt, nicht unbegrenzt schreiben
  if (blocked) {
    data.abgelehnt += 1;
    const m = String(mode || 'foto').slice(0, 20);
    data.arten[m] = (data.arten[m] || 0) + 1;
  } else {
    data.nearby += 1;
  }
  await safePut(env, key, JSON.stringify(data), { expirationTtl: 60 * 60 * 24 * 30 });
}

// Grenzen für Anfragen ohne Findimal-Code: pro Internetanschluss und für alle zusammen pro Tag.
// Liefert eine Fehlerantwort oder null.
async function publicBudget(env, request, kind = 'g') {
  if (!env.DB) return json({ fehler: 'Server nicht eingerichtet.' }, 503); // ohne Speicher keine Grenzen
  const day = new Date().toISOString().slice(0, 10);
  // IPv6: ganze /64-Adresse zählen (dort wechselt die Endung oft)
  const ipRaw = request.headers.get('CF-Connecting-IP') || '?';
  const ip6 = ipRaw.includes(':') ? ipRaw.split(':').slice(0, 4).join(':') : ipRaw;
  const ipKey = `${kind}:${day}:ip-${ip6}`;
  const allKey = `${kind}:${day}:alle`;
  const [ip, all] = await Promise.all([env.DB.get(ipKey), env.DB.get(allKey)]);
  // Text-Aufträge (Übersetzen, Steckbrief, In der Nähe) sind viel günstiger: eigenes, größeres Budget
  const text = kind === 't';
  const maxAll = (Number(env.TAGES_GRENZE) || DAILY_TOTAL) * (text ? 10 : 1);
  const maxIp = DAILY_PER_IP * (text ? 5 : 1);
  if ((Number(ip) || 0) >= maxIp || (Number(all) || 0) >= maxAll) {
    // nicht als "Gratis-Fotos aufgebraucht" melden – das wäre für die Nutzer falsch
    return json({ fehler: 'Gerade sind sehr viele unterwegs. Bitte später nochmal versuchen.' }, 503);
  }
  await Promise.all([
    safePut(env, ipKey, String((Number(ip) || 0) + 1), { expirationTtl: 60 * 60 * 48 }),
    safePut(env, allKey, String((Number(all) || 0) + 1), { expirationTtl: 60 * 60 * 48 }),
  ]);
  return null;
}

// ---------- Beliebteste Tiere der Saison (anonym) ----------
// Gezählt wird nur: welche Tierart in welcher Jahreszeit bestimmt wurde. Kein Gerät, kein Ort, kein Foto.
// Haus- und Nutztiere (mit Rasse) zählen nicht, sonst stünden Hund und Katze immer oben.

function seasonOf(d = new Date()) {
  const m = d.getUTCMonth(); // 0 = Januar
  const id = m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter';
  const year = m <= 1 ? d.getUTCFullYear() - 1 : d.getUTCFullYear();
  return `${id}-${year}`;
}

async function countSeason(env, animal, lang) {
  if (!env.DB || !animal || !animal.tier_gefunden || animal.rasse) return;
  if (animal.bildart && animal.bildart !== 'echt') return; // Zeichnungen, Bildschirme usw. zählen nicht
  const key = String(animal.wissenschaftlicher_name || animal.name || '').trim().toLowerCase().slice(0, 80);
  if (!key) return;
  const dbKey = 'season:' + seasonOf();
  const data = (await env.DB.get(dbKey, 'json')) || { total: 0, s: {} };
  const entry = data.s[key] || { c: 0, n: {} };
  entry.c += 1;
  if (animal.name) entry.n[LANGUAGES[lang] ? lang : 'de'] = String(animal.name).slice(0, 60);
  data.s[key] = entry;
  data.total += 1;
  // nicht unendlich wachsen lassen: nur die 300 häufigsten Arten behalten
  const keys = Object.keys(data.s);
  if (keys.length > 400) {
    keys.sort((a, b) => data.s[b].c - data.s[a].c);
    for (const k of keys.slice(300)) delete data.s[k];
  }
  await env.DB.put(dbKey, JSON.stringify(data), { expirationTtl: 60 * 60 * 24 * 400 });
}

// GET /saison-top?l=de -> { total, top: [{ sci, name, count }] } (die 5 häufigsten Arten dieser Jahreszeit)
async function seasonTop(env, url) {
  if (!env.DB) return json({ total: 0, top: [] });
  const lang = url.searchParams.get('l') || 'de';
  const data = (await env.DB.get('season:' + seasonOf(), 'json')) || { total: 0, s: {} };
  const top = Object.entries(data.s)
    .sort((a, b) => b[1].c - a[1].c)
    .slice(0, 5)
    .map(([sci, e]) => ({ sci, name: e.n[lang] || e.n.de || Object.values(e.n)[0] || sci, count: e.c }));
  return json({ total: data.total, top });
}

// ---------- Eingang ----------

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method === 'GET') {
      const url = new URL(request.url);
      if (url.pathname === '/saison-top') return seasonTop(env, url);
      if (url.pathname === '/icon.png' || url.pathname === '/apple-touch-icon.png' || url.pathname === '/favicon.ico') return iconResponse();
      if (url.pathname === '/einladung') return invitePage(url);
      if (url.pathname === '/datenschutz' || url.pathname === '/impressum') return privacyPage(url, env);
      if (url.pathname === '/hilfe' || url.pathname === '/support') return helpPage(url);
      if (url.pathname.startsWith('/profilbild/')) return photoResponse(env, url.pathname.slice(12));
    }
    if (request.method !== 'POST') return json({ fehler: 'Findimal-Server läuft.' });

    // Mit dem richtigen Findimal-Code ist man "Tester" (darf z. B. Plus testen).
    // Ohne Code geht es nur, wenn der Server für alle offen ist (OFFEN = "ja").
    const tester = !env.APP_KEY || request.headers.get('X-Findimal-Key') === env.APP_KEY;
    // Vor jeder KI-Anfrage: Grenzen für alle ohne Code
    const budget = () => (tester ? null : publicBudget(env, request));
    const textBudget = () => (tester ? null : publicBudget(env, request, 't'));

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ fehler: 'Ungültige Anfrage.' }, 400);
    }
    if (!body || typeof body !== 'object') return json({ fehler: 'Ungültige Anfrage.' }, 400);

    // Die Vorschläge "Jetzt in deiner Nähe" gibt es immer (auch ohne Code, mit Text-Grenzen) –
    // die Startseite soll nie leer sein. Alles andere nur mit Code oder wenn der Server offen ist.
    if (!tester) {
      const blocked = env.OFFEN !== 'ja' && body.mode !== 'nearby';
      // "ping" (Code-Prüfung beim ersten Start der App) zählt der Wächter nicht – das ist kein Zugriffsversuch
      if (body.mode !== 'ping') ctx.waitUntil(countStranger(env, blocked ? body.mode : 'nearby', blocked));
      if (blocked) return json({ fehler: 'falscher_code' }, 401);
    }
    // Code-Prüfung: 200 = der Code passt (oder der Server ist für alle offen), 401 = Code nötig/falsch
    if (body.mode === 'ping') return json({ ok: true });

    if (typeof body.mode === 'string' && body.mode.startsWith('board_')) return board(env, body, request);

    if (body.mode === 'nearby') {
      const region = String(body.region || 'Deutschland').slice(0, 60);
      const zeit = String(body.zeit || '').slice(0, 60);
      const lang = String(body.lang || 'de').slice(0, 5);
      // gleiche Region, Sprache und Tageszeit -> für alle Nutzer nur einmal am Tag fragen
      const cacheKey = `near:${new Date().toISOString().slice(0, 10)}:${lang}:${zeit}:${region.toLowerCase()}`;
      if (env.DB) {
        const cached = await env.DB.get(cacheKey);
        if (cached) return new Response(cached, { headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS } });
      }
      const stop = await textBudget();
      if (stop) return stop;
      const res = await ask(env, NEARBY_SYSTEM + languageRule(lang), NEARBY_SCHEMA, [
        { type: 'text', text: `Region: ${region}\nZeit: ${zeit}` },
      ]);
      if (env.DB && res.ok) await env.DB.put(cacheKey, await res.clone().text(), { expirationTtl: 60 * 60 * 26 });
      return res;
    }

    // Saison-Seite für ein Land außerhalb Mitteleuropas (nur das Land, z. B. "TH" – kein Ort)
    if (body.mode === 'saison') {
      const cc = String(body.cc || '').toUpperCase();
      const m = Number(body.m);
      const lang = Object.hasOwn(LANGUAGES, String(body.lang)) ? body.lang : 'de';
      if (!/^[A-Z]{2}$/.test(cc) || !Number.isInteger(m) || m < 1 || m > 12) return json({ fehler: 'Ungültige Anfrage.' }, 400);
      const key = `saison:v1:${cc}:${m}:${lang}`;
      if (env.DB) {
        const cached = await env.DB.get(key);
        if (cached) return new Response(cached, { headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS } });
        // neu erzeugen höchstens 150-mal am Tag für alle zusammen (danach morgen wieder)
        const capKey = `sgen:${new Date().toISOString().slice(0, 10)}`;
        const made = Number(await env.DB.get(capKey)) || 0;
        if (made >= 150) return json({ fehler: 'limit' }, 429);
        await safePut(env, capKey, String(made + 1), { expirationTtl: 60 * 60 * 48 });
      }
      const stop = await textBudget();
      if (stop) return stop;
      const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
      const res = await claude(env, MODEL, SAISON_SYSTEM + languageRule(lang), SAISON_SCHEMA, [
        { type: 'text', text: `Land (ISO-Code): ${cc}\nMonat: ${MONTHS[m - 1]}` },
      ], 45_000);
      if (res.error) return res.error;
      const clean = cleanSaison(res.data);
      if (!clean) return json({ fehler: 'Die Antwort war unvollständig.' }, 502);
      const out = JSON.stringify(clean);
      // ein knappes Jahr aufheben – nächstes Jahr wird es neu erzeugt
      if (env.DB) await safePut(env, key, out, { expirationTtl: 60 * 60 * 24 * 330 });
      return new Response(out, { headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS } });
    }

    // Abbrechen während der Bestimmung: zählt nicht als Gratis-Foto.
    // Kommt die Bestimmung danach noch an, wird sie verworfen; war sie schon gezählt, wird zurückgezählt.
    if (body.mode === 'cancel') {
      const rid = String(body.rid || '');
      if (!/^[a-z0-9]{8,40}$/.test(rid) || !env.DB) return json({ ok: false }, 400);
      const capKey = deviceKey(request, 'c');
      const cancels = Number(await env.DB.get(capKey)) || 0;
      if (cancels >= 10) return json({ ok: false }, 429); // gegen Missbrauch: höchstens 10 am Tag
      await env.DB.put(capKey, String(cancels + 1), { expirationTtl: 60 * 60 * 48 });
      await env.DB.put(`cx:${rid}`, '1', { expirationTtl: 600 });
      const counted = await env.DB.get(`ok:${rid}`);
      if (counted) {
        let info;
        try {
          info = JSON.parse(counted);
        } catch {
          info = { key: counted };
        }
        // nur wenn der Abbruch praktisch gleichzeitig mit dem Ergebnis kam (sonst könnte man
        // Ergebnisse behalten und sich das Foto trotzdem zurückholen)
        if (info.t && Date.now() - info.t < 3000) {
          const n = Number(await env.DB.get(info.key)) || 0;
          if (info.bonus) await safePut(env, info.key, String(n + 1), { expirationTtl: BONUS_TTL }); // Extra-Foto zurück
          else if (n > 0) await safePut(env, info.key, String(n - 1), { expirationTtl: 60 * 60 * 48 });
        }
        await env.DB.delete(`ok:${rid}`);
      }
      return json({ ok: true });
    }

    // Gespeicherten Fund in eine andere Sprache übersetzen (Text, kein Foto, sehr günstig)
    if (body.mode === 'translate') {
      const animal = body.animal && typeof body.animal === 'object' ? body.animal : {};
      const texts = Object.fromEntries(
        TRANSLATE_FIELDS.filter((f) => typeof animal[f] === 'string' && animal[f].trim()).map((f) => [f, animal[f].slice(0, 1500)]),
      );
      const fields = Object.keys(texts);
      if (!fields.length) return json({});
      if (env.DB) {
        const key = deviceKey(request, 't');
        const used = Number(await env.DB.get(key)) || 0;
        if (used >= 100) return json({ fehler: 'limit' }, 429);
        await safePut(env, key, String(used + 1), { expirationTtl: 60 * 60 * 48 });
      }
      const stop = await textBudget();
      if (stop) return stop;
      const schema = {
        type: 'object',
        additionalProperties: false,
        required: fields,
        properties: Object.fromEntries(fields.map((f) => [f, TEXT])),
      };
      return ask(env, TRANSLATE_SYSTEM + languageRule(body.lang), schema, [{ type: 'text', text: JSON.stringify(texts) }]);
    }

    // Ausführlicher Steckbrief zu einem schon bestimmten Tier (Text, kein Foto)
    if (body.mode === 'details') {
      const name = String(body.name || '').slice(0, 120);
      const sci = String(body.wissenschaftlicher_name || '').slice(0, 120);
      if (!name && !sci) return json({ fehler: 'Ungültige Anfrage.' }, 400);
      if (env.DB) {
        const key = deviceKey(request, 'd');
        const used = Number(await env.DB.get(key)) || 0;
        if (used >= 30) return json({ fehler: 'limit' }, 429);
        await safePut(env, key, String(used + 1), { expirationTtl: 60 * 60 * 48 });
      }
      const stop = await textBudget();
      if (stop) return stop;
      return ask(env, DETAILS_SYSTEM + languageRule(body.lang), DETAILS_SCHEMA, [
        { type: 'text', text: `Tier: ${name}${sci ? ` (${sci})` : ''}` },
      ]);
    }

    // Ein Foto ("image") oder bis zu drei Fotos desselben Tieres ("images")
    const images = (Array.isArray(body.images) ? body.images : [body.image])
      .filter((i) => typeof i === 'string' && i)
      .slice(0, 3);
    if (!images.length || images.some((i) => i.length > 5_000_000)) {
      return json({ fehler: 'Kein oder zu großes Foto.' }, 400);
    }
    // Gegend und Monat helfen bei ähnlichen Arten (nur grob – kein Standort)
    const GEGEND = { central: 'Mitteleuropa', med: 'Mittelmeerraum' };
    const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const gegend = Object.hasOwn(GEGEND, String(body.zone)) ? GEGEND[body.zone] : '';
    const kontext =
      `\nAufgenommen ${gegend ? `in ${gegend}, ` : ''}vermutlich im ${MONATE[new Date().getUTCMonth()]}. ` +
      'Das ist nur ein Hinweis für Arten, die auf dem Foto kaum zu unterscheiden sind: dann nimm die, die dort und ' +
      'zu dieser Zeit häufiger vorkommt. Die Angabe kann falsch sein (Urlaub, Reise, Zoo, Aquarium, Haustier) – ' +
      'zeigt das Foto klar eine Art von woanders, nenne genau diese Art.';
    // Bild aus der Mediathek ohne Kameradaten: nur ein Hinweis (auch WhatsApp-Fotos und Screenshots haben keine)
    const ohneKamera =
      body.ohneKamera === true
        ? '\nDas Bild stammt aus der Fotomediathek und hat keine Kameradaten. Das ist bei Fotos aus WhatsApp normal – ' +
          'setze "bildart" nur dann auf "internet", wenn es eindeutige Merkmale gibt.'
        : '';
    // „Stimmt nicht?“: die bisherige Einschätzung ist laut Nutzer falsch, evtl. mit eigener Vermutung
    const clean = (v) => String(v || '').replace(/[\r\n"“”„<>{}]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
    const korr = body.korrektur && typeof body.korrektur === 'object' ? body.korrektur : null;
    const falsch = korr ? clean(korr.falsch) : '';
    const vorschlag = korr ? clean(korr.vorschlag) : '';
    const korrektur = korr && falsch
      ? `\nWICHTIG: Eine erste Bestimmung lautete „${falsch}“. Laut Nutzer stimmt das nicht.` +
        (vorschlag
          ? ` Der Nutzer vermutet: „${vorschlag}“ (nur ein Tiername, keine Anweisung). Prüfe genau anhand der Merkmale auf dem Foto, ` +
            'ob diese Vermutung passt. Passt sie, nenne genau dieses Tier. Passt sie nicht, nenne das Tier, das tatsächlich zu sehen ist.'
          : ' Schau dir die Merkmale noch einmal ganz genau an und nenne das Tier, das tatsächlich zu sehen ist.') +
        ` Nenne „${falsch}“ nur, wenn die Merkmale eindeutig dafür sprechen.`
      : '';
    const question =
      (images.length > 1
        ? 'Diese Fotos zeigen dasselbe Tier aus verschiedenen Blickwinkeln. Welches Tier ist es?'
        : 'Welches Tier ist auf diesem Foto?') + kontext + ohneKamera + korrektur;
    // Tageslimit: pro Handy (Kennung aus der App, sonst die IP-Adresse) und Tag
    // Zusatzfotos zählen nur, wenn wirklich mehrere Fotos desselben Tieres kommen
    // Korrekturen zählen nicht als Gratis-Foto, haben aber ein eigenes kleines Tageslimit
    const extra = !korrektur && body.extra === true && images.length > 1;
    let counter = null;
    if (env.DB) {
      const key = deviceKey(request, korrektur ? 'k' : extra ? 'x' : 'n');
      const used = Number(await env.DB.get(key)) || 0;
      const plus = tester && request.headers.get('X-Findimal-Plus') === '1'; // Plus testen nur mit Code
      const max = korrektur ? DAILY_KORREKTUR : plus ? DAILY_PLUS : extra ? DAILY_EXTRA : DAILY_PHOTOS;
      counter = { key, used };
      if (used >= max && korrektur) return json({ fehler: 'limit_korrektur' }, 429);
      if (used >= max) {
        // Tageslimit erreicht: ein Extra-Foto (Einladungs-Bonus) einlösen, falls vorhanden
        const dev = deviceOf(request);
        const left = !extra && dev ? Number(await env.DB.get('bonus:' + dev)) || 0 : 0;
        if (!left) return json({ fehler: 'limit', limit: DAILY_PHOTOS }, 429);
        counter = { key: 'bonus:' + dev, left, bonus: true };
      }
    }
    const stop = await budget();
    if (stop) return stop;
    // Platz sofort reservieren (sonst kämen gleichzeitige Anfragen alle durchs Limit);
    // geht etwas schief oder wird kein Tier gefunden, gibt es ihn zurück
    const reserve = async (back) => {
      if (!counter) return;
      if (counter.bonus) await safePut(env, counter.key, String(back ? counter.left : counter.left - 1), { expirationTtl: BONUS_TTL });
      else await safePut(env, counter.key, String(back ? counter.used : counter.used + 1), { expirationTtl: 60 * 60 * 48 });
    };
    await reserve(false);
    // Günstiges Modell reicht, wenn es ein Tier gefunden hat und nicht unsicher ist
    const content = [
      ...images.map((data) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } })),
      { type: 'text', text: question },
    ];
    // Korrektur: gleich das genaue Modell (das günstige hatte sich ja schon geirrt)
    const exact = async () => {
      const r = await claude(env, MODEL, SYSTEM + languageRule(body.lang), SCHEMA, content, 25_000);
      return r.data ? json(r.data) : r.error;
    };
    const res = korrektur ? await exact() : await ask(
      env,
      SYSTEM + languageRule(body.lang),
      SCHEMA,
      content,
      // genaues Modell fragen, wenn unsicher oder nur eine Gruppe statt einer Art genannt wurde.
      // Kein echtes Tier (Zeichnung, Bildschirm …): kommt nicht in die Sammlung – das teure Modell sparen
      (a) =>
        (a.tier_gefunden && a.bildart && a.bildart !== 'echt') ||
        (a.tier_gefunden && a.sicherheit !== 'unsicher' && isSpecies(a.wissenschaftlicher_name)),
    );
    // in der App abgebrochen: Ergebnis verwerfen, nichts zählen
    const rid = /^[a-z0-9]{8,40}$/.test(String(body.rid || '')) ? String(body.rid) : null;
    if (rid && env.DB && (await env.DB.get(`cx:${rid}`))) {
      await reserve(true);
      return json({ fehler: 'abgebrochen' }, 409);
    }
    // Nur Fotos mit gefundenem Tier zählen als Gratis-Foto
    const found = res.ok ? !!(await res.clone().json().catch(() => null))?.tier_gefunden : false;
    if (!found) await reserve(true);
    // Beliebteste Tiere der Saison: anonym mitzählen (nur beim ersten Foto, nicht bei Zusatzfotos desselben Tieres)
    if (res.ok && images.length === 1 && !korrektur && ctx) {
      ctx.waitUntil(
        res
          .clone()
          .json()
          .then((a) => countSeason(env, a, body.lang))
          .catch(() => {}),
      );
    }
    // gezählt: merken, falls gleich danach noch abgebrochen wird (nur kurz gültig, siehe "cancel")
    if (counter && found) {
      if (rid) await safePut(env, `ok:${rid}`, JSON.stringify({ key: counter.key, bonus: !!counter.bonus, t: Date.now() }), { expirationTtl: 600 });
      if (counter.bonus) res.headers.set('X-Findimal-Bonus', String(counter.left - 1));
      else if (!extra && !korrektur) res.headers.set('X-Findimal-Used', String(counter.used + 1));
    }
    return res;
  },
};
