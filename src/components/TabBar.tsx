import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { useI18n } from '../i18n';
import { darkPalette, fonts, lightPalette } from '../theme';

export type Tab = 'start' | 'collection' | 'challenges' | 'season';

const TABS: Tab[] = ['start', 'collection', 'challenges', 'season'];

function TabIcon({ id, color }: { id: Tab; color: string }) {
  const s = { fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24">
      {id === 'start' && (
        <>
          <Path {...s} d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
          <Circle {...s} cx={12} cy={13.2} r={3.4} />
        </>
      )}
      {id === 'collection' && (
        <>
          <Path {...s} d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
          <Path {...s} d="M5 17a3 3 0 0 1 3-3h11" />
        </>
      )}
      {id === 'challenges' && (
        <>
          <Circle {...s} cx={12} cy={12} r={9} />
          <Path {...s} d="M15.5 8.5l-2 5-5 2 2-5z" />
        </>
      )}
      {id === 'season' && (
        <>
          <Path {...s} d="M12 21c-4-3-7-6.5-7-10.5C5 6.5 8 4 12 3c4 1 7 3.5 7 7.5 0 4-3 7.5-7 10.5z" />
          <Path {...s} d="M12 21V9M12 14l-3-2.5M12 11l3-2.5" />
        </>
      )}
    </Svg>
  );
}

// Menüleiste unten
export function TabBar({ active, onSelect }: { active: Tab; onSelect: (t: Tab) => void }) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  return (
    <View style={[styles.bar, { backgroundColor: p.card, borderTopColor: p.line, paddingBottom: insets.bottom }]}>
      {TABS.map((id) => {
        const on = id === active;
        const color = on ? p.moss : p.mute;
        return (
          <Pressable
            key={id}
            onPress={() => onSelect(id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={styles.btn}
          >
            <TabIcon id={id} color={color} />
            <Text style={[styles.label, { color }]}>{t(`tab.${id}`)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
    gap: 2,
  },
  label: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
});
