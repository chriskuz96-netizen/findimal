import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

// Tiergruppen wie in der Vorlage (Farben für Karten, ungefähre Artenzahl in Deutschland).
export type GroupId = 'mam' | 'bird' | 'ins' | 'amp' | 'mol' | 'ara' | 'fish' | 'rep';

// Name der Gruppe: Text 'g.<id>'
export type Group = { id: GroupId; c1: string; c2: string; total: number };

export const GROUPS: Group[] = [
  { id: 'mam', c1: '#5A3E2B', c2: '#8E5E3C', total: 100 },
  { id: 'bird', c1: '#1F4E6B', c2: '#3A7CA5', total: 260 },
  { id: 'ins', c1: '#6B4A1F', c2: '#B7832F', total: 30000 },
  { id: 'amp', c1: '#1F5A3A', c2: '#3E8F5E', total: 20 },
  { id: 'mol', c1: '#6B5A2B', c2: '#A68A3E', total: 350 },
  { id: 'ara', c1: '#3A2F4A', c2: '#5E4E78', total: 1000 },
  { id: 'fish', c1: '#1F4F5E', c2: '#3A8FA5', total: 90 },
  { id: 'rep', c1: '#4A5226', c2: '#7A8A3E', total: 14 },
];

// Gruppe aus der Antwort des Servers -> Gruppe der Sammlung (null = keine der sechs)
export function groupOf(gruppe: string): Group | null {
  const map: Record<string, GroupId> = {
    saeugetier: 'mam',
    vogel: 'bird',
    insekt: 'ins',
    amphibie: 'amp',
    weichtier: 'mol',
    spinnentier: 'ara',
    fisch: 'fish',
    reptil: 'rep',
  };
  const id = map[gruppe];
  return id ? GROUPS.find((g) => g.id === id)! : null;
}

// Strich-Symbole der Gruppen aus der Vorlage
export function GroupIcon({ id, size, color }: { id: GroupId | null; size: number; color: string }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 1.4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G {...s}>
        {id === 'mam' && (
          <>
            <Path d="M4 4l4.5 4.5h7L20 4v8.5L12 20l-8-7.5z" />
            <Circle cx={9} cy={12} r={0.8} fill={color} />
            <Circle cx={15} cy={12} r={0.8} fill={color} />
            <Path d="M11 16h2l-1 1.2z" />
          </>
        )}
        {id === 'bird' && (
          <>
            <Path d="M3 14c3 .5 5-1 6.5-3.5C11 8 13 6.5 15.5 6.5c1.6 0 2.7.8 3.2 2l2.3.7-2.3.8c-.2 4.8-3.9 8-8.7 8H7.5L3 14z" />
            <Path d="M9.5 13.5c1.5 1.2 3.5 1.2 5-.3" />
            <Circle cx={16} cy={9} r={0.8} fill={color} />
            <Path d="M10 18l-1 2.5M13 18l.5 2.5" />
          </>
        )}
        {id === 'ins' && (
          <>
            <Path d="M12 7v12" />
            <Path d="M12 10C10 5 4.5 4 4 7.5S7 12 12 11.5" />
            <Path d="M12 10c2-5 7.5-6 8-2.5S17 12 12 11.5" />
            <Path d="M12 12.5c-3 0-6 1.5-5.5 4S10.5 18 12 15" />
            <Path d="M12 12.5c3 0 6 1.5 5.5 4S13.5 18 12 15" />
            <Path d="M12 7l-1.5-3M12 7l1.5-3" />
          </>
        )}
        {id === 'amp' && (
          <>
            <Path d="M4.5 14.5c0-3.5 3.3-5.5 7.5-5.5s7.5 2 7.5 5.5-3.3 4.5-7.5 4.5-7.5-1-7.5-4.5z" />
            <Circle cx={8} cy={8.5} r={2.3} />
            <Circle cx={16} cy={8.5} r={2.3} />
            <Path d="M9 15c2 1 4 1 6 0" />
            <Path d="M4.5 16L2.5 19M19.5 16l2 3" />
          </>
        )}
        {id === 'mol' && (
          <>
            <Path d="M3 18.5h15.5c1.5 0 2.5-1 2.5-2.5V12" />
            <Path d="M12.5 17a5.5 5.5 0 1 1 5.5-5.5 3.5 3.5 0 1 1-3.5-3.5 1.8 1.8 0 1 1 1.8 1.8" />
            <Path d="M21 12l-1-4M21 12l1.5-3.5" />
          </>
        )}
        {id === 'ara' && (
          <>
            <Ellipse cx={12} cy={14} rx={3} ry={4} />
            <Circle cx={12} cy={8.5} r={2} />
            <Path d="M9.5 12L5 9 3 5M9.2 14L4 13l-2 2M9.5 16L5 18l-1 3M10 17.5L8 21M14.5 12L19 9l2-4M14.8 14l5.2-1 2 2M14.5 16l4.5 2 1 3M14 17.5l2 3.5" />
          </>
        )}
        {id === 'fish' && (
          <>
            <Path d="M7 12c2.5-4 6-5.5 9-5.5 2.5 0 4.5 2 5.5 5.5-1 3.5-3 5.5-5.5 5.5-3 0-6.5-1.5-9-5.5z" />
            <Path d="M7 12L2.5 8v8z" />
            <Path d="M13 9c-.8 2-.8 4 0 6" />
            <Circle cx={17.5} cy={11} r={0.8} fill={color} />
          </>
        )}
        {id === 'rep' && (
          <>
            <Ellipse cx={12} cy={5} rx={2} ry={2.5} />
            <Ellipse cx={12} cy={12} rx={2.3} ry={4.5} />
            <Path d="M12 16.5c0 2.5-1.5 4-4.5 4.5" />
            <Path d="M10 10L7 8.5 6 6.5M14 10l3-1.5 1-2M10 14l-3 1.5-1 2M14 14l3 1.5 1 2" />
          </>
        )}
        {id === null && (
          <>
            {/* Pfotenabdruck für alle anderen Tiere */}
            <Ellipse cx={12} cy={15.5} rx={4} ry={3.5} />
            <Circle cx={6.5} cy={10} r={1.6} />
            <Circle cx={10} cy={6.5} r={1.6} />
            <Circle cx={14} cy={6.5} r={1.6} />
            <Circle cx={17.5} cy={10} r={1.6} />
          </>
        )}
      </G>
    </Svg>
  );
}
