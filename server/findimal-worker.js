// Findimal-Tierbestimmung als Cloudflare Worker.
//
// Die App schickt ein Foto hierher; der Worker fragt Claude, welches Tier es ist,
// und gibt einen deutschen Steckbrief zurück. Der Claude-API-Schlüssel liegt nur
// hier im Worker (als geheime Variable), nie in der App oder auf GitHub.
//
// Geheime Variablen in Cloudflare (Settings -> Variables and Secrets):
//   ANTHROPIC_API_KEY  dein Claude-API-Schlüssel (sk-ant-...)
//   APP_KEY            ein selbst ausgedachtes Passwort; die App fragt einmal danach
//
// Dieser Code wird direkt im Cloudflare-Editor eingefügt. Dort gibt es kein npm,
// deshalb ruft er die Claude-API mit fetch auf statt mit dem Anthropic-SDK.

const MODEL = 'claude-sonnet-5-5';

const SYSTEM = `Du bist der Tierexperte der App Findimal, einer freundlichen App zum Bestimmen und Sammeln von Tieren.
Du bekommst ein Foto und bestimmst das Tier darauf so genau wie möglich (am liebsten bis zur Art).
Antworte auf Deutsch, freundlich und gut verständlich für Kinder und Erwachsene.
Gib nur Fakten an, bei denen du dir sicher bist. Wenn die Art unsicher ist, nenne die nächstsichere Gruppe
(z. B. "Eine Schwebfliege") und setze "sicherheit" auf "unsicher".
Wenn kein Tier zu sehen ist, setze "tier_gefunden" auf false, lass die Tierfelder leer und erkläre in
"hinweis" kurz und freundlich, was du siehst und wie ein besseres Foto gelingt.
Gefährdungsstatus bitte mit IUCN-Kürzel, z. B. "Nicht gefährdet (IUCN: LC)".`;

const TEXT = { type: 'string' };

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
    gruppe: {
      type: 'string',
      enum: ['saeugetier', 'vogel', 'insekt', 'amphibie', 'reptil', 'fisch', 'weichtier', 'spinnentier', 'andere'],
    },
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
    const image = typeof body.image === 'string' ? body.image : '';
    if (!image || image.length > 7_000_000) {
      return json({ fehler: 'Kein oder zu großes Foto.' }, 400);
    }

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
        system: SYSTEM,
        output_config: {
          effort: 'low', // einfache Frage: wenig Nachdenken reicht und spart Kosten
          format: { type: 'json_schema', schema: SCHEMA },
        },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
              { type: 'text', text: 'Welches Tier ist auf diesem Foto?' },
            ],
          },
        ],
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
  },
};
