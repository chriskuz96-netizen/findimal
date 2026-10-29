# Erzeugt src/components/QuizArt.tsx aus den Zeichnungen in tools/quiz_art.py (Bilder fürs Forscher-Quiz).
# Aufruf im Projektordner: python3 tools/make_quiz_art.py
import re

ns = {}
exec(open('tools/quiz_art.py', encoding='utf-8').read(), ns)
A = ns['A']
TAGS = {'path': 'Path', 'circle': 'Circle', 'ellipse': 'Ellipse', 'rect': 'Rect', 'g': 'G'}
ATTR = {'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin'}


def conv(svg):
    svg = re.sub(r'<(/?)(path|circle|ellipse|rect|g)\b', lambda m: '<' + m.group(1) + TAGS[m.group(2)], svg)
    for a, b in ATTR.items():
        svg = svg.replace(a + '=', b + '=')
    return re.sub(r'\b(cx|cy|r|rx|ry|x|y|width|height|strokeWidth|opacity)="(-?[\d.]+)"', r'\1={\2}', svg)


out = [
    "import { ReactElement } from 'react';",
    "import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';",
    '',
    '// Selbst gezeichnete Quiz-Bilder (Spuren, Umrisse am Himmel, Fundstücke): viewBox 0 0 64 64, ganze Fläche.',
    '// Nicht von Hand ändern: Vorlage in tools/quiz_art.py, neu erzeugen mit tools/make_quiz_art.py.',
    'export const QUIZ_ART: Record<string, () => ReactElement> = {',
]
for k, (n, a, b, inner) in A.items():
    body = '\n'.join('      ' + l.strip() for l in conv(inner.strip()).split('\n'))
    out.append(f"  // {n}\n  '{k}': () => (\n    <>\n{body}\n    </>\n  ),")
out += ['};', '', '// Hintergrund je Bild (oben, unten)', 'export const QUIZ_ART_BG: Record<string, [string, string]> = {']
out += [f"  '{k}': ['{a}', '{b}']," for k, (n, a, b, inner) in A.items()]
out.append('};')
open('src/components/QuizArt.tsx', 'w', encoding='utf-8').write('\n'.join(out) + '\n')
print('QuizArt.tsx erzeugt:', len(A), 'Bilder')
