#!/usr/bin/env python3
"""Erzeugt src/quizBank.ts aus den Fragen in tools/quiz/*.json (Forscher-Quiz).

Aufbau einer Frage (JSON):
  {"id": "a01", "lvl": 1|2|3, "type": "text"|"tf"|"image"|"pic"|"duel", "right": 0,
   "img": ["p-fox", ...]   (image: 4 Tiere als Antworten, duel: 2 Tiere gegeneinander, pic: 1 großes Bild + 4 Textantworten;
                            Bilder aus components/PlusAnimal.tsx (p-…) oder components/QuizArt.tsx (q-…)),
   "de": {"q": "Frage", "a": ["Antwort", ...], "x": "Erklärung"}, "en": {...}, "fr": {...}, "es": {...}}
Aufruf: python3 tools/make_quiz_bank.py
"""
import glob, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGS = ['de', 'en', 'fr', 'es']
ART = ''.join(open(os.path.join(ROOT, f), encoding='utf-8').read() for f in ('src/components/PlusAnimal.tsx', 'src/components/QuizArt.tsx'))

qs, ids = [], set()
for path in sorted(glob.glob(os.path.join(ROOT, 'tools/quiz/*.json'))):
    for q in json.load(open(path, encoding='utf-8')):
        err = lambda m: sys.exit(f"{os.path.basename(path)} {q.get('id')}: {m}")
        if q['id'] in ids: err('doppelte id')
        ids.add(q['id'])
        if q['lvl'] not in (1, 2, 3) or q['type'] not in ('text', 'tf', 'image', 'pic', 'duel'): err('lvl/type')
        n = {'text': 4, 'tf': 2, 'image': 4, 'pic': 4, 'duel': 2}[q['type']]
        pics = {'image': 4, 'pic': 1, 'duel': 2}.get(q['type'], 0)
        if not 0 <= q['right'] < n: err('right')
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
       "  type: 'text' | 'tf' | 'image' | 'pic' | 'duel'; // pic: ein großes Bild, duel: zwei Tiere gegeneinander", "  right: number;", "  img?: string[]; // Bilder aus PlusAnimal (p-…) oder QuizArt (q-…)",
       "  t: Record<Lang, BankText>;", "};", "", "export const BANK: BankQuestion[] = ["]
for q in qs:
    t = ', '.join(f"{l}: {{ q: {s(q[l]['q'])}, a: {s(q[l]['a'])}, x: {s(q[l]['x'])} }}" for l in LANGS)
    img = f", img: {s(q['img'])}" if 'img' in q else ''
    out.append(f"  {{ id: {s(q['id'])}, lvl: {q['lvl']}, type: {s(q['type'])}, right: {q['right']}{img}, t: {{ {t} }} }},")
out.append('];')
open(os.path.join(ROOT, 'src/quizBank.ts'), 'w', encoding='utf-8').write('\n'.join(out) + '\n')
from collections import Counter
print(f'quizBank.ts: {len(qs)} Fragen', dict(Counter(q["lvl"] for q in qs)), dict(Counter(q["type"] for q in qs)))
