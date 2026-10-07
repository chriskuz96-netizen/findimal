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
//   APP_KEY            ein selbst ausgedachtes Passwort; die App fragt einmal danach
//
// Rangliste: braucht einen KV-Speicher (Storage & Databases -> KV), der im Worker unter
// Bindings mit dem Variablennamen DB verbunden ist. Gespeichert werden nur Spitzname,
// XP, Stufe, Anzahl Arten und Abzeichen-Bild – keine Fotos, keine Orte.
//
// Dieser Code wird direkt im Cloudflare-Editor eingefügt. Dort gibt es kein npm,
// deshalb ruft er die Claude-API mit fetch auf statt mit dem Anthropic-SDK.

// Erst das günstige Modell fragen; ist es unsicher oder klappt etwas nicht, übernimmt das genauere.
const CHEAP_MODEL = 'claude-haiku-4-5';
const MODEL = 'claude-sonnet-5-5';

// Gratis-Fotos pro Handy und Tag (zählt nur, wenn der Speicher DB verbunden ist).
// Weitere Fotos zum selben Tier ("extra") haben ein eigenes, großzügigeres Limit.
const DAILY_PHOTOS = 3;
const DAILY_EXTRA = 6;

const TEXT = { type: 'string' };
const GRUPPE = {
  type: 'string',
  enum: ['saeugetier', 'vogel', 'insekt', 'amphibie', 'reptil', 'fisch', 'weichtier', 'spinnentier', 'andere'],
};

// ---------- 1. Tierbestimmung ----------

const SYSTEM = `Du bist der Tierexperte der App Findimal, einer freundlichen App zum Bestimmen und Sammeln von Tieren.
Du bekommst ein Foto und bestimmst das Tier darauf so genau wie möglich (am liebsten bis zur Art).
Antworte freundlich und gut verständlich für Kinder und Erwachsene.
Gib nur Fakten an, bei denen du dir sicher bist. Wenn die Art unsicher ist, nenne die nächstsichere Gruppe
(z. B. "Eine Schwebfliege") und setze "sicherheit" auf "unsicher".
Wenn kein Tier zu sehen ist, setze "tier_gefunden" auf false, lass die Tierfelder leer und erkläre in
"hinweis" kurz und freundlich, was du siehst und wie ein besseres Foto gelingt.
Bei Haus- und Nutztieren (z. B. Hund, Katze, Huhn, Pferd, Rind, Schaf, Ziege, Kaninchen, Meerschweinchen)
bestimme zusätzlich die Rasse so genau wie möglich und schreibe sie in "rasse" (z. B. "Golden Retriever",
"Brahma", "Haflinger"). Sieht das Tier nach einer Mischung aus, schreibe z. B. "Mischling (vermutlich mit
Labrador)". Bist du dir bei der Rasse nicht sicher, schreibe "vermutlich ..." davor. "name" bleibt die Tierart
(z. B. "Haushund", "Haushuhn"). Bei Wildtieren bleibt "rasse" leer.`;

// Kurzer Steckbrief direkt nach dem Foto
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'tier_gefunden', 'name', 'rasse', 'wissenschaftlicher_name', 'gruppe', 'sicherheit', 'kurzbeschreibung',
    'wusstest_du', 'hinweis',
  ],
  properties: {
    tier_gefunden: { type: 'boolean' },
    name: TEXT,
    rasse: TEXT,
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

// ---------- 3. Rangliste mit Freunden ----------

const CODE = /^[A-HJ-NP-Z2-9]{6}$/; // Freundescode, z. B. "K7QX2M" (ohne 0/O und 1/I)
const int = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const TOP_SIZE = 50;
const publicEntry = (id, e) => ({ id, name: e.name, xp: e.xp, level: e.level, species: e.species, avatar: e.avatar });

// Weltweite Bestenliste als eine Liste (KV kann nicht sortieren). entry = null entfernt den Eintrag.
async function updateTop(env, id, entry) {
  const top = (await env.DB.get('top', 'json')) || [];
  const was = top.some((x) => x.id === id);
  const rest = top.filter((x) => x.id !== id);
  const fits = entry && (rest.length < TOP_SIZE || entry.xp > rest[rest.length - 1].xp);
  if (!was && !fits) return; // nichts zu ändern (spart Schreibzugriffe)
  const next = fits ? [...rest, publicEntry(id, entry)].sort((a, b) => b.xp - a.xp).slice(0, TOP_SIZE) : rest;
  await env.DB.put('top', JSON.stringify(next));
}

async function board(env, body) {
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
        name: String(body.name || '?').trim().slice(0, 20) || '?',
        xp: int(body.xp, 1_000_000),
        level: int(body.level, 100),
        species: int(body.species, 100_000),
        avatar: String(body.avatar || '').slice(0, 20),
        updated: Date.now(),
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
      return json({ ok: true });
    }
    // Wer hat mich hinzugefügt?
    if (body.mode === 'board_inbox') {
      return json({ ids: (await env.DB.get('f:' + id, 'json')) || [] });
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
  de: ['lädt dich zu Findimal ein!', 'Sammelt zusammen Tiere und vergleicht eure Punkte.', 'Findimal öffnen', 'Du brauchst die App „Expo Go“:', 'Expo Go im App Store', 'Freundescode'],
  en: ['invites you to Findimal!', 'Collect animals together and compare your points.', 'Open Findimal', 'You need the “Expo Go” app:', 'Expo Go on the App Store', 'Friend code'],
  fr: ['t’invite sur Findimal !', 'Collectionnez des animaux ensemble et comparez vos points.', 'Ouvrir Findimal', 'Il te faut l’app « Expo Go » :', 'Expo Go sur l’App Store', 'Code ami'],
  es: ['te invita a Findimal!', 'Coleccionad animales juntos y comparad vuestros puntos.', 'Abrir Findimal', 'Necesitas la app «Expo Go»:', 'Expo Go en la App Store', 'Código de amigo'],
};
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function invitePage(url) {
  const code = (url.searchParams.get('c') || '').toUpperCase();
  const name = (url.searchParams.get('n') || 'Jemand').slice(0, 20);
  const app = url.searchParams.get('u') || '';
  const tx = INVITE_TEXT[url.searchParams.get('l')] || INVITE_TEXT.de;
  // nur Links in die Expo-Go-App erlauben (keine Weiterleitung auf fremde Seiten)
  const ok = CODE.test(code) && /^exps?:\/\//.test(app);
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

// ---------- Hilfsfunktionen ----------

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Findimal-Key, X-Findimal-Device',
  'Access-Control-Expose-Headers': 'X-Findimal-Used',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  });
}

