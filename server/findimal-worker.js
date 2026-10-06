// Findimal-Server als Cloudflare Worker.
//
// 1. Tierbestimmung: Die App schickt ein Foto; der Worker fragt Claude, welches Tier es ist,
//    und gibt einen deutschen Steckbrief zurück.
// 2. "Jetzt in deiner Nähe": drei Tiere, die man gerade in der Region entdecken kann.
// 3. Rangliste mit Freunden (Spitzname und Punkte, gespeichert im Cloudflare-KV-Speicher).
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

const MODEL = 'claude-sonnet-5-5';

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
Gefährdungsstatus bitte mit IUCN-Kürzel, z. B. "Nicht gefährdet (IUCN: LC)".
Bei Haus- und Nutztieren (z. B. Hund, Katze, Huhn, Pferd, Rind, Schaf, Ziege, Kaninchen, Meerschweinchen)
bestimme zusätzlich die Rasse so genau wie möglich und schreibe sie in "rasse" (z. B. "Golden Retriever",
"Brahma", "Haflinger"). Sieht das Tier nach einer Mischung aus, schreibe z. B. "Mischling (vermutlich mit
Labrador)". Bist du dir bei der Rasse nicht sicher, schreibe "vermutlich ..." davor. "name" bleibt die Tierart
(z. B. "Haushund", "Haushuhn"). Bei Wildtieren bleibt "rasse" leer.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'tier_gefunden', 'name', 'rasse', 'wissenschaftlicher_name', 'gruppe', 'sicherheit', 'kurzbeschreibung',
    'klasse', 'familie', 'groesse', 'aktiv', 'lebensraum', 'verbreitung', 'gefaehrdung',
    'wusstest_du', 'rolle_in_der_natur', 'nahrung', 'fressfeinde', 'hinweis',
  ],
  properties: {
    tier_gefunden: { type: 'boolean' },
    name: TEXT,
    rasse: TEXT,
    wissenschaftlicher_name: TEXT,
    gruppe: GRUPPE,
    sicherheit: { type: 'string', enum: ['sicher', 'wahrscheinlich', 'unsicher'] },
    kurzbeschreibung: TEXT,
    klasse: TEXT,
    familie: TEXT,
    groesse: TEXT,
    aktiv: TEXT,
    lebensraum: TEXT,
    verbreitung: TEXT,
    gefaehrdung: TEXT,
    wusstest_du: TEXT,
    rolle_in_der_natur: TEXT,
    nahrung: TEXT,
    fressfeinde: TEXT,
    hinweis: TEXT,
  },
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

async function board(env, body) {
  if (!env.DB) return json({ fehler: 'keine_datenbank' }, 503);

  // Eigene Werte speichern (nur wer das Geheimnis kennt, darf seinen Eintrag ändern)
  if (body.mode === 'board_save' || body.mode === 'board_delete') {
    const id = String(body.id || '');
    const secret = String(body.secret || '');
    if (!CODE.test(id) || secret.length < 16 || secret.length > 64) return json({ fehler: 'Ungültig.' }, 400);
    const hash = await sha256(secret);
    const old = await env.DB.get('p:' + id, 'json');
    if (old && old.hash !== hash) return json({ fehler: 'Code vergeben.' }, 403);
    if (body.mode === 'board_delete') {
      await env.DB.delete('p:' + id);
      return json({ ok: true });
    }
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
    return json({ ok: true });
  }

  // Einträge zu einer Liste von Freundescodes holen
  const ids = (Array.isArray(body.ids) ? body.ids : []).map(String).filter((i) => CODE.test(i)).slice(0, 50);
  const entries = await Promise.all(ids.map((id) => env.DB.get('p:' + id, 'json')));
  const people = [];
  entries.forEach((e, i) => {
    if (e) people.push({ id: ids[i], name: e.name, xp: e.xp, level: e.level, species: e.species, avatar: e.avatar });
  });
  return json({ people });
}

// ---------- Hilfsfunktionen ----------

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Findimal-Key',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS },
  });
}

// Fragt Claude und gibt die (per Schema garantierte) JSON-Antwort an die App weiter.
async function askClaude(env, system, schema, content) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      // Falls Claude eine Anfrage aus Sicherheitsgründen ablehnt, übernimmt automatisch ein anderes Modell.
      'anthropic-beta': 'server-side-fallback-2026-07-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      fallbacks: 'default',
      system,
      output_config: {
        effort: 'low', // einfache Fragen: wenig Nachdenken reicht und spart Kosten
        format: { type: 'json_schema', schema },
      },
      messages: [{ role: 'user', content }],
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    console.log('Claude-Fehler', res.status, JSON.stringify(data));
    return json({ fehler: 'Die Tierbestimmung ist gerade nicht erreichbar.' }, 502);
  }
  if (data.stop_reason === 'refusal') {
    return json({ fehler: 'Dieses Foto kann ich leider nicht bestimmen.' }, 422);
  }
  const text = (data.content || []).find((b) => b.type === 'text');
  try {
    return json(JSON.parse(text.text));
  } catch {
    console.log('Antwort nicht lesbar', data.stop_reason);
    return json({ fehler: 'Die Antwort war unvollständig. Bitte nochmal versuchen.' }, 502);
  }
}

// ---------- Eingang ----------

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
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
      return askClaude(env, NEARBY_SYSTEM + languageRule(body.lang), NEARBY_SCHEMA, [
        { type: 'text', text: `Region: ${region}\nZeit: ${zeit}` },
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
    return askClaude(env, SYSTEM + languageRule(body.lang), SCHEMA, [
      ...images.map((data) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } })),
      { type: 'text', text: question },
    ]);
  },
};
