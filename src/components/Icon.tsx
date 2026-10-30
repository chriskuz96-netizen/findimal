import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { colors } from '../theme';

// Eigene Strich-Symbole im Stil der Menüleiste – statt Emojis (die sehen auf jedem Gerät anders aus).
export type IconName =
  | 'binoculars'
  | 'hand'
  | 'nest'
  | 'path'
  | 'gift'
  | 'dice'
  | 'paw'
  | 'lock'
  | 'medal'
  | 'trophy'
  | 'star'
  | 'globe'
  | 'palette'
  | 'toy'
  | 'phone'
  | 'book'
  | 'play'
  | 'flame';

export function Icon({ name, size = 22, color = colors.accent }: { name: IconName; size?: number; color?: string }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'flame' && (
        <Path
          d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"
          fill={color}
        />
      )}
      {name === 'binoculars' && (
        <>
          <Circle cx={6.5} cy={15.5} r={3.5} {...s} />
          <Circle cx={17.5} cy={15.5} r={3.5} {...s} />
          <Path d="M3.5 14 5.5 6.5A1.5 1.5 0 0 1 7 5.5h1A1.5 1.5 0 0 1 9.5 7v7M20.5 14l-2-7.5A1.5 1.5 0 0 0 17 5.5h-1A1.5 1.5 0 0 0 14.5 7v7M9.5 11h5" {...s} />
        </>
      )}
      {name === 'hand' && (
        <>
          <Path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4a1.5 1.5 0 0 1 3 0v6.5M14 10.5V5.5a1.5 1.5 0 0 1 3 0V13c0 4.4-2.7 7-6.2 7-2.6 0-4-1.3-5.3-3.4L3.8 13.8a1.5 1.5 0 0 1 2.5-1.6L8 14.5" {...s} />
        </>
      )}
      {name === 'nest' && (
        <>
          <Ellipse cx={9.6} cy={10.2} rx={2.3} ry={2.9} {...s} />
          <Ellipse cx={14.4} cy={10.2} rx={2.3} ry={2.9} {...s} />
          <Path d="M3 12.5h18c0 4-4 7-9 7s-9-3-9-7zM6.5 16.2c3.6 1 7.4 1 11 0" {...s} />
        </>
      )}
      {name === 'path' && (
        <>
          {/* zwei Fußspuren */}
          <Path d="M7 15c-1.5 0-2.4-1.7-2.2-3.8.2-2.4 1.4-4.6 3-4.6 1.5 0 2.3 2 2.1 4.2-.2 2.3-1.4 4.2-2.9 4.2z" {...s} />
          <Ellipse cx={7.4} cy={18.6} rx={1.6} ry={1.9} {...s} />
          <Path d="M16.6 10.5c1.5 0 2.4-1.7 2.2-3.8-.2-2.4-1.4-4.6-3-4.6-1.5 0-2.3 2-2.1 4.2.2 2.3 1.4 4.2 2.9 4.2z" {...s} />
          <Ellipse cx={16.2} cy={14.1} rx={1.6} ry={1.9} {...s} />
        </>
      )}
      {name === 'gift' && (
        <>
          <Rect x={3.5} y={9} width={17} height={4} rx={1} {...s} />
          <Path d="M5 13v7h14v-7M12 9v11M12 9c-1.5-3-5.5-4-5.5-1.5S10 9 12 9zM12 9c1.5-3 5.5-4 5.5-1.5S14 9 12 9z" {...s} />
        </>
      )}
      {name === 'dice' && (
        <>
          <Rect x={4} y={4} width={16} height={16} rx={3.5} {...s} />
          <Circle cx={8.5} cy={8.5} r={1.1} fill={color} />
          <Circle cx={15.5} cy={15.5} r={1.1} fill={color} />
          <Circle cx={12} cy={12} r={1.1} fill={color} />
          <Circle cx={15.5} cy={8.5} r={1.1} fill={color} />
          <Circle cx={8.5} cy={15.5} r={1.1} fill={color} />
        </>
      )}
      {name === 'paw' && (
        <>
          <Path d="M12 13c-2.8 0-5 2.6-5 4.6 0 1.4 1.1 2.1 2.4 2.1 1 0 1.6-.5 2.6-.5s1.6.5 2.6.5c1.3 0 2.4-.7 2.4-2.1 0-2-2.2-4.6-5-4.6z" {...s} />
          <Ellipse cx={6} cy={10.5} rx={1.7} ry={2.1} {...s} />
          <Ellipse cx={9.6} cy={6.5} rx={1.7} ry={2.2} {...s} />
          <Ellipse cx={14.4} cy={6.5} rx={1.7} ry={2.2} {...s} />
          <Ellipse cx={18} cy={10.5} rx={1.7} ry={2.1} {...s} />
        </>
      )}
      {name === 'lock' && (
        <>
          <Rect x={5} y={10.5} width={14} height={10} rx={2.5} {...s} />
          <Path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.5v2" {...s} />
        </>
      )}
      {name === 'medal' && (
        <>
          <Path d="M8 3h3l1.5 5M16 3h-3l-1 3.5" {...s} />
          <Circle cx={12} cy={14.5} r={6} {...s} />
          <Path d="m12 11.3 1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z" {...s} strokeWidth={1.3} />
        </>
      )}
      {name === 'trophy' && (
        <>
          <Path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0zM7.5 6H4.5c0 3 1.3 4.5 3.4 4.8M16.5 6h3c0 3-1.3 4.5-3.4 4.8M12 13.5V17M8.5 20.5h7M9.5 17h5v3.5h-5z" {...s} />
        </>
      )}
      {name === 'star' && (
        <Path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill={color} stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
      )}
      {name === 'globe' && (
        <>
          <Circle cx={12} cy={12} r={8.5} {...s} />
          <Path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.3 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.3-3.5-8.5s1.1-6.1 3.5-8.5z" {...s} />
        </>
      )}
      {name === 'palette' && (
        <>
          <Path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.3 0 2-.8 2-1.8 0-1.3-1.2-1.6-1.2-2.8 0-1 .8-1.6 1.8-1.6h2.2c2.2 0 3.7-1.6 3.7-3.8 0-4-3.8-7-8.5-7z" {...s} />
          <Circle cx={7.5} cy={11} r={1.1} fill={color} />
          <Circle cx={10} cy={7.3} r={1.1} fill={color} />
          <Circle cx={14.6} cy={7.3} r={1.1} fill={color} />
        </>
      )}
      {name === 'toy' && (
        <>
          <Circle cx={7} cy={6.5} r={2.3} {...s} />
          <Circle cx={17} cy={6.5} r={2.3} {...s} />
          <Circle cx={12} cy={11} r={5.5} {...s} />
          <Path d="M10.5 12.5c.8.7 2.2.7 3 0M8 19.5c1-1.7 2.4-2.6 4-2.6s3 .9 4 2.6" {...s} />
          <Circle cx={10} cy={10} r={0.8} fill={color} />
          <Circle cx={14} cy={10} r={0.8} fill={color} />
        </>
      )}
      {name === 'phone' && (
        <>
          <Rect x={6.5} y={2.5} width={11} height={19} rx={2.5} {...s} />
          <Path d="M10.5 18.5h3" {...s} />
        </>
      )}
      {name === 'play' && (
        <Path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.2-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z" fill={color} stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
      )}
      {name === 'book' && (
        <>
          <Path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5V20" {...s} />
        </>
      )}
    </Svg>
  );
}
