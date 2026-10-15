import { ReactElement } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

// Selbst gezeichnete Plus-Tiere (statt Emojis): viewBox 0 0 64 64, Mitte 32/32, sichtbarer Kreis r = 26.
// Vorlage zum Ändern: dieselben Formen als SVG (siehe Git-Verlauf „Plus-Tiere selbst gezeichnet“).
export const PLUS_ANIMAL_ART: Record<string, () => ReactElement> = {
  // Fuchs
  'p-fox': () => (
    <>
      <G transform="translate(32 33) scale(0.52) translate(-50 -48)">
      <Path d="M23 44L28 13L48 30Z" fill="#E8833A"/><Path d="M77 44L72 13L52 30Z" fill="#E8833A"/>
      <Path d="M28 36L31 20L41 30Z" fill="#7A3E17"/><Path d="M72 36L69 20L59 30Z" fill="#7A3E17"/>
      <Path d="M18 44Q18 27 36 27L64 27Q82 27 82 44Q82 62 50 80Q18 62 18 44Z" fill="#E8833A"/>
      <Path d="M18 44Q30 54 44 58Q48 66 50 80Q24 66 18 44Z" fill="#FFF3E6"/><Path d="M82 44Q70 54 56 58Q52 66 50 80Q76 66 82 44Z" fill="#FFF3E6"/>
      <Ellipse cx={37} cy={46} rx={3.8} ry={4.6} fill="#13261C"/><Circle cx={38.3} cy={44.4} r={1.3} fill="#fff"/>
      <Ellipse cx={63} cy={46} rx={3.8} ry={4.6} fill="#13261C"/><Circle cx={64.3} cy={44.4} r={1.3} fill="#fff"/>
      <Ellipse cx={50} cy={76} rx={4.6} ry={3.4} fill="#13261C"/></G>
    </>
  ),
  // Eule
  'p-owl': () => (
    <>
      <Path d="M17 20 L22 27 L26 22 Z" fill="#5B3A86"/><Path d="M47 20 L42 27 L38 22 Z" fill="#5B3A86"/>
      <Path d="M32 18c-10 0-16 7-16 17 0 11 7 19 16 19s16-8 16-19c0-10-6-17-16-17z" fill="#7A55B0"/>
      <Path d="M32 38c-6 0-10 4-10 10 3 4 6 6 10 6s7-2 10-6c0-6-4-10-10-10z" fill="#E8DDF7"/>
      <Path d="M26 42q2 1.5 4 0M34 42q2 1.5 4 0M28 47q2 1.5 4 0M32 47q2 1.5 4 0" stroke="#B9A6DA" strokeWidth={1.1} fill="none" strokeLinecap="round"/>
      <Circle cx={25.5} cy={31} r={6.5} fill="#FFF3E6"/><Circle cx={38.5} cy={31} r={6.5} fill="#FFF3E6"/>
      <Circle cx={25.5} cy={31} r={4} fill="#E8833A"/><Circle cx={38.5} cy={31} r={4} fill="#E8833A"/>
      <Circle cx={25.5} cy={31} r={2.3} fill="#13261C"/><Circle cx={38.5} cy={31} r={2.3} fill="#13261C"/>
      <Circle cx={26.4} cy={30} r={0.9} fill="#fff"/><Circle cx={39.4} cy={30} r={0.9} fill="#fff"/>
      <Path d="M30 35.5h4l-2 4z" fill="#E8B53A"/>
    </>
  ),
  // Wolf
  'p-wolf': () => (
    <>
      <G transform="translate(32 33) scale(0.52) translate(-50 -48)">
      <Path d="M21 46L25 9L47 29Z" fill="#7F93A8"/><Path d="M79 46L75 9L53 29Z" fill="#7F93A8"/>
      <Path d="M27 37L29 18L41 29Z" fill="#3E4F63"/><Path d="M73 37L71 18L59 29Z" fill="#3E4F63"/>
      <Path d="M16 46Q16 26 36 26L64 26Q84 26 84 46Q84 63 50 82Q16 63 16 46Z" fill="#9AAEC2"/>
      <Path d="M36 26Q50 34 64 26L60 40Q50 44 40 40Z" fill="#6D8299"/>
      <Path d="M22 50Q34 56 44 58Q47 68 50 82Q26 68 22 50Z" fill="#EEF2F6"/><Path d="M78 50Q66 56 56 58Q53 68 50 82Q74 68 78 50Z" fill="#EEF2F6"/>
      <Ellipse cx={38} cy={46} rx={3.6} ry={4.3} fill="#13261C"/><Circle cx={39.2} cy={44.6} r={1.2} fill="#fff"/><Ellipse cx={62} cy={46} rx={3.6} ry={4.3} fill="#13261C"/><Circle cx={63.2} cy={44.6} r={1.2} fill="#fff"/>
      <Ellipse cx={50} cy={76} rx={5} ry={3.6} fill="#13261C"/></G>
    </>
  ),
  // Reh
  'p-deer': () => (
    <>
      <G transform="translate(32 34) scale(0.5) translate(-50 -50)">
      <Path d="M34 26 C30 18 28 12 22 8 M30 18 L22 18 M32 22 L26 26" stroke="#5A3D28" strokeWidth={3.2} fill="none" strokeLinecap="round"/>
      <Path d="M66 26 C70 18 72 12 78 8 M70 18 L78 18 M68 22 L74 26" stroke="#5A3D28" strokeWidth={3.2} fill="none" strokeLinecap="round"/>
      <Ellipse cx={22} cy={38} rx={11} ry={6} transform="rotate(-25 22 38)" fill="#B9784A"/><Ellipse cx={22} cy={38} rx={6.5} ry={3} transform="rotate(-25 22 38)" fill="#F2D2B6"/>
      <Ellipse cx={78} cy={38} rx={11} ry={6} transform="rotate(25 78 38)" fill="#B9784A"/><Ellipse cx={78} cy={38} rx={6.5} ry={3} transform="rotate(25 78 38)" fill="#F2D2B6"/>
      <Path d="M50 26C38 26 31 34 32 46c1 10 6 22 18 30 12-8 17-20 18-30 1-12-6-20-18-20z" fill="#C98552"/>
      <Path d="M50 52c-6 0-9 5-9 11 2 6 5 10 9 13 4-3 7-7 9-13 0-6-3-11-9-11z" fill="#F2D2B6"/>
      <Ellipse cx={41} cy={46} rx={3.6} ry={4.3} fill="#13261C"/><Circle cx={42.2} cy={44.6} r={1.2} fill="#fff"/>
      <Ellipse cx={59} cy={46} rx={3.6} ry={4.3} fill="#13261C"/><Circle cx={60.2} cy={44.6} r={1.2} fill="#fff"/>
      <Ellipse cx={50} cy={70} rx={4.4} ry={3.2} fill="#13261C"/>
      <Circle cx={44} cy={34} r={1.3} fill="#F2D2B6"/><Circle cx={56} cy={33} r={1.1} fill="#F2D2B6"/></G>
    </>
  ),
  // Bär
  'p-bear': () => (
    <>
      <Circle cx={19} cy={20} r={6} fill="#7A4A26"/><Circle cx={45} cy={20} r={6} fill="#7A4A26"/>
      <Circle cx={19} cy={20} r={3} fill="#C98A5A"/><Circle cx={45} cy={20} r={3} fill="#C98A5A"/>
      <Circle cx={32} cy={34} r={16} fill="#8E5A30"/>
      <Ellipse cx={32} cy={41} rx={8.5} ry={6.5} fill="#E2B88E"/>
      <Ellipse cx={25.5} cy={31} rx={2.2} ry={2.7} fill="#13261C"/><Circle cx={26.3} cy={30.1} r={0.8} fill="#fff"/><Ellipse cx={38.5} cy={31} rx={2.2} ry={2.7} fill="#13261C"/><Circle cx={39.3} cy={30.1} r={0.8} fill="#fff"/><Ellipse cx={32} cy={38} rx={3.2} ry={2.3} fill="#13261C"/>
      <Path d="M32 40.5v2.3M29.5 43.5q2.5 2 5 0" stroke="#13261C" strokeWidth={1.2} fill="none" strokeLinecap="round"/>
    </>
  ),
  // Adler
  'p-eagle': () => (
    <>
      <Path d="M12 58 Q14 40 32 38 Q50 40 52 58Z" fill="#6B3E1F"/>
      <Path d="M32 14c-9 0-14 7-14 15 0 6 3 10 7 12h14c4-2 7-6 7-12 0-8-5-15-14-15z" fill="#FFFFFF"/>
      <Path d="M18 31c4 1 8 0 11-2M46 31c-4 1-8 0-11-2" stroke="#D9DEE3" strokeWidth={1.2} fill="none"/>
      <Ellipse cx={25.5} cy={32.5} rx={1.9} ry={2.3} fill="#13261C"/><Circle cx={26.3} cy={31.6} r={0.8} fill="#fff"/><Ellipse cx={38.5} cy={32.5} rx={1.9} ry={2.3} fill="#13261C"/><Circle cx={39.3} cy={31.6} r={0.8} fill="#fff"/>
      <Path d="M27.5 36h9c0 4-2.5 7-4.5 9-1-1.5-1.5-3-1.5-4.5h-3z" fill="#F2B02E"/><Path d="M32 45c1.5-.8 3-2.8 3.5-5" stroke="#B87A0E" strokeWidth={1} fill="none"/>
    </>
  ),
  // Schildkröte
  'p-turtle': () => (
    <>
      <Ellipse cx={32} cy={45} rx={19} ry={12} fill="#5E8A2E"/>
      <Path d="M18 44h28M24 37l-3 8 3 8M40 37l3 8-3 8M32 34v22" stroke="#3E6018" strokeWidth={1.4} fill="none"/>
      <Ellipse cx={32} cy={44} rx={19} ry={12} fill="none" stroke="#C9A54A" strokeWidth={1.6}/>
      <Circle cx={32} cy={27} r={11} fill="#8CC56A"/>
      <Ellipse cx={27.5} cy={25.5} rx={2.2} ry={2.7} fill="#13261C"/><Circle cx={28.3} cy={24.6} r={0.8} fill="#fff"/><Ellipse cx={36.5} cy={25.5} rx={2.2} ry={2.7} fill="#13261C"/><Circle cx={37.3} cy={24.6} r={0.8} fill="#fff"/><Path d="M28 31q4 3 8 0" stroke="#13261C" strokeWidth={1.3} fill="none" strokeLinecap="round"/>
      <Circle cx={25} cy={29.5} r={1.6} fill="#F2A3A3" opacity={0.7}/><Circle cx={39} cy={29.5} r={1.6} fill="#F2A3A3" opacity={0.7}/>
    </>
  ),
  // Schmetterling
  'p-butterfly': () => (
    <>
      <Path d="M31 30 C24 14 9 13 10 24 C11 33 22 34 31 32Z" fill="#F08A2E"/>
      <Path d="M33 30 C40 14 55 13 54 24 C53 33 42 34 33 32Z" fill="#F08A2E"/>
      <Path d="M31 34 C22 35 14 44 19 50 C24 54 30 45 31 37Z" fill="#E8B53A"/>
      <Path d="M33 34 C42 35 50 44 45 50 C40 54 34 45 33 37Z" fill="#E8B53A"/>
      <Circle cx={17} cy={23} r={2.6} fill="#fff"/><Circle cx={47} cy={23} r={2.6} fill="#fff"/>
      <Circle cx={22} cy={45} r={1.8} fill="#7A3E17"/><Circle cx={42} cy={45} r={1.8} fill="#7A3E17"/>
      <Path d="M17 18c2-1 5-.8 7 .5M47 18c-2-1-5-.8-7 .5" stroke="#7A3E17" strokeWidth={1.2} fill="none" strokeLinecap="round"/>
      <Rect x={30} y={22} width={4} height={26} rx={2} fill="#13261C"/>
      <Path d="M31 22c-1-4-3-6-5-7M33 22c1-4 3-6 5-7" stroke="#13261C" strokeWidth={1.2} fill="none" strokeLinecap="round"/>
    </>
  ),
  // Biene
  'p-bee': () => (
    <>
      <Ellipse cx={22} cy={24} rx={8} ry={6} transform="rotate(-30 22 24)" fill="#FFFFFF" opacity={0.85}/>
      <Ellipse cx={42} cy={24} rx={8} ry={6} transform="rotate(30 42 24)" fill="#FFFFFF" opacity={0.85}/>
      <Ellipse cx={32} cy={38} rx={15} ry={13} fill="#F6C83A"/>
      <Path d="M20 31h24M18 39h28M21 47h22" stroke="#13261C" strokeWidth={3.6} strokeLinecap="round"/>
      <Circle cx={32} cy={26} r={8} fill="#F6C83A"/>
      <Ellipse cx={29} cy={25} rx={1.7} ry={2} fill="#13261C"/><Circle cx={29.8} cy={24.1} r={0.8} fill="#fff"/><Ellipse cx={35} cy={25} rx={1.7} ry={2} fill="#13261C"/><Circle cx={35.8} cy={24.1} r={0.8} fill="#fff"/><Path d="M29.5 29q2.5 2 5 0" stroke="#13261C" strokeWidth={1.1} fill="none" strokeLinecap="round"/>
      <Path d="M29 18.5c-1-3-3-4-4.5-4M35 18.5c1-3 3-4 4.5-4" stroke="#13261C" strokeWidth={1.2} fill="none" strokeLinecap="round"/>
      <Circle cx={24.5} cy={14.5} r={1.2} fill="#13261C"/><Circle cx={39.5} cy={14.5} r={1.2} fill="#13261C"/>
    </>
  ),
  // Marienkäfer
  'p-ladybug': () => (
    <>
      <Path d="M13 40c0-11 8.5-19 19-19s19 8 19 19c0 7-8.5 12-19 12s-19-5-19-12z" fill="#D7302A"/>
      <Path d="M32 21v31" stroke="#13261C" strokeWidth={1.6}/>
      <Circle cx={23} cy={33} r={3} fill="#13261C"/><Circle cx={41} cy={33} r={3} fill="#13261C"/><Circle cx={20} cy={43} r={2.6} fill="#13261C"/>
      <Circle cx={44} cy={43} r={2.6} fill="#13261C"/><Circle cx={27} cy={47} r={2} fill="#13261C"/><Circle cx={37} cy={47} r={2} fill="#13261C"/>
      <Path d="M22 22c2-6 7-9 10-9s8 3 10 9c-3 2-6 3-10 3s-7-1-10-3z" fill="#13261C"/>
      <Circle cx={27.5} cy={19} r={2.2} fill="#fff"/><Circle cx={36.5} cy={19} r={2.2} fill="#fff"/>
      <Circle cx={28} cy={19.3} r={1.1} fill="#13261C"/><Circle cx={37} cy={19.3} r={1.1} fill="#13261C"/>
      <Path d="M28 13c-1-3-3-4-5-4M36 13c1-3 3-4 5-4" stroke="#13261C" strokeWidth={1.2} fill="none" strokeLinecap="round"/>
    </>
  ),
  // Igel
  'p-hedgehog': () => (
    <>
      <Path d="M10 44 L12 36 L8 33 L14 30 L12 24 L18 24 L18 17 L24 20 L26 13 L31 18 L35 12 L38 18 L44 14 L45 21 L51 20 L49 27 L55 28 L51 33 L56 37 L50 40 L52 46 Z" fill="#6B4A2B"/>
      <Path d="M14 42 L16 34 L22 28 L28 24 L34 22 L40 24 L46 28 L50 36 L50 44 Z" fill="#8E6440"/>
      <Path d="M30 30c-10 0-16 6-16 13 0 5 6 9 16 9 4 0 7-.5 10-2l12-5c1-1 1-2.5 0-3.5-5-4-12-11-22-11.5z" fill="#E8C9A0"/>
      <Circle cx={53} cy={41} r={2.6} fill="#13261C"/>
      <Ellipse cx={36} cy={38} rx={2} ry={2.5} fill="#13261C"/><Circle cx={36.7} cy={37.2} r={0.7} fill="#fff"/>
      <Circle cx={30} cy={43} r={2} fill="#F2A3A3" opacity={0.7}/>
    </>
  ),
  // Eichhörnchen
  'p-squirrel': () => (
    <>
      <Path d="M42 54c10-2 14-10 12-20-2-9-9-14-14-12 5 3 7 9 6 15-1 7-5 11-10 13z" fill="#C2541B"/>
      <Path d="M46 26c3 3 4 8 3 13" stroke="#E8833A" strokeWidth={2} fill="none" strokeLinecap="round"/>
      <Path d="M19 22 L21 11 L27 19Z" fill="#C2541B"/><Path d="M39 22 L37 11 L31 19Z" fill="#C2541B"/>
      <Path d="M20 11 l1 -3 M38 11 l-1 -3" stroke="#7A3E17" strokeWidth={1.6} strokeLinecap="round"/>
      <Circle cx={29} cy={32} r={13} fill="#E06A28"/>
      <Ellipse cx={29} cy={38} rx={8} ry={6.5} fill="#FBE3CC"/>
      <Ellipse cx={23.5} cy={29.5} rx={2.2} ry={2.7} fill="#13261C"/><Circle cx={24.3} cy={28.6} r={0.8} fill="#fff"/><Ellipse cx={34.5} cy={29.5} rx={2.2} ry={2.7} fill="#13261C"/><Circle cx={35.3} cy={28.6} r={0.8} fill="#fff"/><Ellipse cx={29} cy={35} rx={2} ry={1.5} fill="#13261C"/>
      <Path d="M29 36.5v1.5M27 38.6q2 1.4 4 0" stroke="#13261C" strokeWidth={1.1} fill="none" strokeLinecap="round"/>
    </>
  ),
  // Frosch
  'p-frog': () => (
    <>
      <Ellipse cx={32} cy={38} rx={20} ry={14} fill="#5DBB4A"/>
      <Circle cx={21} cy={25} r={7.5} fill="#5DBB4A"/><Circle cx={43} cy={25} r={7.5} fill="#5DBB4A"/>
      <Circle cx={21} cy={25} r={4.8} fill="#FFFFFF"/><Circle cx={43} cy={25} r={4.8} fill="#FFFFFF"/>
      <Circle cx={21.6} cy={25.6} r={2.6} fill="#13261C"/><Circle cx={43.6} cy={25.6} r={2.6} fill="#13261C"/>
      <Circle cx={22.4} cy={24.6} r={0.9} fill="#fff"/><Circle cx={44.4} cy={24.6} r={0.9} fill="#fff"/>
      <Path d="M20 40q12 8 24 0" stroke="#2E6E22" strokeWidth={1.8} fill="none" strokeLinecap="round"/>
      <Ellipse cx={32} cy={46} rx={11} ry={4.5} fill="#BEE59A"/>
      <Circle cx={18} cy={38} r={2.2} fill="#F2A3A3" opacity={0.7}/><Circle cx={46} cy={38} r={2.2} fill="#F2A3A3" opacity={0.7}/>
    </>
  ),
  // Eidechse
  'p-lizard': () => (
    <>
      <Path d="M32 10c-8 0-12 8-12 18 0 11 5 22 12 26 7-4 12-15 12-26 0-10-4-18-12-18z" fill="#4FA34A"/>
      <Path d="M32 30c-3 0-5 2-5 5s2 4 5 4 5-1 5-4-2-5-5-5z" fill="#9BD86A"/>
      <Circle cx={27} cy={22} r={1.4} fill="#2E6E22"/><Circle cx={37} cy={22} r={1.4} fill="#2E6E22"/><Circle cx={32} cy={44} r={1.6} fill="#2E6E22"/><Circle cx={28} cy={48} r={1.2} fill="#2E6E22"/><Circle cx={36} cy={48} r={1.2} fill="#2E6E22"/>
      <Circle cx={22.5} cy={17} r={3.6} fill="#4FA34A"/><Circle cx={41.5} cy={17} r={3.6} fill="#4FA34A"/>
      <Circle cx={22.5} cy={17} r={2.2} fill="#F6C83A"/><Circle cx={41.5} cy={17} r={2.2} fill="#F6C83A"/>
      <Rect x={22} y={15.5} width={1} height={3} rx={0.5} fill="#13261C"/><Rect x={41} y={15.5} width={1} height={3} rx={0.5} fill="#13261C"/>
      <Path d="M28 13q4 2 8 0" stroke="#2E6E22" strokeWidth={1.2} fill="none" strokeLinecap="round"/>
    </>
  ),
  // Delfin
  'p-dolphin': () => (
    <>
      <Path d="M12 46c4-16 16-26 30-26 6 0 10 2 12 4l-6 2c2 4 1 9-2 13-5 7-15 10-24 9 2-2 2-4 1-6-4 1-8 3-11 4z" fill="#4A8FC2"/>
      <Path d="M33 21 C34 15 38 12 42 11 C40 15 40 18 41 20Z" fill="#3A7AAE"/>
      <Path d="M20 50c6 1 14 0 20-4 3-2 5-5 6-8-6 6-16 9-26 12z" fill="#CFE8F7"/>
      <Path d="M54 24l6-1-2 4" fill="#4A8FC2"/>
      <Ellipse cx={44} cy={27} rx={1.8} ry={2.2} fill="#13261C"/><Circle cx={44.6} cy={26.3} r={0.7} fill="#fff"/>
      <Path d="M48 31q3 1 5-1" stroke="#13261C" strokeWidth={1.1} fill="none" strokeLinecap="round"/>
    </>
  ),
  // Krake
  'p-octopus': () => (
    <>
      <Path d="M16 44c-3 4-2 9 2 9 2 0 3-2 3-4M24 46c-2 5 0 9 3 8 2-.5 2-3 1-5M40 46c2 5 0 9-3 8-2-.5-2-3-1-5M48 44c3 4 2 9-2 9-2 0-3-2-3-4M30 47c0 5 1 8 3 8s2-3 1-6" stroke="#E0558A" strokeWidth={4.5} fill="none" strokeLinecap="round"/>
      <Path d="M32 12c-10 0-17 8-17 18 0 9 7 16 17 16s17-7 17-16c0-10-7-18-17-18z" fill="#F07AA6"/>
      <Circle cx={25} cy={18} r={2} fill="#F7A8C8"/><Circle cx={38} cy={16} r={1.5} fill="#F7A8C8"/>
      <Ellipse cx={26} cy={30} rx={2.4} ry={3} fill="#13261C"/><Circle cx={26.8} cy={29.1} r={0.8} fill="#fff"/><Ellipse cx={38} cy={30} rx={2.4} ry={3} fill="#13261C"/><Circle cx={38.8} cy={29.1} r={0.8} fill="#fff"/><Path d="M28.5 37q3.5 2.5 7 0" stroke="#13261C" strokeWidth={1.3} fill="none" strokeLinecap="round"/>
      <Circle cx={21} cy={35} r={2} fill="#D8436F" opacity={0.6}/><Circle cx={43} cy={35} r={2} fill="#D8436F" opacity={0.6}/>
    </>
  ),
  // Papagei
  'p-parrot': () => (
    <>
      <Path d="M14 58 Q16 40 32 38 Q48 40 50 58Z" fill="#2E9E4A"/>
      <Path d="M32 12c-10 0-15 8-15 16 0 7 4 12 9 13h12c5-1 9-6 9-13 0-8-5-16-15-16z" fill="#E03A2A"/>
      <Path d="M19 30c3 4 7 6 11 6" stroke="#F6C83A" strokeWidth={3} fill="none" strokeLinecap="round"/>
      <Circle cx={25} cy={25} r={4.2} fill="#FFFFFF"/><Circle cx={25.6} cy={25.4} r={2.2} fill="#13261C"/><Circle cx={26.3} cy={24.6} r={0.8} fill="#fff"/>
      <Path d="M32 22c7 0 11 4 11 9 0 4-2 7-5 8 1-3 0-6-3-7-1 0-2 .5-3 1z" fill="#F2E3C6"/>
      <Path d="M35 33c1 2 1 4 0 6" stroke="#2E2A26" strokeWidth={1.3} fill="none" strokeLinecap="round"/>
    </>
  ),
  // Flamingo
  'p-flamingo': () => (
    <>
      <Path d="M30 58 C30 46 22 44 22 34 C22 26 28 22 33 22" stroke="#F07AA6" strokeWidth={6} fill="none" strokeLinecap="round"/>
      <Circle cx={35} cy={20} r={7.5} fill="#F07AA6"/>
      <Path d="M40 18c5 0 9 3 9 7 0 2-1 3-2 4-1-3-4-5-8-5z" fill="#FFFFFF"/>
      <Path d="M44 21c3 1 5 3 5 4 0 2-1 3-2 4-.5-2-1.5-3-3-4z" fill="#13261C"/>
      <Ellipse cx={34.5} cy={18.5} rx={1.8} ry={2.2} fill="#13261C"/><Circle cx={35.1} cy={17.8} r={0.7} fill="#fff"/>
      <Path d="M14 58c4-8 12-12 22-12s16 5 18 12z" fill="#F7A8C8"/>
    </>
  ),
  // Pinguin
  'p-penguin': () => (
    <>
      <Path d="M32 12c-11 0-18 9-18 21 0 13 8 23 18 23s18-10 18-23c0-12-7-21-18-21z" fill="#22303F"/>
      <Path d="M32 22c-7 0-12 5-12 12 0 9 5 17 12 17s12-8 12-17c0-7-5-12-12-12z" fill="#FFFFFF"/>
      <Path d="M24 24c3-2 5-2 8 0 3-2 5-2 8 0" stroke="#22303F" strokeWidth={3} fill="none"/>
      <Ellipse cx={27.5} cy={30} rx={1.9} ry={2.3} fill="#13261C"/><Circle cx={28.3} cy={29.1} r={0.8} fill="#fff"/><Ellipse cx={36.5} cy={30} rx={1.9} ry={2.3} fill="#13261C"/><Circle cx={37.3} cy={29.1} r={0.8} fill="#fff"/><Path d="M28.5 35h7l-3.5 4z" fill="#F2A12E"/>
      <Circle cx={24.5} cy={36} r={1.9} fill="#F2A3A3" opacity={0.7}/><Circle cx={39.5} cy={36} r={1.9} fill="#F2A3A3" opacity={0.7}/>
    </>
  ),
  // Löwe
  'p-lion': () => (
    <>
      <Circle cx={32} cy={33} r={21} fill="#B8641C"/>
      <Path d="M32 12l4 5 6-3 1 6 6 1-3 5 5 4-5 3 3 5-6 1-1 6-6-3-4 5-4-5-6 3-1-6-6-1 3-5-5-3 5-4-3-5 6-1 1-6 6 3z" fill="#C97424"/>
      <Circle cx={32} cy={34} r={13} fill="#F2B84A"/>
      <Circle cx={22} cy={23} r={3.4} fill="#F2B84A"/><Circle cx={42} cy={23} r={3.4} fill="#F2B84A"/>
      <Ellipse cx={32} cy={40} rx={7} ry={5.5} fill="#FBE3B6"/>
      <Ellipse cx={26.5} cy={32} rx={2.2} ry={2.7} fill="#13261C"/><Circle cx={27.3} cy={31.1} r={0.8} fill="#fff"/><Ellipse cx={37.5} cy={32} rx={2.2} ry={2.7} fill="#13261C"/><Circle cx={38.3} cy={31.1} r={0.8} fill="#fff"/><Path d="M29.5 37.5h5l-2.5 2.6z" fill="#7A3E17"/>
      <Path d="M32 40v1.6M29.5 42.5q2.5 1.8 5 0" stroke="#7A3E17" strokeWidth={1.1} fill="none" strokeLinecap="round"/>
    </>
  ),
  // Tiger
  'p-tiger': () => (
    <>
      <Circle cx={19} cy={19} r={5.5} fill="#E8833A"/><Circle cx={45} cy={19} r={5.5} fill="#E8833A"/>
      <Circle cx={19} cy={19} r={2.6} fill="#FBE3CC"/><Circle cx={45} cy={19} r={2.6} fill="#FBE3CC"/>
      <Circle cx={32} cy={34} r={17} fill="#EE8A2C"/>
      <Path d="M32 17v6M27 18l1.5 5M37 18l-1.5 5M15.5 30h6M15.5 36h5M48.5 30h-6M48.5 36h-5" stroke="#13261C" strokeWidth={2} strokeLinecap="round"/>
      <Path d="M32 36c-6 0-11 3-11 8 2 4 6 6 11 6s9-2 11-6c0-5-5-8-11-8z" fill="#FFF6EA"/>
      <Ellipse cx={25.5} cy={31} rx={2.2} ry={2.7} fill="#13261C"/><Circle cx={26.3} cy={30.1} r={0.8} fill="#fff"/><Ellipse cx={38.5} cy={31} rx={2.2} ry={2.7} fill="#13261C"/><Circle cx={39.3} cy={30.1} r={0.8} fill="#fff"/><Path d="M29.5 37h5l-2.5 2.6z" fill="#D86A6A"/>
      <Path d="M32 39.5v1.6M29.5 42.5q2.5 1.8 5 0" stroke="#13261C" strokeWidth={1.1} fill="none" strokeLinecap="round"/>
    </>
  ),
  // Panda
  'p-panda': () => (
    <>
      <Circle cx={18} cy={19} r={6} fill="#22303F"/><Circle cx={46} cy={19} r={6} fill="#22303F"/>
      <Circle cx={32} cy={34} r={17} fill="#FFFFFF"/>
      <Ellipse cx={25} cy={32} rx={5} ry={6.5} transform="rotate(-25 25 32)" fill="#22303F"/>
      <Ellipse cx={39} cy={32} rx={5} ry={6.5} transform="rotate(25 39 32)" fill="#22303F"/>
      <Circle cx={25.5} cy={32} r={2} fill="#fff"/><Circle cx={38.5} cy={32} r={2} fill="#fff"/>
      <Circle cx={25.8} cy={32.2} r={1.1} fill="#13261C"/><Circle cx={38.8} cy={32.2} r={1.1} fill="#13261C"/>
      <Ellipse cx={32} cy={40} rx={3} ry={2.2} fill="#22303F"/>
      <Path d="M32 42v1.6M29.5 44.5q2.5 1.8 5 0" stroke="#22303F" strokeWidth={1.2} fill="none" strokeLinecap="round"/>
    </>
  ),
  // Otter
  'p-otter': () => (
    <>
      <Circle cx={18} cy={25} r={4} fill="#6B4A2B"/><Circle cx={46} cy={25} r={4} fill="#6B4A2B"/>
      <Path d="M32 16c-11 0-17 8-17 18 0 9 7 16 17 16s17-7 17-16c0-10-6-18-17-18z" fill="#8E6440"/>
      <Path d="M32 33c-8 0-12 4-12 9 3 5 7 7 12 7s9-2 12-7c0-5-4-9-12-9z" fill="#E8D2B6"/>
      <Ellipse cx={25.5} cy={29} rx={2.2} ry={2.7} fill="#13261C"/><Circle cx={26.3} cy={28.1} r={0.8} fill="#fff"/><Ellipse cx={38.5} cy={29} rx={2.2} ry={2.7} fill="#13261C"/><Circle cx={39.3} cy={28.1} r={0.8} fill="#fff"/><Ellipse cx={32} cy={36} rx={3} ry={2.1} fill="#13261C"/>
      <Path d="M32 38v1.6M29.5 40.5q2.5 1.8 5 0" stroke="#13261C" strokeWidth={1.1} fill="none" strokeLinecap="round"/>
      <Path d="M22 38h-8M22 41l-7 2M42 38h8M42 41l7 2" stroke="#F5EDE2" strokeWidth={0.9} strokeLinecap="round"/>
    </>
  ),
  // Hai
  'p-shark': () => (
    <>
      <Path d="M30 12 C33 18 36 22 40 25 L26 25 C28 21 29 17 30 12Z" fill="#6E8597"/>
      <Path d="M8 40c6-10 16-16 28-16 9 0 16 4 20 10-4 7-12 11-22 11-6 0-10-1-14-3l-6 6c0-3 0-6 1-8-3 0-5 0-7 0z" fill="#8A9FB0"/>
      <Path d="M22 41c6 3 14 4 22 2 5-1 9-4 12-9-6 5-16 8-34 7z" fill="#EEF2F6"/>
      <Path d="M38 37l1.5 2 1.5-2 1.5 2 1.5-2 1.5 2 1.5-2" stroke="#8A9FB0" strokeWidth={0.9} fill="#fff" strokeLinejoin="round"/>
      <Ellipse cx={44} cy={31} rx={1.9} ry={2.3} fill="#13261C"/><Circle cx={44.6} cy={30.3} r={0.7} fill="#fff"/>
      <Path d="M30 30v6M33 29.5v6" stroke="#6E8597" strokeWidth={1.1} strokeLinecap="round"/>
    </>
  ),
};

