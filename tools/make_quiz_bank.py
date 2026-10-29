#!/usr/bin/env python3
"""Erzeugt src/quizBank.ts aus den Fragen in tools/quiz/*.json (Forscher-Quiz).

Aufbau einer Frage (JSON):
  {"id": "a01", "lvl": 1|2|3, "type": "text"|"tf"|"pic"|"duel"|"rank", "right": 0,
   "img": ["q-tr-fox"]   (nur bei pic: ein großes Bild aus components/QuizArt.tsx, dazu 4 Textantworten),
  duel: 2 Antworten (Tier gegen Tier); rank: 4 Einträge schon in der RICHTIGEN Reihenfolge, "right" wird ignoriert.
   "de": {"q": "Frage", "a": ["Antwort", ...], "x": "Erklärung"}, "en": {...}, "fr": {...}, "es": {...}}
Aufruf: python3 tools/make_quiz_bank.py
"""
import glob, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGS = ['de', 'en', 'fr', 'es']
ART = open(os.path.join(ROOT, 'src/components/QuizArt.tsx'), encoding='utf-8').read()

qs, ids = [], set()
for path in sorted(glob.glob(os.path.join(ROOT, 'tools/quiz/*.json'))):
    for q in json.load(open(path, encoding='utf-8')):
        err = lambda m: sys.exit(f"{os.path.basename(path)} {q.get('id')}: {m}")
        if q['id'] in ids: err('doppelte id')
        ids.add(q['id'])
        if q['lvl'] not in (1, 2, 3) or q['type'] not in ('text', 'tf', 'pic', 'duel', 'rank'): err('lvl/type')
        n = {'text': 4, 'tf': 2, 'pic': 4, 'duel': 2, 'rank': 4}[q['type']]
        pics = 1 if q['type'] == 'pic' else 0
        if q['type'] == 'rank': q['right'] = 10123  # siehe encodeRank in src/forscher.ts
        if q['type'] != 'rank' and not 0 <= q['right'] < n: err('right')
        if pics:
            if len(q.get('img', [])) != pics or len(set(q['img'])) != pics: err('img')
            for i in q['img']:
                if f"'{i}'" not in ART: err(f'Bild fehlt: {i}')
        for l in LANGS:
            t = q.get(l) or err(f'Sprache {l} fehlt')
            if not t.get('q') or not t.get('x') or len(t.get('a', [])) != n: err(f'{l}: q/a/x')
        qs.append(q)

def s(v): return json.dumps(v, ensure_ascii=False)
out = ["// Fragen fürs Forscher-Quiz. Nicht von Hand ändern: Vorlage in tools/quiz/*.json,",
       "// neu erzeugen mit: python3 tools/make_quiz_bank.py", "import { Lang } from './i18n';", "",
       "export type BankText = { q: string; a: string[]; x: string };",
       "export type BankQuestion = {", "  id: string;", "  lvl: 1 | 2 | 3; // 1 mittel, 2 schwer, 3 sehr schwer",
       "  type: 'text' | 'tf' | 'pic' | 'duel' | 'rank'; // pic: ein großes Bild, duel: zwei gegeneinander, rank: Rangliste", "  right: number; // rank: immer 10123 (richtige Reihenfolge)", "  img?: string[]; // pic: Bild aus QuizArt",
       "  t: Record<Lang, BankText>;", "};", "", "export const BANK: BankQuestion[] = ["]
for q in qs:
    t = ', '.join(f"{l}: {{ q: {s(q[l]['q'])}, a: {s(q[l]['a'])}, x: {s(q[l]['x'])} }}" for l in LANGS)
    img = f", img: {s(q['img'])}" if 'img' in q else ''
    out.append(f"  {{ id: {s(q['id'])}, lvl: {q['lvl']}, type: {s(q['type'])}, right: {q['right']}{img}, t: {{ {t} }} }},")
out.append('];')
open(os.path.join(ROOT, 'src/quizBank.ts'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
from collections import Counter
print(f'quizBank.ts: {len(qs)} Fragen', dict(Counter(q["lvl"] for q in qs)), dict(Counter(q["type"] for q in qs)))
