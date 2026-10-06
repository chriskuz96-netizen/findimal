// Findimal-Server als Cloudflare Worker.
//
// 1. Tierbestimmung: Die App schickt ein Foto; der Worker fragt Claude, welches Tier es ist,
//    und gibt einen deutschen Steckbrief zurück.
// 2. "Jetzt in deiner Nähe": drei Tiere, die man gerade in der Region entdecken kann.
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
Gefährdungsstatus bitte mit IUCN-Kürzel, z. B. "Nicht gefährdet (IUCN: LC)".`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'tier_gefunden', 'name', 'wissenschaftlicher_name', 'gruppe', 'sicherheit', 'kurzbeschreibung',
    'klasse', 'familie', 'groesse', 'aktiv', 'lebensraum', 'verbreitung', 'gefaehrdung',
    'wusstest_du', 'rolle_in_der_natur', 'nahrung', 'fressfeinde', 'hinweis',
  ],
  properties: {
    tier_gefunden: { type: 'boolean' },
    name: TEXT,
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

    if (body.mode === 'nearby') {
      const region = String(body.region || 'Deutschland').slice(0, 60);
      const zeit = String(body.zeit || '').slice(0, 60);
      return askClaude(env, NEARBY_SYSTEM + languageRule(body.lang), NEARBY_SCHEMA, [
        { type: 'text', text: `Region: ${region}\nZeit: ${zeit}` },
      ]);
    }

    const image = typeof body.image === 'string' ? body.image : '';
    if (!image || image.length > 7_000_000) {
      return json({ fehler: 'Kein oder zu großes Foto.' }, 400);
    }
    return askClaude(env, SYSTEM + languageRule(body.lang), SCHEMA, [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
      { type: 'text', text: 'Welches Tier ist auf diesem Foto?' },
    ]);
  },
};