// Fragt Claude und liefert { data } (per Schema garantiertes JSON) oder { error } (fertige Antwort an die App).
async function claude(env, model, system, schema, content) {
  const cheap = model === CHEAP_MODEL;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
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
      system,
      output_config: {
        ...(cheap ? {} : { effort: 'low' }), // einfache Fragen: wenig Nachdenken reicht und spart Kosten
        format: { type: 'json_schema', schema },
      },
      messages: [{ role: 'user', content }],
    }),
  });

  const data = await res.json().catch(() => null);
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
  const first = await claude(env, CHEAP_MODEL, system, schema, content);
  if (first.data && good(first.data)) return json(first.data);
  const second = await claude(env, MODEL, system, schema, content);
  if (second.data) return json(second.data);
  return first.data ? json(first.data) : second.error;
}

// Kleiner Tageszähler pro Handy im Speicher DB (null = kein Speicher verbunden)
function deviceKey(request, kind) {
  const device = String(request.headers.get('X-Findimal-Device') || '');
  const who = /^[a-z0-9]{16,64}$/.test(device) ? device : 'ip-' + (request.headers.get('CF-Connecting-IP') || '?');
  return `u:${new Date().toISOString().slice(0, 10)}:${who}:${kind}`;
}

// ---------- Eingang ----------

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (request.method === 'GET') {
      const url = new URL(request.url);
      if (url.pathname === '/einladung') return invitePage(url);
    }
    if (request.method !== 'POST') return json({ fehler: 'Findimal-Server läuft.' });

    if (env.APP_KEY && request.headers.get('X-Findimal-Key') !== env.APP_KEY) {
      return json({ fehler: 'falscher_code' }, 401);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ fehler: 'Ungültige Anfrage.' }, 400);
    }

    if (typeof body.mode === 'string' && body.mode.startsWith('board_')) return board(env, body);

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
      const res = await ask(env, NEARBY_SYSTEM + languageRule(lang), NEARBY_SCHEMA, [
        { type: 'text', text: `Region: ${region}\nZeit: ${zeit}` },
      ]);
      if (env.DB && res.ok) await env.DB.put(cacheKey, await res.clone().text(), { expirationTtl: 60 * 60 * 26 });
      return res;
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
        await env.DB.put(key, String(used + 1), { expirationTtl: 60 * 60 * 48 });
      }
      return ask(env, DETAILS_SYSTEM + languageRule(body.lang), DETAILS_SCHEMA, [
        { type: 'text', text: `Tier: ${name}${sci ? ` (${sci})` : ''}` },
      ]);
    }

    // Ein Foto ("image") oder bis zu drei Fotos desselben Tieres ("images")
    const images = (Array.isArray(body.images) ? body.images : [body.image])
      .filter((i) => typeof i === 'string' && i)
      .slice(0, 3);
    if (!images.length || images.some((i) => i.length > 7_000_000)) {
      return json({ fehler: 'Kein oder zu großes Foto.' }, 400);
    }
    const question =
      images.length > 1
        ? 'Diese Fotos zeigen dasselbe Tier aus verschiedenen Blickwinkeln. Welches Tier ist es?'
        : 'Welches Tier ist auf diesem Foto?';
    // Tageslimit: pro Handy (Kennung aus der App, sonst die IP-Adresse) und Tag
    const extra = body.extra === true;
    let counter = null;
    if (env.DB) {
      const key = deviceKey(request, extra ? 'x' : 'n');
      const used = Number(await env.DB.get(key)) || 0;
      if (used >= (extra ? DAILY_EXTRA : DAILY_PHOTOS)) return json({ fehler: 'limit', limit: DAILY_PHOTOS }, 429);
      counter = { key, used };
    }
    // Günstiges Modell reicht, wenn es ein Tier gefunden hat und nicht unsicher ist
    const res = await ask(
      env,
      SYSTEM + languageRule(body.lang),
      SCHEMA,
      [
        ...images.map((data) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } })),
        { type: 'text', text: question },
      ],
      (a) => a.tier_gefunden && a.sicherheit !== 'unsicher',
    );
    // nur erfolgreiche Bestimmungen zählen
    if (counter && res.ok) {
      await env.DB.put(counter.key, String(counter.used + 1), { expirationTtl: 60 * 60 * 48 });
      if (!extra) res.headers.set('X-Findimal-Used', String(counter.used + 1));
    }
    return res;
  },
};
