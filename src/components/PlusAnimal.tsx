import { ReactElement } from 'react';
import { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

// Selbst gezeichnete Plus-Tiere (statt Emojis): viewBox 0 0 64 64, Mitte 32/32, sichtbarer Kreis r = 26.
// Nicht von Hand ändern: Vorlage in tools/plus_animals.py, neu erzeugen mit tools/make_plus_animals.py.
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
  // Schnecke
  'p-snail': () => (
    <>
      <G transform="translate(4 1) scale(0.94)"><Path d="M8 52 C8 46 12 42 17 42 L24 42 C30 42 34 46 44 47 C51 48 56 50 57 54 L10 54 C8.5 54 8 53 8 52Z" fill="#D9C27A"/>
      <Circle cx={15} cy={41} r={7} fill="#D9C27A"/>
      <Path d="M12 36 L9 27 M17.5 35.5 L20 26" stroke="#D9C27A" strokeWidth={2.6} strokeLinecap="round"/>
      <Circle cx={9} cy={26} r={3} fill="#FFFFFF"/><Circle cx={20} cy={25.5} r={3} fill="#FFFFFF"/>
      <Circle cx={9.4} cy={26.4} r={1.6} fill="#13261C"/><Circle cx={20.4} cy={25.9} r={1.6} fill="#13261C"/>
      <Path d="M11.5 44.5 q3 2.2 6 0" stroke="#7A6230" strokeWidth={1.2} fill="none" strokeLinecap="round"/>
      <Circle cx={11} cy={42} r={1.4} fill="#F2A3A3" opacity={0.8}/>
      <Circle cx={37} cy={33} r={14} fill="#E8833A"/>
      <Path d="M37 33 m0 -1.5 a1.5 1.5 0 1 1 -1.5 1.5 a4.5 4.5 0 0 1 4.5 -4.5 a7.5 7.5 0 0 1 7.5 7.5 a10.5 10.5 0 0 1 -10.5 10.5 a13 13 0 0 1 -12.5 -10" stroke="#9A4A16" strokeWidth={1.8} fill="none" strokeLinecap="round"/>
      <Path d="M28 24 C31 21 35 20 38 20" stroke="#F6B47A" strokeWidth={1.6} fill="none" strokeLinecap="round"/></G>
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
      <G transform="translate(3.2 5) scale(0.9)">
      <Path d="M11 66 C11 52 20 44 32 44 C44 44 53 52 53 66Z" fill="#8E5A30"/>
      <Path d="M22 66 C22 56 26 50 32 50 C38 50 42 56 42 66Z" fill="#E2B88E"/>
      <Circle cx={18} cy={15} r={6.5} fill="#8E5A30"/><Circle cx={46} cy={15} r={6.5} fill="#8E5A30"/>
      <Circle cx={18} cy={15} r={3.4} fill="#D69A6A"/><Circle cx={46} cy={15} r={3.4} fill="#D69A6A"/>
      <Path d="M32 11 C20 11 15 19 15 27.5 C15 37 22 42.5 32 42.5 C42 42.5 49 37 49 27.5 C49 19 44 11 32 11Z" fill="#8E5A30"/>
      <Path d="M22 16 C25 13 29 12.5 32 12.5" stroke="#A97448" strokeWidth={2} fill="none" strokeLinecap="round"/>
      <Ellipse cx={32} cy={34} rx={9} ry={7} fill="#E2B88E"/>
      <Ellipse cx={25} cy={25.5} rx={2.3} ry={2.8} fill="#13261C"/><Circle cx={25.8} cy={24.5} r={0.85} fill="#fff"/>
      <Ellipse cx={39} cy={25.5} rx={2.3} ry={2.8} fill="#13261C"/><Circle cx={39.8} cy={24.5} r={0.85} fill="#fff"/>
      <Path d="M28.6 31 C28.6 29.4 35.4 29.4 35.4 31 C35.4 32.8 33.4 34 32 34 C30.6 34 28.6 32.8 28.6 31Z" fill="#6E4220"/>
      <Path d="M32 34 v1.6 M29.4 37 q2.6 1.8 5.2 0" stroke="#6E4220" strokeWidth={1.2} fill="none" strokeLinecap="round"/>
      <Circle cx={20.5} cy={33} r={2.2} fill="#F2A3A3" opacity={0.7}/><Circle cx={43.5} cy={33} r={2.2} fill="#F2A3A3" opacity={0.7}/>
      <Path d="M13 54 C14 48 18 45.5 22 46.5 C25 47.5 27 50.5 27 53.5 C27 56.5 24.5 58 22 57.5 C19 57 18 55 17.5 52.5Z" fill="#7A4A26"/><Path d="M51 54 C50 48 46 45.5 42 46.5 C39 47.5 37 50.5 37 53.5 C37 56.5 39.5 58 42 57.5 C45 57 46 55 46.5 52.5Z" fill="#7A4A26"/><Ellipse cx={23.5} cy={54} rx={3.4} ry={2.8} fill="#6E4220"/><Ellipse cx={40.5} cy={54} rx={3.4} ry={2.8} fill="#6E4220"/>
      </G>
    </>
  ),
  // Adler
  'p-eagle': () => (
    <>
      <Path d="M4 64 L10 46 C18 41 30 41 38 44 L46 64Z" fill="#6B3E1F"/>
      <Path d="M12 46 C18 44 24 44 30 46" stroke="#4E2C14" strokeWidth={1.4} fill="none"/>
      <Path d="M14 46 C12 32 18 18 32 16 C40 15 46 18 49 23 L48 33 C44 39 38 42 30 44 C24 45 18 46 14 46Z" fill="#FFFFFF"/>
      <Path d="M44 21 C52 19 58 25 57 32 C56 36 53 37 51 35 C52 32 51 29 47 28 L44 28Z" fill="#F2B02E"/>
      <Path d="M47 28 C49 31 49 33 48 35 C46 34 45 32 45 30Z" fill="#D18A12"/>
      <Path d="M34 23 C37 21.5 41 21.5 43 23" stroke="#C9CED3" strokeWidth={1.6} fill="none" strokeLinecap="round"/>
      <Ellipse cx={39} cy={26} rx={2} ry={2.4} fill="#13261C"/><Circle cx={39.8} cy={25.1} r={0.8} fill="#fff"/>
    </>
  ),
  // Schildkröte
  'p-turtle': () => (
    <>
      <Ellipse cx={14} cy={50} rx={6} ry={3.4} transform="rotate(-25 14 50)" fill="#7CBF5A"/><Ellipse cx={50} cy={50} rx={6} ry={3.4} transform="rotate(25 50 50)" fill="#7CBF5A"/>
      <Path d="M12 46 C12 34 21 28 32 28 C43 28 52 34 52 46 C52 52 43 56 32 56 C21 56 12 52 12 46Z" fill="#4E7F2A"/>
      <Path d="M32 31 L38 35 L37 42 L32 45 L27 42 L26 35Z" fill="#6FA23C" stroke="#C9A54A" strokeWidth={1.2} strokeLinejoin="round"/>
      <Path d="M26 35 L18 37 L16 44 L22 48 L27 42Z M38 35 L46 37 L48 44 L42 48 L37 42Z M27 42 L22 48 L27 53 L32 51 L32 45Z M37 42 L42 48 L37 53 L32 51 L32 45Z" fill="#5E922F" stroke="#C9A54A" strokeWidth={1.1} strokeLinejoin="round"/>
      <Path d="M12.5 47 C14 53 22 56.5 32 56.5 C42 56.5 50 53 51.5 47" stroke="#C9A54A" strokeWidth={1.6} fill="none"/>
      <Path d="M20 32 C23 30 27 29 30 29" stroke="#8CC56A" strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.8}/>
      <Circle cx={32} cy={22} r={10.5} fill="#8CC56A"/>
      <Ellipse cx={28} cy={21} rx={2.1} ry={2.6} fill="#13261C"/><Circle cx={28.8} cy={20} r={0.8} fill="#fff"/>
      <Ellipse cx={36} cy={21} rx={2.1} ry={2.6} fill="#13261C"/><Circle cx={36.8} cy={20} r={0.8} fill="#fff"/>
      <Path d="M28.5 26 q3.5 2.6 7 0" stroke="#13261C" strokeWidth={1.3} fill="none" strokeLinecap="round"/>
      <Circle cx={25} cy={24.5} r={1.7} fill="#F2A3A3" opacity={0.75}/><Circle cx={39} cy={24.5} r={1.7} fill="#F2A3A3" opacity={0.75}/>
      <Path d="M26 15 C28 13 31 12.5 33 12.6" stroke="#B5E09A" strokeWidth={1.4} fill="none" strokeLinecap="round"/>
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
      <Path d="M20.5 42.6 L13.1 44.2 L18.0 38.5 L10.5 37.6 L17.0 33.7 L10.1 30.5 L17.6 28.9 L12.1 23.7 L19.6 24.6 L16.1 17.8 L22.9 21.0 L21.7 13.5 L27.2 18.8 L28.5 11.3 L32.0 18.0 L35.5 11.3 L36.8 18.8 L42.3 13.5 L41.1 21.0 L47.9 17.8 L44.4 24.6 L51.9 23.7 L46.4 28.9 L53.9 30.5 L47.0 33.7 L53.5 37.6 L46.0 38.5 L50.9 44.2 L43.5 42.6Z" fill="#5A3D22"/>
      <Path d="M21.8 39.4 L15.8 39.7 L20.3 35.7 L14.5 34.2 L20.1 31.8 L15.1 28.5 L21.1 28.1 L17.4 23.3 L23.2 24.8 L21.3 19.1 L26.3 22.4 L26.4 16.4 L30.0 21.2 L32.0 15.5 L34.0 21.2 L37.6 16.4 L37.7 22.4 L42.7 19.1 L40.8 24.8 L46.6 23.3 L42.9 28.1 L48.9 28.5 L43.9 31.8 L49.5 34.2 L43.7 35.7 L48.2 39.7 L42.2 39.4Z" fill="#7A5434"/>
      <Circle cx={32} cy={34} r={14} fill="#7A5434"/>
      <Path d="M32 22 C24 22 19 28 20 35 C21 41 27 45 32 48 C37 45 43 41 44 35 C45 28 40 22 32 22Z" fill="#EBCDA6"/>
      <Ellipse cx={22.5} cy={25} rx={3} ry={2.6} fill="#EBCDA6"/><Ellipse cx={41.5} cy={25} rx={3} ry={2.6} fill="#EBCDA6"/>
      <Ellipse cx={22.5} cy={25} rx={1.5} ry={1.3} fill="#C99A70"/><Ellipse cx={41.5} cy={25} rx={1.5} ry={1.3} fill="#C99A70"/>
      <Ellipse cx={27} cy={33} rx={2.2} ry={2.7} fill="#13261C"/><Circle cx={27.8} cy={32.1} r={0.8} fill="#fff"/><Ellipse cx={37} cy={33} rx={2.2} ry={2.7} fill="#13261C"/><Circle cx={37.8} cy={32.1} r={0.8} fill="#fff"/>
      <Ellipse cx={32} cy={45.5} rx={2.8} ry={2.3} fill="#13261C"/><Circle cx={31} cy={44.7} r={0.7} fill="#fff"/>
      <Circle cx={24.5} cy={38.5} r={2} fill="#F2A3A3" opacity={0.75}/><Circle cx={39.5} cy={38.5} r={2} fill="#F2A3A3" opacity={0.75}/>
    </>
  ),
  // Eichhörnchen
  'p-squirrel': () => (
    <>
      <Path d="M38 58 C54 56 61 42 55 28 C51 18 41 15 36 22 C33 27 38 31 43 30 C48 30 50 37 48 43 C46 49 41 52 36 53Z" fill="#B84A16"/>
      <Path d="M41 20 C49 20 55 27 55 35 M50 46 C47 51 43 53 39 54" stroke="#E07A34" strokeWidth={2.2} fill="none" strokeLinecap="round"/>
      <Ellipse cx={31} cy={45} rx={10} ry={12} fill="#E06A28"/>
      <Ellipse cx={27.5} cy={47} rx={5.5} ry={8} fill="#FBE3CC"/>
      <Path d="M27 22 L30 14 L34 21Z" fill="#E06A28"/><Path d="M30 14 C29.7 12.2 30.4 11 31.6 10.6" stroke="#7A3E17" strokeWidth={1.6} fill="none" strokeLinecap="round"/>
      <Circle cx={26} cy={29} r={9.5} fill="#E06A28"/>
      <Ellipse cx={18.5} cy={32} rx={5} ry={4} fill="#E06A28"/>
      <Ellipse cx={20.5} cy={33.5} rx={4.5} ry={3} fill="#FBE3CC"/>
      <Circle cx={14.3} cy={31.2} r={1.5} fill="#13261C"/>
      <Ellipse cx={23} cy={27} rx={2} ry={2.5} fill="#13261C"/><Circle cx={23.8} cy={26.1} r={0.8} fill="#fff"/>
      <Ellipse cx={24} cy={42} rx={3.4} ry={4.2} fill="#B07A3A"/>
      <Path d="M20.6 40 C21 37 27 37 27.4 40Z" fill="#5A3D22"/><Path d="M24 37.4v-1.8" stroke="#5A3D22" strokeWidth={1.2} strokeLinecap="round"/>
      <Ellipse cx={20.5} cy={43} rx={2} ry={1.6} fill="#E06A28"/><Ellipse cx={27.5} cy={43} rx={2} ry={1.6} fill="#E06A28"/>
      <Ellipse cx={27} cy={56.5} rx={5} ry={2.4} fill="#C2541B"/>
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
      <G transform="translate(-2 -7) scale(1.05)"><Path d="M19 40 C10 39 6 45 9 51 C11 55 17 55 18 51 C16 52.5 12.5 51 13 48 C13.5 45 16 43.5 21 44Z" fill="#4FA34A"/>
      <Ellipse cx={32} cy={41} rx={14} ry={6} fill="#4FA34A"/>
      <Path d="M24 45 L20 51 L23 51 M38 45 L41 51 L44 51 M26 37 L22 32 L25 31 M38 37 L41 32 L44 32" stroke="#3E8A38" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <Ellipse cx={50} cy={36} rx={9.5} ry={6.5} fill="#4FA34A"/>
      <Circle cx={27} cy={39} r={1.3} fill="#9BD86A"/><Circle cx={32} cy={38} r={1.3} fill="#9BD86A"/><Circle cx={37} cy={39.5} r={1.3} fill="#9BD86A"/><Circle cx={30} cy={42.5} r={1.1} fill="#9BD86A"/>
      <Circle cx={52} cy={33.5} r={3} fill="#F6C83A"/><Circle cx={52.6} cy={33.8} r={1.6} fill="#13261C"/><Circle cx={53.2} cy={33} r={0.6} fill="#fff"/>
      <Path d="M50 39 Q55 41 59 38" stroke="#2E6E22" strokeWidth={1.2} fill="none" strokeLinecap="round"/></G>
    </>
  ),
  // Krabbe
  'p-crab': () => (
    <>
      <G transform="translate(32 34) scale(0.88) translate(-32 -34)"><Path d="M18 44 L9 48 M18 47 L10 53 M20 50 L13 57 M46 44 L55 48 M46 47 L54 53 M44 50 L51 57" stroke="#C9372A" strokeWidth={2.4} strokeLinecap="round"/>
      <Path d="M20 38 L13 30 M44 38 L51 30" stroke="#C9372A" strokeWidth={3} strokeLinecap="round"/>
      <Path d="M13 31 C7 30 5 24 8 19 C10 16 14 15 16 17 L12 22 L17 23 C17 28 16 31 13 31Z" fill="#E8453A"/>
      <Path d="M51 31 C57 30 59 24 56 19 C54 16 50 15 48 17 L52 22 L47 23 C47 28 48 31 51 31Z" fill="#E8453A"/>
      <Ellipse cx={32} cy={42} rx={16} ry={11} fill="#E8453A"/>
      <Path d="M20 38 C25 35 39 35 44 38" stroke="#F27A6A" strokeWidth={1.6} fill="none" strokeLinecap="round"/>
      <Path d="M27 33 L26 25 M37 33 L38 25" stroke="#C9372A" strokeWidth={2} strokeLinecap="round"/>
      <Circle cx={26} cy={24} r={3.4} fill="#FFFFFF"/><Circle cx={38} cy={24} r={3.4} fill="#FFFFFF"/>
      <Circle cx={26.5} cy={24.5} r={1.8} fill="#13261C"/><Circle cx={38.5} cy={24.5} r={1.8} fill="#13261C"/>
      <Circle cx={27.2} cy={23.7} r={0.6} fill="#fff"/><Circle cx={39.2} cy={23.7} r={0.6} fill="#fff"/>
      <Path d="M28 45 q4 3 8 0" stroke="#7A1F18" strokeWidth={1.4} fill="none" strokeLinecap="round"/>
      <Circle cx={23} cy={43} r={2} fill="#F7A8A0" opacity={0.8}/><Circle cx={41} cy={43} r={2} fill="#F7A8A0" opacity={0.8}/></G>
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
      <Path d="M10 64 C10 50 18 42 28 42 C38 42 44 50 44 64Z" fill="#E03A2A"/>
      <Path d="M18 64 C20 54 26 48 34 49 C38 54 37 60 35 64Z" fill="#2F6FC2"/>
      <Path d="M20 58 C23 53 28 50 33 51" stroke="#F6C83A" strokeWidth={3} fill="none" strokeLinecap="round"/>
      <Circle cx={28} cy={29} r={14} fill="#E03A2A"/>
      <Ellipse cx={36} cy={28} rx={7} ry={6} fill="#FFFFFF"/>
      <Path d="M33 25.5 l6 0 M33.5 29.5 l5.5 0" stroke="#E7E2DA" strokeWidth={0.8}/>
      <Ellipse cx={36} cy={27.5} rx={2} ry={2.4} fill="#13261C"/><Circle cx={36.8} cy={26.6} r={0.8} fill="#fff"/>
      <Path d="M41 22 C49 20 56 27 54 38 C52 35 49 33 45 33 C43 30 42 26 41 22Z" fill="#F4EDE0"/>
      <Path d="M45 33 C48 34 50 36 49 39 C46 40 43 38 42 35Z" fill="#2E2A26"/>
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
      <Ellipse cx={13} cy={40} rx={4} ry={10} transform="rotate(20 13 40)" fill="#22303F"/>
      <Ellipse cx={51} cy={40} rx={4} ry={10} transform="rotate(-20 51 40)" fill="#22303F"/>
      <Path d="M32 11 C21 11 15 21 15 35 C15 48 22 56 32 56 C42 56 49 48 49 35 C49 21 43 11 32 11Z" fill="#22303F"/>
      <Path d="M32 30 C24 30 20 36 20 43 C20 51 25 55 32 55 C39 55 44 51 44 43 C44 36 40 30 32 30Z" fill="#FFFFFF"/>
      <Circle cx={27} cy={26} r={6} fill="#FFFFFF"/><Circle cx={37} cy={26} r={6} fill="#FFFFFF"/>
      <Rect x={24} y={26} width={16} height={8} fill="#FFFFFF"/>
      <Ellipse cx={27.5} cy={25.5} rx={1.9} ry={2.3} fill="#13261C"/><Circle cx={28.3} cy={24.6} r={0.8} fill="#fff"/><Ellipse cx={36.5} cy={25.5} rx={1.9} ry={2.3} fill="#13261C"/><Circle cx={37.3} cy={24.6} r={0.8} fill="#fff"/>
      <Path d="M28.5 30h7l-3.5 4.5z" fill="#F2A12E"/>
      <Circle cx={23.5} cy={31} r={1.8} fill="#F2A3A3" opacity={0.7}/><Circle cx={40.5} cy={31} r={1.8} fill="#F2A3A3" opacity={0.7}/>
      <Ellipse cx={26} cy={57} rx={4} ry={2} fill="#F2A12E"/><Ellipse cx={38} cy={57} rx={4} ry={2} fill="#F2A12E"/>
    </>
  ),
  // Giraffe
  'p-giraffe': () => (
    <>
      <G transform="translate(32 6) scale(0.9) translate(-32 0)"><Path d="M26 66 L27 34 L37 34 L38 66Z" fill="#F2C04A"/>
      <Path d="M27 36 L27 66" stroke="#9A5A20" strokeWidth={2.6} strokeLinecap="round" stroke-dasharray="3 2.2"/>
      <Path d="M30 41 c2 -.6 3.6.8 3 2.6 c-.6 1.6 -3 1.8 -3.8.4 c-.6 -1.2 -.2 -2.6.8 -3z M34 50 c1.8 -.4 3 1 2.4 2.6 c-.6 1.4 -2.8 1.4 -3.4 0 c-.4 -1.2.1 -2.4 1 -2.6z M29.5 56 c1.8 -.4 3.2.8 2.8 2.4 c-.4 1.6 -2.8 1.8 -3.6.4 c-.6 -1.2 -.2 -2.4.8 -2.8z" fill="#B8742E"/>
      <Path d="M28 11 L27 5 M36 11 L37 5" stroke="#B8742E" strokeWidth={2.2} strokeLinecap="round"/>
      <Circle cx={27} cy={4.5} r={2.1} fill="#7A4A1E"/><Circle cx={37} cy={4.5} r={2.1} fill="#7A4A1E"/>
      <Ellipse cx={20} cy={15} rx={5} ry={2.3} transform="rotate(-18 20 15)" fill="#F2C04A"/><Ellipse cx={44} cy={15} rx={5} ry={2.3} transform="rotate(18 44 15)" fill="#F2C04A"/>
      <Ellipse cx={20.5} cy={15} rx={2.6} ry={1.1} transform="rotate(-18 20.5 15)" fill="#E3A24A"/><Ellipse cx={43.5} cy={15} rx={2.6} ry={1.1} transform="rotate(18 43.5 15)" fill="#E3A24A"/>
      <Path d="M32 9 C25 9 23 14 24 21 C25 27 27 33 32 35 C37 33 39 27 40 21 C41 14 39 9 32 9Z" fill="#F2C04A"/>
      <Ellipse cx={32} cy={29.5} rx={6.5} ry={5.2} fill="#F7DFA0"/>
      <Circle cx={28.5} cy={12.5} r={1.6} fill="#B8742E"/><Circle cx={36.5} cy={13.5} r={1.2} fill="#B8742E"/>
      <Ellipse cx={28.5} cy={20} rx={2.1} ry={2.6} fill="#13261C"/><Circle cx={29.3} cy={19.1} r={0.8} fill="#fff"/><Ellipse cx={35.5} cy={20} rx={2.1} ry={2.6} fill="#13261C"/><Circle cx={36.3} cy={19.1} r={0.8} fill="#fff"/>
      <Ellipse cx={30} cy={28.5} rx={0.9} ry={1.2} fill="#7A4A1E"/><Ellipse cx={34} cy={28.5} rx={0.9} ry={1.2} fill="#7A4A1E"/>
      <Path d="M29.5 31.5 q2.5 1.8 5 0" stroke="#7A4A1E" strokeWidth={1.1} fill="none" strokeLinecap="round"/>
      <Circle cx={25.6} cy={25} r={1.7} fill="#F2A3A3" opacity={0.75}/><Circle cx={38.4} cy={25} r={1.7} fill="#F2A3A3" opacity={0.75}/></G>
    </>
  ),
  // Tiger
  'p-tiger': () => (
    <>
      <G transform="translate(3.2 5) scale(0.9)">
      <Path d="M11 66 C11 52 20 44 32 44 C44 44 53 52 53 66Z" fill="#EE8A2C"/>
      <Path d="M22 66 C22 56 26 50 32 50 C38 50 42 56 42 66Z" fill="#FFF6EA"/>
      <Path d="M14 56 l6 -1.5 M13 61 l6 -1 M50 56 l-6 -1.5 M51 61 l-6 -1" stroke="#13261C" strokeWidth={1.8} strokeLinecap="round"/>
      <Circle cx={18} cy={15} r={6} fill="#EE8A2C"/><Circle cx={46} cy={15} r={6} fill="#EE8A2C"/>
      <Circle cx={18} cy={15} r={3} fill="#FBE3CC"/><Circle cx={46} cy={15} r={3} fill="#FBE3CC"/>
      <Path d="M32 11 C20 11 15 19 15 27.5 C15 37 22 42.5 32 42.5 C42 42.5 49 37 49 27.5 C49 19 44 11 32 11Z" fill="#EE8A2C"/>
      <Path d="M32 12.5 v5 M27.5 13.5 l1.5 4 M36.5 13.5 l-1.5 4 M15.6 25 h5 M15.6 30 h4 M48.4 25 h-5 M48.4 30 h-4" stroke="#13261C" strokeWidth={1.9} strokeLinecap="round"/>
      <Path d="M32 28 C24 28 20 32 21 36 C23 40 27 42 32 42 C37 42 41 40 43 36 C44 32 40 28 32 28Z" fill="#FFF6EA"/>
      <Ellipse cx={25} cy={24.5} rx={2.3} ry={2.8} fill="#13261C"/><Circle cx={25.8} cy={23.5} r={0.85} fill="#fff"/>
      <Ellipse cx={39} cy={24.5} rx={2.3} ry={2.8} fill="#13261C"/><Circle cx={39.8} cy={23.5} r={0.85} fill="#fff"/>
      <Path d="M28.8 30.5 C28.8 29 35.2 29 35.2 30.5 C35.2 32.2 33.3 33.3 32 33.3 C30.7 33.3 28.8 32.2 28.8 30.5Z" fill="#D86A6A"/>
      <Path d="M32 33.3 v1.6 M29.4 36.2 q2.6 1.8 5.2 0" stroke="#13261C" strokeWidth={1.2} fill="none" strokeLinecap="round"/>
      <Path d="M23 34 l-5 -1 M23 36 l-5 1 M41 34 l5 -1 M41 36 l5 1" stroke="#FFFFFF" strokeWidth={0.8} strokeLinecap="round" opacity={0.9}/>
      <Circle cx={21} cy={31} r={2} fill="#F5A3A3" opacity={0.6}/><Circle cx={43} cy={31} r={2} fill="#F5A3A3" opacity={0.6}/>
      <Ellipse cx={23} cy={51} rx={4.6} ry={3.8} fill="#EE8A2C"/><Ellipse cx={41} cy={51} rx={4.6} ry={3.8} fill="#EE8A2C"/>
      <Path d="M21.5 49.5 v3 M24.5 49.5 v3 M39.5 49.5 v3 M42.5 49.5 v3" stroke="#C26A1B" strokeWidth={0.9} strokeLinecap="round"/>
      </G>
    </>
  ),
  // Panda
  'p-panda': () => (
    <>
      <G transform="translate(3.2 5) scale(0.9)"><Path d="M12 66 C12 52 20 44 32 44 C44 44 52 52 52 66Z" fill="#FFFFFF"/>
      <Path d="M12 66 C13 57 17 51 23 48 L27 52 C22 55 19 60 19 66Z M52 66 C51 57 47 51 41 48 L37 52 C42 55 45 60 45 66Z" fill="#232B33"/>
      <Circle cx={18} cy={15} r={6} fill="#232B33"/><Circle cx={46} cy={15} r={6} fill="#232B33"/>
      <Circle cx={18} cy={15} r={3} fill="#4A545E"/><Circle cx={46} cy={15} r={3} fill="#4A545E"/>
      <Path d="M32 12 C20 12 15 20 15 28 C15 37 22 42 32 42 C42 42 49 37 49 28 C49 20 44 12 32 12Z" fill="#FFFFFF"/>
      <Path d="M25.5 21 C29 21 30 25 29 29 C28 33 24 34 22 32 C19.5 30 20 23 25.5 21Z" fill="#232B33"/>
      <Path d="M38.5 21 C35 21 34 25 35 29 C36 33 40 34 42 32 C44.5 30 44 23 38.5 21Z" fill="#232B33"/>
      <Circle cx={25.6} cy={27} r={2.6} fill="#FFFFFF"/><Circle cx={38.4} cy={27} r={2.6} fill="#FFFFFF"/>
      <Circle cx={26} cy={27.4} r={1.6} fill="#13261C"/><Circle cx={38.8} cy={27.4} r={1.6} fill="#13261C"/>
      <Circle cx={26.6} cy={26.7} r={0.6} fill="#fff"/><Circle cx={39.4} cy={26.7} r={0.6} fill="#fff"/>
      <Path d="M29.5 33 C29.5 31.6 34.5 31.6 34.5 33 C34.5 34.4 33 35.4 32 35.4 C31 35.4 29.5 34.4 29.5 33Z" fill="#232B33"/>
      <Path d="M32 35.4 v1.4 M29.6 38 q2.4 1.6 4.8 0" stroke="#232B33" strokeWidth={1.1} fill="none" strokeLinecap="round"/>
      <Circle cx={21} cy={35} r={2} fill="#F5B5B5" opacity={0.8}/><Circle cx={43} cy={35} r={2} fill="#F5B5B5" opacity={0.8}/>
      <Path d="M47 24 L39 64" stroke="#5DAA3A" strokeWidth={3.4} strokeLinecap="round"/>
      <Path d="M46.2 32 l-3.4 0 M44.2 42 l-3.4 0 M42.2 52 l-3.4 0" stroke="#3E8A2A" strokeWidth={1.2} strokeLinecap="round"/>
      <Path d="M47 25 C51 20 56 19 60 20 C57 24 52 26 47 25Z" fill="#7CC456"/><Path d="M47.5 27 C52 28 55 31 56 35 C52 34 49 31 47.5 27Z" fill="#5DAA3A"/>
      <Ellipse cx={25} cy={51} rx={5} ry={4} fill="#232B33"/><Ellipse cx={38.5} cy={50} rx={5} ry={4} fill="#232B33"/></G>
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
  'p-snail': ['#A8E6F0', '#1F7A8C'],
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
  'p-crab': ['#9FD8F5', '#1F5E8C'],
  'p-octopus': ['#8EDBD6', '#145E66'],
  'p-parrot': ['#FFF0A0', '#D4A015'],
  'p-flamingo': ['#9FE6DA', '#1F7A70'],
  'p-penguin': ['#DDF0FF', '#5A8FC0'],
  'p-giraffe': ['#C9B8F0', '#5B3A86'],
  'p-tiger': ['#9BD49B', '#1F5639'],
  'p-panda': ['#FFDDB5', '#D8834A'],
  'p-otter': ['#A9D8F2', '#1F5E8C'],
  'p-shark': ['#FFD9A0', '#E08A2A'],
};