// Hintergrund je Tier: hebt sich klar vom Tier ab
export const PLUS_ANIMAL_BG: Record<string, [string, string]> = {
  'p-fox': ['#3E8A5C', '#123826'],
  'p-owl': ['#8EDBD0', '#1B6A66'],
  'p-wolf': ['#FFD08A', '#C2741B'],
  'p-deer': ['#A8DDA0', '#2F6B47'],
  'p-bear': ['#A9D8F2', '#2D6E9E'],
  'p-eagle': ['#9FD3F2', '#1C5E8C'],
  'p-turtle': ['#8FC9F0', '#1F4F8A'],
  'p-butterfly': ['#C9EFC0', '#3E8A5C'],
  'p-bee': ['#CDB8F0', '#5B3A86'],
  'p-ladybug': ['#B6E39A', '#3E7A2A'],
  'p-hedgehog': ['#BFE8D2', '#2F7A5A'],
  'p-squirrel': ['#AEDCF5', '#2A6FB8'],
  'p-frog': ['#FFC9B6', '#C8573E'],
  'p-lizard': ['#FFD59A', '#C26A1B'],
  'p-dolphin': ['#FFE0A8', '#E07A3A'],
  'p-octopus': ['#8EDBD6', '#145E66'],
  'p-parrot': ['#FFF0A0', '#D4A015'],
  'p-flamingo': ['#9FE6DA', '#1F7A70'],
  'p-penguin': ['#DDF0FF', '#5A8FC0'],
  'p-lion': ['#C9E8A0', '#4E7A1F'],
  'p-tiger': ['#9BD49B', '#1F5639'],
  'p-panda': ['#C9F08F', '#3E8A2A'],
  'p-otter': ['#A9D8F2', '#1F5E8C'],
  'p-shark': ['#FFD9A0', '#E08A2A'],
};
