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
// XP, Stufe, Anzahl Arten und Abzeichen-Bild – keine Fotos, keine Orte.
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
Gib nur Fakten an, bei denen du dir sicher bist. Nenne immer die konkrete Art (z. B. "Gartenkreuzspinne",
"Hauswinkelspinne", "Siebenpunkt-Marienkäfer") – nie nur eine Großgruppe wie "Spinne", "Käfer", "Vogel" oder
"Fliege", denn das weiß jeder schon. Bist du dir bei der Art nicht ganz sicher, nenne die wahrscheinlichste Art,
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
Ameise, Springspinne), sonst false.`;

// Kurzer Steckbrief direkt nach dem Foto
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'tier_gefunden', 'name', 'rasse', 'rasse_sicher', 'wissenschaftlicher_name', 'gruppe', 'sicherheit',
    'kurzbeschreibung', 'wusstest_du', 'hinweis', 'gefaehrdet', 'giftig', 'gross', 'schmetterling',
    'wasser', 'winzig',
  ],
  properties: {
    tier_gefunden: { type: 'boolean' },
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
        avatar: String(body.avatar || '').slice(0, 20),
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

    if (body.mode === 'board_delete') {
      await env.DB.delete('p:' + id);
      await env.DB.delete('f:' + id);
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
    // Wer hat mich hinzugefügt?
    if (body.mode === 'board_inbox') {
      const dev = deviceOf(request);
      const bonus = dev ? Number(await env.DB.get('bonus:' + dev)) || 0 : 0; // offene Extra-Fotos
      return json({ ids: (await env.DB.get('f:' + id, 'json')) || [], bonus });
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

// Einladungsseite: https-Link aus WhatsApp & Co. -> öffnet Findimal (Expo Go) mit dem Freundescode
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
<title>Findimal</title><style>
body{margin:0;font-family:-apple-system,system-ui,sans-serif;background:#143F2A;color:#fff;text-align:center;padding:48px 20px}
h1{font-size:26px;margin:0 0 8px}p{opacity:.85;line-height:1.4}
a.b{display:inline-block;margin:22px 0;background:#E8833A;color:#13261C;font-weight:700;font-size:18px;padding:15px 28px;border-radius:16px;text-decoration:none}
.c{font-size:26px;letter-spacing:3px;font-weight:700;color:#FFD2A8}small a{color:#FFD2A8}</style></head><body>
<h1>🦊 ${esc(name)} ${esc(tx[0])}</h1><p>${esc(tx[1])}</p>
${ok ? `<a class="b" href="${esc(app)}">${esc(tx[2])}</a>` : ''}
<p>${esc(tx[5])}</p><div class="c">${esc(code.slice(0, 3))} ${esc(code.slice(3, 6))}</div>
<p><small>${esc(tx[3])} <a href="https://apps.apple.com/app/expo-go/id982107779">${esc(tx[4])}</a></small></p>
</body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ---------- Datenschutz und Impressum ----------
// Erreichbar unter /datenschutz (Deutsch) und /datenschutz?l=en (Englisch).
// Hier die eigenen Angaben eintragen (werden auf der Seite öffentlich angezeigt):
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
<li>Die Rangliste ist freiwillig. Dort stehen nur Spitzname, Punkte und Profilbild – keine Fotos und keine Orte.</li>
</ul>`],
      ['Verantwortlich', `<p>{OPERATOR}</p>`],
      ['Fotos zur Tierbestimmung', `<p>Wenn du ein Foto bestimmen lässt, schickt die App eine verkleinerte Kopie des Fotos – ohne Ortsangaben – an den Findimal-Server. Er leitet das Foto an die KI von Anthropic PBC (USA) weiter und schickt das Ergebnis zurück. Der Findimal-Server speichert das Foto nicht. Anthropic verarbeitet die Daten nach seinen Geschäftsbedingungen für Unternehmenskunden: Sie werden nicht zum Training der KI verwendet und nur für begrenzte Zeit gespeichert, z. B. zur Erkennung von Missbrauch. Die Übermittlung in die USA erfolgt auf Grundlage geeigneter Garantien (EU-Standardvertragsklauseln bzw. EU-US Data Privacy Framework).</p>
<p>Zweck: die Bestimmung, die du anforderst. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Nutzung der App-Funktion).</p>
<p>Bitte fotografiere keine Menschen, Gesichter oder Autokennzeichen.</p>`],
      ['Was auf deinem Handy bleibt', `<p>Deine Sammlung (Fotos, Tiernamen, Datum), dein Name, deine Quiz-Antworten, Einstellungen und Abzeichen werden nur auf deinem Handy gespeichert. Mit „Profil zurücksetzen“ im Profil oder durch Löschen der App sind sie weg.</p>
<p><b>Region:</b> Für „Jetzt in deiner Nähe“ gibst du deine Region selbst ein. Wenn du sie per Standort bestimmen lässt, ermittelt das iPhone den Ortsnamen über den Ortsdienst von Apple. Gespeichert wird nur der Ortsname, auf deinem Handy. Genauso bekommt jeder Fund den Namen des Ortes, an dem das Foto entstand – aus deinem Standort (nur wenn du ihn erlaubt hast), sonst aus dem Ort, den du in der App angegeben hast. Du kannst ihn bei jedem Fund ändern. Ortsdaten in deinen Fotos liest Findimal nicht. Auch hier wird nur der Name gespeichert, nie die genaue Position, und er bleibt auf deinem Handy.</p>`],
      ['„Jetzt in deiner Nähe“', `<p>Für die Tipps auf der Startseite schickt die App die Region, die du selbst eingetragen hast (z. B. „München“), die Tageszeit und die Sprache an den Server. Das Ergebnis wird bis zu 26 Stunden zwischengespeichert und für alle Nutzer derselben Region verwendet. Ein Bezug zu dir wird nicht gespeichert.</p>`],
      ['Beliebteste Tiere der Saison', `<p>Wenn ein Wildtier bestimmt wird, zählt der Server anonym mit, welche Tierart es war und in welcher Jahreszeit – ohne Foto, Gerät, Ort oder Namen. Daraus entsteht die Liste der am häufigsten entdeckten Tiere auf der Saison-Seite. Haustiere werden nicht gezählt. Ein Bezug zu dir ist nicht möglich.</p>`],
      ['Tageslimit für Gratis-Fotos', `<p>Damit Gratis-Fotos begrenzt werden können, erzeugt die App eine zufällige Kennung für dein Handy. Der Server zählt damit, wie viele Fotos am Tag bestimmt wurden. Ohne Kennung wird ersatzweise die IP-Adresse verwendet. Die Zähler werden nach 48 Stunden automatisch gelöscht. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Schutz vor Missbrauch und unbegrenzten Kosten).</p>`],
      ['Rangliste (freiwillig)', `<p>Wenn du bei der Rangliste mitmachst, speichert der Server deinen Spitznamen, deine Punkte (XP), Stufe, Zahl der Arten, dein Profilbild, deinen Freundescode und mit wem du befreundet bist. Freunde sehen diese Angaben; die 100 Entdecker mit den meisten Punkten erscheinen in der weltweiten Rangliste. Spitznamen mit Schimpfwörtern, Links oder Telefonnummern werden automatisch durch „Entdecker“ ersetzt. Meldest du einen Eintrag, speichern wir deinen Freundescode beim gemeldeten Eintrag; nach mehreren Meldungen wird er ausgeblendet. Für den Einladungs-Bonus (ein Gratis-Foto extra) speichert der Server außerdem die zufällige Kennung deines Handys bei deinem Eintrag und merkt sich, dass dieses Handy den Bonus schon bekommen hat; die Kennung ist für niemanden sichtbar. Mit „Rangliste verlassen“ wird dein Eintrag gelöscht. Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (deine Einwilligung durch das Mitmachen).</p>`],
      ['Server bei Cloudflare', `<p>Der Findimal-Server läuft bei Cloudflare, Inc. (USA) als Auftragsverarbeiter. Dabei wird technisch bedingt deine IP-Adresse verarbeitet. Cloudflare ist unter dem EU-US Data Privacy Framework zertifiziert.</p>`],
      ['Werbung', `<p>In der kostenlosen Version zeigt Findimal einige kleine, als „Anzeige“ gekennzeichnete Werbeplätze. In der Testversion sind das nur Platzhalter. In der fertigen App kommen die Anzeigen von Google AdMob (Google Ireland Ltd.) und sind <b>nicht personalisiert</b> und familiengeeignet eingestellt. Google verarbeitet dabei technische Daten wie IP-Adresse und Gerätetyp, um die Anzeige auszuliefern und Betrug zu verhindern. Mit Findimal Plus gibt es keine Werbung. Diese Erklärung wird ergänzt, sobald die Werbung eingebaut ist.</p>`],
      ['Käufe (Findimal Plus)', `<p>Das Abo wird über Apple abgeschlossen und bezahlt. Wir erhalten keine Zahlungsdaten, sondern nur die Bestätigung, dass ein Abo besteht.</p>`],
      ['Kinder', `<p>Findimal ist für Familien gedacht. Die App verlangt keine persönlichen Angaben; als Spitzname reicht ein Fantasiename. Wir empfehlen, dass Eltern Kinder unter 16 Jahren bei der Nutzung der Rangliste begleiten.</p>`],
      ['Deine Rechte', `<p>Du hast das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung, auf Datenübertragbarkeit, auf Widerspruch und auf Widerruf einer Einwilligung. Schreib uns dazu an die oben genannte E-Mail-Adresse. Du kannst dich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren, z. B. beim Bayerischen Landesamt für Datenschutzaufsicht.</p>
<p>Weil fast alles nur auf deinem Handy liegt, kannst du die meisten Daten selbst löschen: „Profil zurücksetzen“ im Profil, „Rangliste verlassen“ in den Challenges oder die App löschen.</p>`],
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
<li>The leaderboard is optional. It only shows nickname, points and profile picture – no photos and no locations.</li>
</ul>`],
      ['Controller', `<p>{OPERATOR}</p>`],
      ['Photos for identification', `<p>When you identify a photo, the app sends a reduced copy – without location data – to the Findimal server. It forwards the photo to the AI of Anthropic PBC (USA) and returns the result. The Findimal server does not store the photo. Anthropic processes the data under its commercial terms: it is not used to train the AI and is kept only for a limited time, e.g. to detect abuse. Transfers to the USA are based on appropriate safeguards (EU standard contractual clauses or the EU-US Data Privacy Framework).</p>
