# Selbst gezeichnete Bilder fürs Forscher-Quiz (SVG, viewBox 0 0 64 64): Spuren, Umrisse am Himmel, Fundstücke.
# Werden im Quiz als großes Bild in einer abgerundeten Karte gezeigt (nicht im Kreis wie die Plus-Tiere).
A = {}
MUD = ('#EADBB9', '#C7A978')   # Matsch / Sand
SNOW = ('#FBFDFF', '#CFDDEA')  # Schnee
SKY = ('#D6EEFB', '#7DB8E0')   # Himmel
P = '#6B4A2B'                  # Abdruck im Matsch
PS = '#8FA6BA'                 # Abdruck im Schnee
B = '#22303F'                  # Vogel-Umriss


def mirror(path):
    """Spiegelt eine Form an der Mitte (x = 32)."""
    return f'<g transform="translate(64 0) scale(-1 1)">{path}</g>'


# ---------- Spuren ----------
A['q-tr-fox'] = ('Spur Fuchs', *MUD, f'''<g fill="{P}">
<path d="M25.5 45 C26 40.5 29 38.5 32 38.5 C35 38.5 38 40.5 38.5 45 C39 49.5 35.5 51.5 32 51.5 C28.5 51.5 25 49.5 25.5 45Z"/>
<ellipse cx="22.5" cy="33" rx="3.4" ry="4.6" transform="rotate(-12 22.5 33)"/><ellipse cx="41.5" cy="33" rx="3.4" ry="4.6" transform="rotate(12 41.5 33)"/>
<ellipse cx="28.6" cy="22.5" rx="3.3" ry="4.8"/><ellipse cx="35.4" cy="22.5" rx="3.3" ry="4.8"/>
<ellipse cx="28.8" cy="14.8" rx="1" ry="1.8"/><ellipse cx="35.2" cy="14.8" rx="1" ry="1.8"/>
<ellipse cx="21" cy="26.2" rx="0.9" ry="1.6" transform="rotate(-15 21 26.2)"/><ellipse cx="43" cy="26.2" rx="0.9" ry="1.6" transform="rotate(15 43 26.2)"/></g>''')

A['q-tr-deer'] = ('Spur Reh', *MUD, f'''<g fill="{P}">
<path d="M30.8 13 C26.5 19 24.5 30 25.2 40 C25.7 46.5 28.5 49.5 30.8 48.5Z"/>{mirror('<path d="M30.8 13 C26.5 19 24.5 30 25.2 40 C25.7 46.5 28.5 49.5 30.8 48.5Z"/>')}</g>''')

A['q-tr-boar'] = ('Spur Wildschwein', *MUD, f'''<g fill="{P}">
<path d="M30.6 14 C24 18.5 21 28 21.8 37 C22.4 43 26.5 45.5 30.6 44.5Z"/>{mirror('<path d="M30.6 14 C24 18.5 21 28 21.8 37 C22.4 43 26.5 45.5 30.6 44.5Z"/>')}
<ellipse cx="17.5" cy="52" rx="3" ry="4.2" transform="rotate(-12 17.5 52)"/><ellipse cx="46.5" cy="52" rx="3" ry="4.2" transform="rotate(12 46.5 52)"/></g>''')

A['q-tr-badger'] = ('Spur Dachs', *MUD, f'''<g fill="{P}">
<path d="M15.5 42 C17 35.5 24 33 32 33 C40 33 47 35.5 48.5 42 C49.5 48 44 51 38 50.5 C35 50.2 33.5 49 32 49 C30.5 49 29 50.2 26 50.5 C20 51 14.5 48 15.5 42Z"/>
<ellipse cx="17" cy="28.5" rx="2.9" ry="3.6"/><ellipse cx="24.2" cy="25.5" rx="2.9" ry="3.6"/><ellipse cx="32" cy="24.6" rx="2.9" ry="3.6"/>
<ellipse cx="39.8" cy="25.5" rx="2.9" ry="3.6"/><ellipse cx="47" cy="28.5" rx="2.9" ry="3.6"/></g>
<path d="M16.4 23.5 L15.2 15.5 M23.8 20.5 L23.2 12 M32 19.6 V11 M40.2 20.5 L40.8 12 M47.6 23.5 L48.8 15.5" stroke="{P}" stroke-width="1.7" stroke-linecap="round"/>''')

