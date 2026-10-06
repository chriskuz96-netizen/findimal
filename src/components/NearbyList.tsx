import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { GroupIcon, groupOf } from '../groups';
import { daytime, loadNearby, NearbyAnimal } from '../nearby';
import { colors, darkPalette, fonts, lightPalette, spacing } from '../theme';
import { Explorer } from './Explorer';

// "Jetzt in deiner Nähe": drei Tiere, die man gerade in der Region entdecken kann.
export function NearbyList({ region }: { region: string }) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const [tiere, setTiere] = useState<NearbyAnimal[] | null | undefined>(undefined);

  useEffect(() => {
    setTiere(undefined);
    loadNearby(region).then(setTiere);
  }, [region]);

  return (
    <View style={styles.near}>
      <View style={styles.head}>
        <Explorer size={22} />
        <View>
          <Text style={[styles.when, { color: p.mute }]}>
            {region || 'Deutschland'}, {daytime()}
          </Text>
          <Text style={[styles.title, { color: p.ink }]}>Jetzt in deiner Nähe</Text>
        </View>
      </View>

      {tiere === undefined && <ActivityIndicator color={p.mute} style={{ marginVertical: 12 }} />}
      {tiere === null && (
        <Text style={[styles.empty, { color: p.mute }]}>
          Gerade keine Vorschläge. Mach ein Foto, dann versuche ich es später nochmal.
        </Text>
      )}
      {tiere && (
        <View style={styles.list}>
          {tiere.map((t) => {
            const g = groupOf(t.gruppe);
            return (
              <Pressable
                key={t.name}
                onPress={() => Alert.alert(t.name, `${t.tipp}\n\nWo suchen: ${t.wo}`)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.item,
                  { backgroundColor: p.card, borderColor: p.line, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View style={styles.icon}>
                  <GroupIcon id={g?.id ?? null} size={14} color={colors.accentLight} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.name, { color: p.ink }]} numberOfLines={1}>
                    {t.name}
                  </Text>
                  <Text style={[styles.where, { color: p.mute }]} numberOfLines={1}>
                    {t.wo}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  near: {
    marginHorizontal: spacing.gutter,
    marginTop: 8,
    marginBottom: 8,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  when: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 13,
  },
  list: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 6,
    minWidth: 0,
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#123826',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: fonts.sansBold,
    fontSize: 11.5,
    lineHeight: 14,
  },
  where: {
    fontFamily: fonts.sans,
    fontSize: 9.5,
    lineHeight: 12,
  },
  empty: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 4,
  },
});