<p>Purpose: the identification you request. Legal basis: Art. 6(1)(b) GDPR (use of the app feature).</p>
<p>Please do not photograph people, faces or licence plates.</p>`],
      ['What stays on your phone', `<p>Your collection (photos, animal names, date), your name, quiz answers, settings and badges are stored only on your phone. “Reset profile” in your profile or deleting the app removes them.</p>
<p><b>Region:</b> For “Near you now” you enter your region yourself. If you let the app detect it, the iPhone looks up the place name using Apple's location service. Only the place name is stored, on your phone. In the same way, each find gets the name of the place where the photo was taken – from your location (only if you allowed it), otherwise from the place you entered in the app. You can change it for every find. Findimal does not read location data stored in your photos. Here too only the name is stored, never the exact position, and it stays on your phone.</p>`],
      ['“Near you now”', `<p>For the tips on the home screen, the app sends the region you entered yourself (e.g. “Munich”), the time of day and the language to the server. The result is cached for up to 26 hours and shared by all users of that region. Nothing linking it to you is stored.</p>`],
      ['Most spotted animals of the season', `<p>When a wild animal is identified, the server anonymously counts which species it was and in which season – without photo, device, place or name. This makes the list of the most spotted animals on the Season page. Pets are not counted. It cannot be linked to you.</p>`],
      ['Daily limit for free photos', `<p>To limit free photos, the app creates a random identifier for your phone. The server uses it to count how many photos were identified per day; without it, the IP address is used instead. The counters are deleted automatically after 48 hours. Legal basis: Art. 6(1)(f) GDPR (protection against abuse and unlimited costs).</p>`],
      ['Leaderboard (optional)', `<p>If you join the leaderboard, the server stores your nickname, points (XP), level, number of species, profile picture, friend code and who your friends are. Friends can see this; the top 100 explorers appear on the worldwide leaderboard. Nicknames with swear words, links or phone numbers are automatically replaced with “Entdecker”. If you report an entry, we store your friend code with the reported entry; after several reports it is hidden. For the invite bonus (one extra free photo), the server also stores your phone’s random identifier with your entry and remembers that this phone has already received the bonus; the identifier is never shown to anyone. “Leave leaderboard” deletes your entry. Legal basis: Art. 6(1)(a) GDPR (your consent by joining).</p>`],
      ['Server at Cloudflare', `<p>The Findimal server runs at Cloudflare, Inc. (USA) as a processor. Your IP address is processed for technical reasons. Cloudflare is certified under the EU-US Data Privacy Framework.</p>`],
      ['Advertising', `<p>The free version shows a few small spaces marked “Ad”. In the test version these are placeholders only. In the finished app, ads come from Google AdMob (Google Ireland Ltd.) and are set to <b>non-personalised</b> and family-friendly. Google processes technical data such as IP address and device type to deliver ads and prevent fraud. Findimal Plus has no ads. This policy will be updated once ads are added.</p>`],
      ['Purchases (Findimal Plus)', `<p>The subscription is purchased and paid through Apple. We receive no payment data, only confirmation that a subscription exists.</p>`],
      ['Children', `<p>Findimal is made for families. The app asks for no personal data; a made-up nickname is enough. We recommend that parents accompany children under 16 when using the leaderboard.</p>`],
      ['Your rights', `<p>You have the right of access, rectification, erasure, restriction of processing, data portability, objection and withdrawal of consent. Write to the email address above. You may also lodge a complaint with a data protection supervisory authority.</p>
<p>As almost everything is stored only on your phone, you can delete most data yourself: “Reset profile” in your profile, “Leave leaderboard” in Challenges, or delete the app.</p>`],
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
<li>Le classement est facultatif. On n’y voit que ton pseudo, tes points et ta photo de profil – ni photos, ni lieux.</li>
</ul>`],
      ['Responsable', `<p>{OPERATOR}</p>`],
      ['Photos pour l’identification', `<p>Quand tu fais identifier une photo, l’app envoie une copie réduite – sans données de localisation – au serveur Findimal. Il la transmet à l’IA d’Anthropic PBC (États-Unis) et renvoie le résultat. Le serveur Findimal ne conserve pas la photo. Anthropic traite les données selon ses conditions pour les clients professionnels : elles ne servent pas à entraîner l’IA et ne sont conservées que pour une durée limitée, par ex. pour détecter les abus. Le transfert vers les États-Unis repose sur des garanties appropriées (clauses contractuelles types de l’UE ou EU-US Data Privacy Framework).</p>
