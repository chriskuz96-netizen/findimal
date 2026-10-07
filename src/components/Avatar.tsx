import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { PLUS_AVATARS } from '../plus';
import { BadgeId } from '../progress';
import { colors, fonts } from '../theme';
import { BADGE_TIER, Medal } from './Medal';

// Profilbild: Plus-Tier (mit goldenem Rahmen), Abzeichen oder Anfangsbuchstabe.
export function Avatar({ id, name, size }: { id: string | null; name: string; size: number }) {
  const plus = id ? PLUS_AVATARS.find((a) => a.id === id) : undefined;
  if (plus) return <PlusAvatar emoji={plus.emoji} from={plus.from} to={plus.to} size={size} id={plus.id} />;
  if (id && id in BADGE_TIER) return <Medal id={id as BadgeId} size={size} />;
  const d = Math.round(size * 0.9);
  return (
    <View style={[styles.letter, { width: d, height: d, borderRadius: d / 2, margin: (size - d) / 2 }]}>
      <Text style={[styles.letterText, { fontSize: d * 0.42 }]}>{name[0]?.toUpperCase() ?? '?'}</Text>
    </View>
  );
}

// Tier auf farbigem Grund mit goldenem Ring und kleinem Stern
export function PlusAvatar({ id, emoji, from, to, size }: { id: string; emoji: string; from: string; to: string; size: number }) {
  const g = `pa-${id}`;
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
        </Defs>
        <Circle cx={32} cy={32} r={30} fill={`url(#${g}-ring)`} />
        <Circle cx={32} cy={32} r={26} fill={`url(#${g}-bg)`} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={{ fontSize: size * 0.46, lineHeight: size * 0.6 }}>{emoji}</Text>
      </View>
      {/* kleiner Plus-Stern unten rechts */}
      <View
        style={[
          styles.star,
          { width: size * 0.34, height: size * 0.34, borderRadius: size * 0.17, right: -size * 0.02, bottom: -size * 0.02 },
        ]}
      >
        <Text style={{ fontSize: size * 0.2, lineHeight: size * 0.26, color: colors.white }}>★</Text>
      </View>
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
  center: { alignItems: 'center', justifyContent: 'center' },
  star: {
    position: 'absolute',
    backgroundColor: '#C98A10',
    borderWidth: 1.5,
    borderColor: '#FFF2B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