A['q-tr-hare'] = ('Spurbild Hase', *SNOW, f'''<g fill="{PS}">
<ellipse cx="23.5" cy="17" rx="4.4" ry="9.5" transform="rotate(-8 23.5 17)"/><ellipse cx="40.5" cy="17" rx="4.4" ry="9.5" transform="rotate(8 40.5 17)"/>
<ellipse cx="30" cy="38" rx="3.4" ry="4.4"/><ellipse cx="33" cy="51" rx="3.4" ry="4.4"/></g>''')

A['q-tr-duck'] = ('Spur Ente', *MUD, f'''<path d="M32 50 L18 22 Q25 24 32 17 Q39 24 46 22Z" fill="#8B6A48"/>
<path d="M32 50 L17 21 M32 50 L32 13 M32 50 L47 21" stroke="{P}" stroke-width="3.4" stroke-linecap="round"/>
<path d="M32 50 L30.5 55" stroke="{P}" stroke-width="2.2" stroke-linecap="round"/>''')

A['q-tr-crow'] = ('Spur Krähe', *MUD, f'''<path d="M32 38 L21 17 M32 38 L32 12 M32 38 L43 17 M32 38 L32 57" stroke="{P}" stroke-width="2.8" stroke-linecap="round"/>
<circle cx="32" cy="38" r="2.6" fill="{P}"/>''')

# ---------- Umrisse am Himmel (von unten gesehen) ----------
A['q-si-buzzard'] = ('Umriss Mäusebussard', *SKY, f'''<g fill="{B}">
<path d="M30 27 C22 23.5 12 23.5 3.5 27.5 L5 29.5 L3 31.5 L5.5 33 L4 35 L7.5 36 L7 38 C14 38.5 22 37.5 30 36Z"/>{mirror('<path d="M30 27 C22 23.5 12 23.5 3.5 27.5 L5 29.5 L3 31.5 L5.5 33 L4 35 L7.5 36 L7 38 C14 38.5 22 37.5 30 36Z"/>')}
<ellipse cx="32" cy="31" rx="4.6" ry="10"/><circle cx="32" cy="21.5" r="3.8"/>
<path d="M28.5 38 L24.5 48 Q32 52 39.5 48 L35.5 38Z"/></g>''')

A['q-si-kite'] = ('Umriss Rotmilan', *SKY, f'''<g fill="{B}">
<path d="M30 27 C25 23 18 21 13 24 C9 26 5 27.5 2 27 L3.5 29 L2 30.5 L4.5 31.5 L3.5 33.5 L7 33.5 C12 34 16 33.5 19 32.5 C23 34 27 34.5 30 34Z"/>{mirror('<path d="M30 27 C25 23 18 21 13 24 C9 26 5 27.5 2 27 L3.5 29 L2 30.5 L4.5 31.5 L3.5 33.5 L7 33.5 C12 34 16 33.5 19 32.5 C23 34 27 34.5 30 34Z"/>')}
<ellipse cx="32" cy="30" rx="3.6" ry="9"/><circle cx="32" cy="21.5" r="3"/>
<path d="M29.5 37 L25 58 L32 50.5 L39 58 L34.5 37Z"/></g>''')

A['q-si-stork'] = ('Umriss Weißstorch', *SKY, f'''<g fill="{B}">
<path d="M30 26 C22 25 12 25.5 4 27 L2.5 29 L4.5 30 L2.5 31.5 L5 32.5 L3.5 34 L7 34.5 C15 35 23 34.5 30 34Z"/>{mirror('<path d="M30 26 C22 25 12 25.5 4 27 L2.5 29 L4.5 30 L2.5 31.5 L5 32.5 L3.5 34 L7 34.5 C15 35 23 34.5 30 34Z"/>')}
<ellipse cx="32" cy="31" rx="3.4" ry="8.5"/><circle cx="32" cy="11" r="2.4"/><path d="M30.6 41 L32 45 L33.4 41Z"/></g>
<path d="M32 24 V12 M32 9 V2.5" stroke="{B}" stroke-width="2.2" stroke-linecap="round"/>
<path d="M31 38 L30 61 M33 38 L34 61" stroke="{B}" stroke-width="1.6" stroke-linecap="round"/>''')