<p>Finalité : l’identification que tu demandes. Base juridique : art. 6, par. 1, point b du RGPD (utilisation de la fonction de l’app).</p>
<p>Merci de ne pas photographier de personnes, de visages ni de plaques d’immatriculation.</p>`],
      ['Ce qui reste sur ton téléphone', `<p>Ta collection (photos, noms des animaux, date), ton prénom, tes réponses au quiz, tes réglages et tes badges sont enregistrés uniquement sur ton téléphone. « Réinitialiser le profil » dans ton profil ou la suppression de l’app les efface.</p>
<p><b>Région :</b> pour « Près de toi maintenant », tu indiques toi-même ta région. Si tu la fais détecter, l’iPhone trouve le nom du lieu grâce au service de localisation d’Apple. Seul le nom du lieu est enregistré, sur ton téléphone. De la même façon, chaque trouvaille reçoit le nom du lieu où la photo a été prise – grâce à ta position (seulement si tu l’as autorisée), sinon le lieu que tu as indiqué dans l’app. Tu peux le modifier pour chaque trouvaille. Findimal ne lit pas les données de lieu enregistrées dans tes photos. Là aussi, seul le nom est enregistré, jamais la position exacte, et il reste sur ton téléphone.</p>`],
      ['« Près de toi maintenant »', `<p>Pour les conseils de l’écran d’accueil, l’app envoie au serveur la région que tu as indiquée (par ex. « Lyon »), le moment de la journée et la langue. Le résultat est mis en cache jusqu’à 26 heures et partagé par tous les utilisateurs de cette région. Aucun lien avec toi n’est enregistré.</p>`],
      ['Animaux les plus repérés de la saison', `<p>Quand un animal sauvage est identifié, le serveur compte de façon anonyme de quelle espèce il s’agit et en quelle saison – sans photo, appareil, lieu ni nom. Cela donne la liste des animaux les plus repérés sur la page Saison. Les animaux de compagnie ne sont pas comptés. Aucun lien avec toi n’est possible.</p>`],
      ['Limite quotidienne de photos gratuites', `<p>Pour limiter les photos gratuites, l’app crée un identifiant aléatoire pour ton téléphone. Le serveur s’en sert pour compter les photos identifiées par jour ; à défaut, l’adresse IP est utilisée. Les compteurs sont supprimés automatiquement après 48 heures. Base juridique : art. 6, par. 1, point f du RGPD (protection contre les abus et les coûts illimités).</p>`],
      ['Classement (facultatif)', `<p>Si tu participes au classement, le serveur enregistre ton pseudo, tes points (XP), ton niveau, le nombre d’espèces, ta photo de profil, ton code ami et tes amis. Tes amis voient ces informations ; les 100 explorateurs ayant le plus de points apparaissent dans le classement mondial. Les pseudos contenant des insultes, des liens ou des numéros de téléphone sont remplacés automatiquement par « Entdecker ». Si tu signales une entrée, nous enregistrons ton code ami avec l’entrée signalée ; après plusieurs signalements, elle est masquée. Pour le bonus d’invitation (une photo gratuite en plus), le serveur enregistre aussi l’identifiant aléatoire de ton téléphone avec ton entrée et retient que ce téléphone a déjà reçu le bonus ; l’identifiant n’est visible par personne. « Quitter le classement » supprime ton entrée. Base juridique : art. 6, par. 1, point a du RGPD (ton consentement en participant).</p>`],
      ['Serveur chez Cloudflare', `<p>Le serveur Findimal fonctionne chez Cloudflare, Inc. (États-Unis) en tant que sous-traitant. Ton adresse IP est traitée pour des raisons techniques. Cloudflare est certifié selon l’EU-US Data Privacy Framework.</p>`],
      ['Publicité', `<p>La version gratuite affiche quelques petits emplacements marqués « Publicité ». Dans la version de test, ce ne sont que des espaces réservés. Dans l’app finale, les publicités proviennent de Google AdMob (Google Ireland Ltd.) et sont réglées comme <b>non personnalisées</b> et adaptées aux familles. Google traite des données techniques comme l’adresse IP et le type d’appareil pour diffuser les publicités et prévenir la fraude. Findimal Plus est sans publicité. Cette politique sera complétée dès l’ajout de la publicité.</p>`],
      ['Achats (Findimal Plus)', `<p>L’abonnement est souscrit et payé via Apple. Nous ne recevons aucune donnée de paiement, seulement la confirmation qu’un abonnement existe.</p>`],
      ['Enfants', `<p>Findimal est conçu pour les familles. L’app ne demande aucune donnée personnelle ; un pseudo imaginaire suffit. Nous recommandons aux parents d’accompagner les enfants de moins de 16 ans lors de l’utilisation du classement.</p>`],
      ['Tes droits', `<p>Tu as le droit d’accès, de rectification, d’effacement, de limitation du traitement, de portabilité des données, d’opposition et de retrait de ton consentement. Écris-nous à l’adresse e-mail ci-dessus. Tu peux aussi introduire une réclamation auprès d’une autorité de protection des données, par ex. la CNIL.</p>
