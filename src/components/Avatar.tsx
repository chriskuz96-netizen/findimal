import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';

import { PLUS_AVATARS } from '../plus';
import { BadgeId } from '../progress';
import { PLUS_ANIMAL_ART, PLUS_ANIMAL_BG } from './PlusAnimal';
import { colors, fonts } from '../theme';
import { BADGE_TIER, Medal } from './Medal';

// Profilbild: Plus-Tier (mit goldenem Rahmen), Abzeichen oder Anfangsbuchstabe.
export function Avatar({ id, name, size }: { id: string | null; name: string; size: number }) {
  const plus = id ? PLUS_AVATARS.find((a) => a.id === id) : undefined;
  if (plus) return <PlusAvatar size={size} id={plus.id} />;
  if (id && Object.prototype.hasOwnProperty.call(BADGE_TIER, id)) return <Medal id={id as BadgeId} size={size} />;
  const d = Math.round(size * 0.9);
  return (
    <View style={[styles.letter, { width: d, height: d, borderRadius: d / 2, margin: (size - d) / 2 }]}>
      <Text style={[styles.letterText, { fontSize: d * 0.42 }]}>{name[0]?.toUpperCase() ?? '?'}</Text>
    </View>
  );
}

// Tier auf farbigem Grund mit goldenem Ring und kleinem Stern (alles selbst gezeichnet, keine Emojis)
export function PlusAvatar({ id, size }: { id: string; size: number }) {
  const g = `pa-${id}`;
  const [from, to] = PLUS_ANIMAL_BG[id] ?? ['#3E8A5C', '#123826'];
  const Art = PLUS_ANIMAL_ART[id];
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Defs>
          <RadialGradient id={`${g}-bg`} cx="0.35" cy="0.3" r="0.8">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </RadialGradient>
          <RadialGradient id={`${g}-ring`} cx="0.3" cy="0.25" r="0.9">
            <Stop offset="0" stopColor="#FFF2B8" />
            <Stop offset="0.5" stopColor="#E8B53A" />
            <Stop offset="1" stopColor="#9A6B12" />
          </RadialGradient>
          <ClipPath id={`${g}-clip`}>
            <Circle cx={32} cy={32} r={26} />
          </ClipPath>
        </Defs>
        <Circle cx={32} cy={32} r={30} fill={`url(#${g}-ring)`} />
        <Circle cx={32} cy={32} r={26} fill={`url(#${g}-bg)`} />
        {Art && <G clipPath={`url(#${g}-clip)`}>{Art()}</G>}
        {/* kleiner Plus-Stern unten rechts */}
        <Circle cx={53} cy={53} r={6.5} fill="#C98A10" stroke="#FFF2B8" strokeWidth={1.5} />
        <Path d="m53 49.6 1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z" fill="#fff" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  letter: {
    borderWidth: 2,
    borderColor: colors.accentLight,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: { fontFamily: fonts.serifBold, color: colors.ink },
});