A['q-si-heron'] = ('Umriss Graureiher', *SKY, f'''<g fill="{B}">
<path d="M29.5 25 C22 21 13 22 5 28 C3.5 29.5 2.5 31 2.5 32.5 L5 32 L4 34.5 L7 34 L6.5 36.5 C14 34.5 22 34.5 29.5 36Z"/>{mirror('<path d="M29.5 25 C22 21 13 22 5 28 C3.5 29.5 2.5 31 2.5 32.5 L5 32 L4 34.5 L7 34 L6.5 36.5 C14 34.5 22 34.5 29.5 36Z"/>')}
<ellipse cx="32" cy="31" rx="4" ry="9.5"/><ellipse cx="32" cy="20.5" rx="4.2" ry="3.6"/></g>
<path d="M30.6 18 L32 10 L33.4 18Z" fill="{B}"/>
<path d="M31 39 L30 61 M33 39 L34 61" stroke="{B}" stroke-width="1.6" stroke-linecap="round"/>''')

A['q-si-swift'] = ('Umriss Mauersegler', *SKY, f'''<g fill="{B}">
<path d="M30 29 C22 26 11 30 3 44 C11 37 21 34 30 35Z"/>{mirror('<path d="M30 29 C22 26 11 30 3 44 C11 37 21 34 30 35Z"/>')}
<ellipse cx="32" cy="31" rx="3.2" ry="8.5"/><circle cx="32" cy="23" r="3"/>
<path d="M30 38 L28.5 45 L32 42.5 L35.5 45 L34 38Z"/></g>''')

A['q-si-swallow'] = ('Umriss Rauchschwalbe', *SKY, f'''<g fill="{B}">
<path d="M30 28 C23 24 15 23.5 6 27.5 C13 29 18 31 22 34 C25 34 28 34.5 30 34Z"/>{mirror('<path d="M30 28 C23 24 15 23.5 6 27.5 C13 29 18 31 22 34 C25 34 28 34.5 30 34Z"/>')}
<ellipse cx="32" cy="30" rx="3" ry="7.5"/><circle cx="32" cy="22.5" r="2.8"/>
<path d="M30.2 35 L26 57 L32 41 L38 57 L33.8 35Z"/></g>''')

# ---------- Fundstücke und Bauwerke ----------
A['q-fi-beaver'] = ('Angenagter Baum', '#DCEFD2', '#8DBF7E', '''<path d="M0 54 H64 V64 H0Z" fill="#7FA35A"/>
<path d="M22 56 L22 42 C22 38 29 35 31 31 L33 31 C35 35 42 38 42 42 L42 56Z" fill="#A9763F"/>
<path d="M24 12 L24 0 H40 V12 C40 16 34 20 33 25 L31 25 C30 20 24 16 24 12Z" fill="#A9763F"/>
<path d="M22.5 42 C24 38.5 29 36 31 31 L33 31 C35 36 40 38.5 41.5 42Z M24.5 12 C25 15.5 30 19.5 31 25 L33 25 C34 19.5 39 15.5 39.5 12Z" fill="#F0D9A8"/>
<path d="M26 40 L30 33 M29.5 41 L32 33 M34 41 L32.5 33 M38 40 L34 33 M27 15 L30.5 22 M31 16 L31.8 23 M35 16 L32.8 23 M38 14.5 L33.5 22" stroke="#C99A60" stroke-width="0.9" stroke-linecap="round"/>
<path d="M26 47 V54 M33 45 V55 M38 48 V54" stroke="#7A5128" stroke-width="1.1" stroke-linecap="round" opacity="0.7"/>
<g fill="#F0D9A8"><path d="M10 56 l4 -1.5 l1 1.5 l-4 1.5Z"/><path d="M47 57 l4.5 -1 l.6 1.5 l-4.5 1Z"/><path d="M15 59.5 l3.5 .8 l-.4 1.3 l-3.5 -.8Z"/><path d="M50 60.5 l3 -.6 l.4 1.2 l-3 .6Z"/></g>''')