<p>Comme presque tout est enregistré uniquement sur ton téléphone, tu peux supprimer toi-même la plupart des données : « Réinitialiser le profil » dans ton profil, « Quitter le classement » dans Défis, ou supprimer l’app.</p>`],
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
<li>La clasificación es opcional. Solo muestra tu apodo, tus puntos y tu foto de perfil – ni fotos ni lugares.</li>
</ul>`],
      ['Responsable', `<p>{OPERATOR}</p>`],
      ['Fotos para la identificación', `<p>Cuando identificas una foto, la app envía una copia reducida – sin datos de ubicación – al servidor de Findimal. Este la reenvía a la IA de Anthropic PBC (EE. UU.) y devuelve el resultado. El servidor de Findimal no guarda la foto. Anthropic trata los datos según sus condiciones para clientes empresariales: no se usan para entrenar la IA y solo se conservan durante un tiempo limitado, p. ej. para detectar abusos. La transferencia a EE. UU. se basa en garantías adecuadas (cláusulas contractuales tipo de la UE o EU-US Data Privacy Framework).</p>
<p>Finalidad: la identificación que solicitas. Base jurídica: art. 6.1.b del RGPD (uso de la función de la app).</p>
<p>Por favor, no fotografíes personas, caras ni matrículas.</p>`],
      ['Lo que se queda en tu móvil', `<p>Tu colección (fotos, nombres de animales, fecha), tu nombre, tus respuestas del quiz, tus ajustes e insignias se guardan solo en tu móvil. «Restablecer perfil» en tu perfil o borrar la app los elimina.</p>
<p><b>Región:</b> para «Cerca de ti ahora» indicas tú mismo tu región. Si dejas que la app la detecte, el iPhone busca el nombre del lugar con el servicio de ubicación de Apple. Solo se guarda el nombre del lugar, en tu móvil. Del mismo modo, cada hallazgo recibe el nombre del lugar donde se hizo la foto, a partir de tu ubicación (solo si la permitiste) o, si no, del lugar que indicaste en la app. Puedes cambiarlo en cada hallazgo. Findimal no lee los datos de ubicación guardados en tus fotos. También aquí solo se guarda el nombre, nunca la posición exacta, y se queda en tu móvil.</p>`],
      ['«Cerca de ti ahora»', `<p>Para los consejos de la pantalla de inicio, la app envía al servidor la región que indicaste (p. ej. «Valencia»), el momento del día y el idioma. El resultado se guarda en caché hasta 26 horas y lo comparten todos los usuarios de esa región. No se guarda nada que lo relacione contigo.</p>`],
      ['Animales más vistos de la temporada', `<p>Cuando se identifica un animal salvaje, el servidor cuenta de forma anónima qué especie era y en qué estación, sin foto, dispositivo, lugar ni nombre. Así se crea la lista de los animales más vistos en la página Temporada. Las mascotas no se cuentan. No es posible relacionarlo contigo.</p>`],
      ['Límite diario de fotos gratis', `<p>Para limitar las fotos gratis, la app crea un identificador aleatorio para tu móvil. El servidor lo usa para contar cuántas fotos se identifican al día; si no existe, se usa la dirección IP. Los contadores se borran automáticamente a las 48 horas. Base jurídica: art. 6.1.f del RGPD (protección contra abusos y costes ilimitados).</p>`],
      ['Clasificación (opcional)', `<p>Si participas en la clasificación, el servidor guarda tu apodo, tus puntos (XP), nivel, número de especies, foto de perfil, código de amigo y quiénes son tus amigos. Tus amigos ven estos datos; los 100 exploradores con más puntos aparecen en la clasificación mundial. Los apodos con insultos, enlaces o números de teléfono se sustituyen automáticamente por «Entdecker». Si denuncias una entrada, guardamos tu código de amigo junto a la entrada denunciada; tras varias denuncias se oculta. Para el bono por invitación (una foto gratis extra), el servidor guarda también el identificador aleatorio de tu móvil junto a tu entrada y recuerda que ese móvil ya recibió el bono; el identificador no lo ve nadie. «Salir de la clasificación» borra tu entrada. Base jurídica: art. 6.1.a del RGPD (tu consentimiento al participar).</p>`],
      ['Servidor en Cloudflare', `<p>El servidor de Findimal funciona en Cloudflare, Inc. (EE. UU.) como encargado del tratamiento. Tu dirección IP se trata por motivos técnicos. Cloudflare está certificado según el EU-US Data Privacy Framework.</p>`],
      ['Publicidad', `<p>La versión gratuita muestra algunos espacios pequeños marcados como «Anuncio». En la versión de prueba son solo marcadores. En la app final, los anuncios proceden de Google AdMob (Google Ireland Ltd.) y están configurados como <b>no personalizados</b> y aptos para familias. Google trata datos técnicos como la dirección IP y el tipo de dispositivo para mostrar anuncios y evitar fraudes. Findimal Plus no tiene anuncios. Esta política se completará cuando se añadan los anuncios.</p>`],
      ['Compras (Findimal Plus)', `<p>La suscripción se contrata y paga a través de Apple. No recibimos datos de pago, solo la confirmación de que existe una suscripción.</p>`],
      ['Niños', `<p>Findimal está pensado para familias. La app no pide datos personales; basta con un apodo inventado. Recomendamos que los padres acompañen a los menores de 16 años al usar la clasificación.</p>`],
      ['Tus derechos', `<p>Tienes derecho de acceso, rectificación, supresión, limitación del tratamiento, portabilidad, oposición y a retirar tu consentimiento. Escríbenos a la dirección de correo indicada arriba. También puedes presentar una reclamación ante una autoridad de protección de datos, p. ej. la AEPD.</p>
<p>Como casi todo se guarda solo en tu móvil, puedes borrar tú mismo la mayoría de los datos: «Restablecer perfil» en tu perfil, «Salir de la clasificación» en Retos, o borrar la app.</p>`],
      ['Aviso legal', `<p>{OPERATOR}</p>`],
    ],
  },
};

