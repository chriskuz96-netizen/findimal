#!/usr/bin/env python3
"""Findimal-Kennzahlen für die Wochenübersicht.

Liest (nur lesend):
- Cloudflare KV „findimal-rangliste“: anonyme Tageszählung hi:<Datum>:<Hash> (Metadaten l/v/p/n/t),
  Rangliste p:<Code>, Push-Anmeldungen pt:<Code>
- Cloudflare GraphQL: Server-Anfragen und KI-Abfragen (Subrequests) pro Tag (höchstens 4 Wochen zurück)
- App Store Connect (optional, wenn EXPO_ASC_* gesetzt): TestFlight-Tester

Läuft in der Claude-Code-Umgebung: api.cloudflare.com wird vom Proxy angemeldet, es braucht keinen Schlüssel.
Ausgabe: JSON auf stdout (oder in die Datei aus dem 1. Argument).

Aufruf: python3 tools/stats.py [ausgabe.json]
"""
import datetime as dt
import json
import os
import sys
import time
import urllib.parse
import urllib.request

ACCOUNT = 'b35f688e4c54779e61350c343f13bf4b'
CF = f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}'
APP_ID = '6823092816'
DAYS = 56  # 8 Wochen


def cf(path, data=None):
    req = urllib.request.Request(CF + path if path.startswith('/') else path, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def namespace():
    for ns in cf('/storage/kv/namespaces')['result']:
        if ns['title'] == 'findimal-rangliste':
            return ns['id']
    raise SystemExit('KV-Namespace nicht gefunden')


def keys(ns, prefix):
    out, cursor = [], ''
    while True:
        q = {'prefix': prefix, 'limit': 1000}
        if cursor:
            q['cursor'] = cursor
        d = cf(f'/storage/kv/namespaces/{ns}/keys?' + urllib.parse.urlencode(q))
        out += d['result']
        cursor = d.get('result_info', {}).get('cursor')
        if not cursor:
            return out


def week_start(d):
    return d - dt.timedelta(days=d.weekday())  # Montag


def main():
    today = dt.datetime.now(dt.timezone.utc).date()
    ns = namespace()

    # --- Tageszählung ---
    days = []
    seen_on = {}  # Hash -> set(Tage)
    first_day = {}  # Hash -> erster Tag mit n=1
    meta_last = {}  # Hash -> letzte Metadaten
    for i in range(DAYS - 1, -1, -1):
        d = today - dt.timedelta(days=i)
        ks = keys(ns, f'hi:{d.isoformat()}:')
        new = 0
        for k in ks:
            h = k['name'].split(':')[-1]
            m = k.get('metadata') or {}
            seen_on.setdefault(h, set()).add(d)
            meta_last[h] = m
            if m.get('n'):
                new += 1
                first_day.setdefault(h, d)
        days.append({'date': d.isoformat(), 'active': len(ks), 'new': new})

    # --- Wochen (Mo–So) ---
    weeks = []
    ws = week_start(today - dt.timedelta(days=DAYS - 1))
    while ws <= today:
        we = ws + dt.timedelta(days=6)
        active = {h for h, s in seen_on.items() if any(ws <= x <= we for x in s)}
        new = {h for h, f in first_day.items() if ws <= f <= we}
        weeks.append({'week': ws.isoformat(), 'active': len(active), 'new': len(new), '_set': active,
                      'complete': we < today})
        ws += dt.timedelta(days=7)
    for a, b in zip(weeks, weeks[1:]):
        b['returning'] = len(a['_set'] & b['_set'])
        b['retention'] = round(100 * b['returning'] / len(a['_set'])) if a['_set'] else None
    for w in weeks:
        w.pop('_set')

    # --- Aufteilung der letzten 7 Tage ---
    recent = {h for h, s in seen_on.items() if any(x > today - dt.timedelta(days=7) for x in s)}
    def split(field, fallback='?'):
        c = {}
        for h in recent:
            v = (meta_last.get(h) or {}).get(field) or fallback
            c[v] = c.get(v, 0) + 1
        return dict(sorted(c.items(), key=lambda x: -x[1]))
    testers = sum(1 for h in recent if (meta_last.get(h) or {}).get('t'))

    # --- Server-Anfragen pro Tag (GraphQL, höchstens ~4 Wochen) ---
    start = (today - dt.timedelta(days=27)).isoformat()
    q = {'query': 'query($a:String!,$s:Date!){viewer{accounts(filter:{accountTag:$a}){workersInvocationsAdaptive(limit:200,filter:{scriptName:"findimal",date_geq:$s},orderBy:[date_ASC]){sum{requests errors subrequests} dimensions{date}}}}}',
         'variables': {'a': ACCOUNT, 's': start}}
    try:
        g = cf('https://api.cloudflare.com/client/v4/graphql', json.dumps(q).encode())
        rows = g['data']['viewer']['accounts'][0]['workersInvocationsAdaptive']
        requests = [{'date': r['dimensions']['date'], 'requests': r['sum']['requests'], 'errors': r['sum']['errors'],
                     'ai': r['sum']['subrequests']} for r in rows]
    except Exception as e:  # Auswertung soll nicht an einer Quelle scheitern
        requests = {'error': str(e)[:200]}

    # --- Rangliste, Push ---
    board = len(keys(ns, 'p:'))
    push = len(keys(ns, 'pt:'))

    # --- TestFlight (optional) ---
    tf = None
    if os.environ.get('EXPO_ASC_API_KEY_P8'):
        try:
            import jwt  # pyjwt
            tok = jwt.encode({'iss': os.environ['EXPO_ASC_ISSUER_ID'], 'iat': int(time.time()), 'exp': int(time.time()) + 600,
                              'aud': 'appstoreconnect-v1'}, os.environ['EXPO_ASC_API_KEY_P8'], algorithm='ES256',
                             headers={'kid': os.environ['EXPO_ASC_KEY_ID'], 'typ': 'JWT'})
            req = urllib.request.Request(f'https://api.appstoreconnect.apple.com/v1/betaTesters?filter[apps]={APP_ID}&limit=200&fields[betaTesters]=state',
                                         headers={'Authorization': 'Bearer ' + tok})
            data = json.load(urllib.request.urlopen(req, timeout=30))['data']
            tf = {'testers': len(data), 'installed': sum(1 for x in data if x['attributes'].get('state') == 'INSTALLED')}
        except Exception as e:
            tf = {'error': str(e)[:200]}

    out = {
        'generated': dt.datetime.now(dt.timezone.utc).isoformat(timespec='minutes'),
        'today': today.isoformat(),
        'days': days,
        'weeks': weeks,
        'last7': {'active': len(recent), 'testers': testers, 'lang': split('l'), 'platform': split('p'), 'version': split('v')},
        'requests': requests,
        'board': board,
        'push': push,
        'testflight': tf,
    }
    text = json.dumps(out, ensure_ascii=False, indent=1)
    if len(sys.argv) > 1:
        open(sys.argv[1], 'w').write(text)
    else:
        print(text)


if __name__ == '__main__':
    main()