A['q-fi-mole'] = ('Erdhügel in der Wiese', '#E3F3D4', '#9CCB84', '''<path d="M0 30 H64 V64 H0Z" fill="#86B95E"/>
<g fill="#6B4A2B"><path d="M8 44 C10 36 22 36 24 44Z"/><path d="M34 37 C36.5 30 46.5 30 49 37Z"/><path d="M38 57 C40.5 48 54 48 56.5 57Z"/></g>
<g fill="#8A6440"><circle cx="13" cy="41" r="1.4"/><circle cx="18" cy="40" r="1.2"/><circle cx="40" cy="34" r="1.2"/><circle cx="44" cy="35" r="1.4"/><circle cx="45" cy="53" r="1.3"/><circle cx="50" cy="52" r="1.2"/></g>
<path d="M4 33 l1 -3 M12 50 l1 -3 M27 33 l1 -3 M22 58 l1 -3 M58 41 l1 -3 M30 47 l1 -3" stroke="#5E9A3E" stroke-width="1.2" stroke-linecap="round"/>''')

A['q-fi-woodpecker'] = ('Loch im Baumstamm', '#DCEFD2', '#7FB36E', '''<path d="M18 0 H46 V58 H18Z" fill="#8A6440"/>
<path d="M22 4 V20 M27 26 V44 M40 6 V18 M38 30 V52 M24 48 V56" stroke="#6E4E30" stroke-width="1.3" stroke-linecap="round"/>
<ellipse cx="32" cy="24" rx="5.6" ry="6.4" fill="#3A2716"/><ellipse cx="32" cy="24" rx="5.6" ry="6.4" fill="none" stroke="#C99A60" stroke-width="1.4"/>
<path d="M0 58 H64 V64 H0Z" fill="#7FA35A"/>
<g fill="#E3C38E"><path d="M11 58.5 l3.5 -1.2 l.6 1.4 l-3.5 1.2Z"/><path d="M48 59 l4 -.8 l.4 1.4 l-4 .8Z"/><path d="M14 61.5 l3 .6 l-.3 1.3 l-3 -.6Z"/><path d="M52 61.8 l3 -.6 l.3 1.2 l-3 .6Z"/></g>''')

A['q-fi-wasp'] = ('Nest am Ast', '#E8F1F8', '#A9C4DA', '''<path d="M0 10 C16 7 40 8 64 4" stroke="#6E4E30" stroke-width="3.4" stroke-linecap="round" fill="none"/>
<path d="M32 8 C18 10 14 22 15 34 C16 46 23 54 32 55 C41 54 48 46 49 34 C50 22 46 10 32 8Z" fill="#CFC3AE"/>
<path d="M17 20 Q24 17 32 20 T47 20 M15.5 28 Q24 25 32 28 T48.5 28 M15.5 36 Q24 33 32 36 T48.5 36 M17.5 44 Q24 41 32 44 T46.5 44" stroke="#A89A82" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<ellipse cx="32" cy="51" rx="3" ry="2.4" fill="#3A2E22"/>''')

A['q-fi-ants'] = ('Hügel im Wald', '#E2EFD6', '#93B880', '''<path d="M0 54 H64 V64 H0Z" fill="#7A8F4A"/>
<path d="M4 56 C8 34 20 22 32 22 C44 22 56 34 60 56Z" fill="#9A6A3C"/>
<g stroke="#6E4726" stroke-width="1" stroke-linecap="round">
<path d="M14 46 l3 -1 M22 38 l2.5 1.5 M30 30 l3 -.5 M38 34 l2 2 M46 42 l3 1 M26 48 l3 -1.5 M36 46 l2.5 1.2 M18 52 l2 -2 M44 52 l3 -.4 M30 40 l3 .8 M40 27 l2 1.6 M22 30 l2 -1.8 M52 50 l2 -2"/></g>
<g stroke="#C08A52" stroke-width="1" stroke-linecap="round"><path d="M17 41 l2.5 .8 M27 34 l2 -1.5 M34 38 l2.6 -.4 M42 47 l2 1.6 M31 50 l2.4 .4 M48 47 l1.6 -2"/></g>''')

