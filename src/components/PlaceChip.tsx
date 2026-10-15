import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, fonts } from '../theme';

// Ort mit Stecknadel und Stift (antippen zum Ändern) – gleich im Profil und auf der Saison-Seite
export function PlaceChip({
  label,
  onPress,
  accessibilityLabel,
  style,
}: {
  label: string;
  onPress: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.place, { opacity: pressed ? 0.7 : 1 }, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Svg width={14} height={14} viewBox="0 0 24 24">
        <Path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" fill={colors.accent} />
        <Circle cx={12} cy={10} r={2.6} fill="#123826" />
      </Svg>
      <Text style={styles.placeText} numberOfLines={1}>
        {label}
      </Text>
      <Svg width={13} height={13} viewBox="0 0 24 24">
        <Path d="M4 20h4L19 9l-4-4L4 16v4Z" fill="none" stroke={colors.accentLight} strokeWidth={2} strokeLinejoin="round" />
        <Path d="M13.5 6.5l4 4" stroke={colors.accentLight} strokeWidth={2} />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.10)',
    flexShrink: 1,
  },
  placeText: { flexShrink: 1, fontFamily: fonts.sansBold, fontSize: 13, color: colors.white },
});