function privacyPage(url) {
  return infoPage(url, PRIVACY, '/datenschutz');
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
function infoPage(url, content, path, dates = PRIVACY_DATE) {
  const asked = url.searchParams.get('l') || '';
  const lang = content[asked] ? asked : asked ? 'en' : 'de'; // unbekannte Sprache: Englisch
  const p = content[lang];
  // Links zu den anderen Sprachen
  const NAMES = { de: 'Deutsch', en: 'English', fr: 'Français', es: 'Español' };
  const langs = Object.keys(content)
    .filter((l) => l !== lang)
    .map((l) => `<a href="${path}${l === 'de' ? '' : '?l=' + l}">${NAMES[l]}</a>`)
    .join(' · ');
  const op = `${esc(OPERATOR.name)}<br>${esc(OPERATOR.address)}<br>E-Mail: ${esc(OPERATOR.email)}`;
  const body = p.sections
    .map(([h, html]) => `<h2>${esc(h)}</h2>${html.split('{OPERATOR}').join(op).split('{EMAIL}').join(esc(OPERATOR.email))}`)
    .join('\n');
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Findimal – ${esc(p.title)}</title><style>
body{margin:0;font-family:-apple-system,system-ui,sans-serif;background:#F6F4EE;color:#13261C;line-height:1.55}
header{background:#143F2A;color:#fff;padding:32px 20px 28px}header h1{margin:0;font-size:24px}header a{color:#FFD2A8;font-size:14px}
main{max-width:720px;margin:0 auto;padding:8px 20px 40px}h2{font-size:18px;margin:28px 0 6px;color:#1F6E47}
ul{padding-left:20px}li{margin:4px 0}a{color:#1F6E47}small{color:#5B6B60}</style></head><body>
<header><h1>🦊 Findimal – ${esc(p.title)}</h1>${langs}</header>
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
function isSpecies(sci) {
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
      if (url.pathname === '/einladung') return invitePage(url);
      if (url.pathname === '/datenschutz' || url.pathname === '/impressum') return privacyPage(url);
      if (url.pathname === '/hilfe' || url.pathname === '/support') return helpPage(url);
    }
    if (request.method !== 'POST') return json({ fehler: 'Findimal-Server läuft.' });

    // Mit dem richtigen Findimal-Code ist man "Tester" (darf z. B. Plus testen).
    // Ohne Code geht es nur, wenn der Server für alle offen ist (OFFEN = "ja").
    const tester = !env.APP_KEY || request.headers.get('X-Findimal-Key') === env.APP_KEY;
    if (!tester && env.OFFEN !== 'ja') return json({ fehler: 'falscher_code' }, 401);
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
    const question =
      images.length > 1
        ? 'Diese Fotos zeigen dasselbe Tier aus verschiedenen Blickwinkeln. Welches Tier ist es?'
        : 'Welches Tier ist auf diesem Foto?';
    // Tageslimit: pro Handy (Kennung aus der App, sonst die IP-Adresse) und Tag
    // Zusatzfotos zählen nur, wenn wirklich mehrere Fotos desselben Tieres kommen
    const extra = body.extra === true && images.length > 1;
    let counter = null;
    if (env.DB) {
      const key = deviceKey(request, extra ? 'x' : 'n');
      const used = Number(await env.DB.get(key)) || 0;
      const plus = tester && request.headers.get('X-Findimal-Plus') === '1'; // Plus testen nur mit Code
      const max = plus ? DAILY_PLUS : extra ? DAILY_EXTRA : DAILY_PHOTOS;
      counter = { key, used };
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
    const res = await ask(
      env,
      SYSTEM + languageRule(body.lang),
      SCHEMA,
      [
        ...images.map((data) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } })),
        { type: 'text', text: question },
      ],
      // genaues Modell fragen, wenn unsicher oder nur eine Gruppe statt einer Art genannt wurde
      (a) => a.tier_gefunden && a.sicherheit !== 'unsicher' && isSpecies(a.wissenschaftlicher_name),
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
    if (res.ok && images.length === 1 && ctx) {
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
      else if (!extra) res.headers.set('X-Findimal-Used', String(counter.used + 1));
    }
    return res;
  },
};