A['q-fi-spittle'] = ('Schaum am Grashalm', '#E5F4DA', '#A3CF8A', '''<path d="M30 64 C30 46 31 26 34 4" stroke="#4E8A2E" stroke-width="2.6" fill="none" stroke-linecap="round"/>
<path d="M31 40 C22 30 14 30 8 34 C16 34 23 37 31 44Z" fill="#6BA542"/>
<g fill="#FFFFFF" stroke="#D5E4D8" stroke-width="0.6"><circle cx="31" cy="27" r="5"/><circle cx="36" cy="24" r="4.2"/><circle cx="34" cy="31" r="4.4"/>
<circle cx="28" cy="32" r="3.6"/><circle cx="38" cy="29" r="3.2"/><circle cx="32.5" cy="20" r="3.4"/><circle cx="29" cy="22.5" r="2.6"/><circle cx="31.5" cy="35.5" r="2.8"/></g>
<g fill="#EEF5EF"><circle cx="30" cy="25" r="1.2"/><circle cx="35.5" cy="22.5" r="1"/><circle cx="33" cy="29.5" r="1.1"/></g>''')

A['q-fi-gall'] = ('Kugel am Eichenblatt', '#EAF4DA', '#A8CC84', '''<path d="M32 60 C31 50 32 44 32 40" stroke="#5E7F2A" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M32 42 C27 42 26 38 23 38 C19 38 21 33 18 31 C14 28 18 24 16 21 C14 17 20 15 21 12 C22 8 27 8 29 6 C30.5 4.5 33.5 4.5 35 6 C37 8 42 8 43 12 C44 15 50 17 48 21 C46 24 50 28 46 31 C43 33 45 38 41 38 C38 38 37 42 32 42Z" fill="#6E9E3A"/>
<path d="M32 40 V8 M32 30 L22 22 M32 30 L42 22 M32 20 L24 13 M32 20 L40 13" stroke="#4E7A26" stroke-width="1" stroke-linecap="round" fill="none"/>
<circle cx="38.5" cy="30" r="9" fill="#C9B25A"/><circle cx="38.5" cy="30" r="9" fill="none" stroke="#A88F3E" stroke-width="0.8"/>
<g fill="#B49A48"><circle cx="35" cy="26" r="0.8"/><circle cx="41" cy="27.5" r="0.7"/><circle cx="37" cy="33" r="0.8"/><circle cx="42" cy="33.5" r="0.6"/></g>
<path d="M34 25 C35.5 23.5 37.5 23 39 23.2" stroke="#E4D38A" stroke-width="1.3" fill="none" stroke-linecap="round"/>''')

A['q-fi-pellet'] = ('Fund unter dem Baum', '#EFE7D6', '#C4B28E', '''<path d="M0 46 H64 V64 H0Z" fill="#8A7A56"/>
<path d="M12 46 C11 38 18 33 28 33 L40 33 C50 33 55 38 53 46 C51 52 44 54 36 54 L26 54 C18 54 13 51 12 46Z" fill="#8E8A84"/>
<path d="M16 40 q3 -2 6 0 M28 37 q3 -2 6 0 M42 38 q3 -1.5 6 .5 M19 49 q3 -1.5 6 0 M34 50 q3 -1.5 6 0" stroke="#A7A39C" stroke-width="1.2" fill="none" stroke-linecap="round"/>
<path d="M21 43 H31" stroke="#F4EEE2" stroke-width="2" stroke-linecap="round"/><circle cx="20.5" cy="43" r="1.4" fill="#F4EEE2"/><circle cx="31.5" cy="43" r="1.4" fill="#F4EEE2"/>
<path d="M37 43 C37 39.5 44 39.5 44 43 L43 46 L38 46Z" fill="#F4EEE2"/><circle cx="39.3" cy="42.5" r="0.9" fill="#8E8A84"/><circle cx="41.7" cy="42.5" r="0.9" fill="#8E8A84"/>
<path d="M45 48 L49 46" stroke="#F4EEE2" stroke-width="1.4" stroke-linecap="round"/>''')
