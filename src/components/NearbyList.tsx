import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { GroupIcon, groupOf } from '../groups';
import { useI18n } from '../i18n';
import { daytime, loadNearby, NearbyAnimal } from '../nearby';
import { colors, darkPalette, fonts, lightPalette, spacing } from '../theme';
import { Explorer } from './Explorer';

// "Jetzt in deiner Nähe": drei Tiere, die man gerade in der Region entdecken kann.
export function NearbyList({ region }: { region: string }) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const { t, lang } = useI18n();
  const [tiere, setTiere] = useState<NearbyAnimal[] | null | undefined>(undefined);

  useEffect(() => {
    setTiere(undefined);
    loadNearby(region, lang).then(setTiere);
  }, [region, lang]);

  return (
    <View style={styles.near}>
      <View style={styles.head}>
        <Explorer size={30} />
        <View>
          <Text style={[styles.when, { color: p.mute }]}>
            {region || t('near.yourArea')}, {t(daytime() === 'day' ? 'near.day' : 'near.eve')}
          </Text>
          <Text style={[styles.title, { color: p.ink }]}>{t('near.title')}</Text>
        </View>
      </View>

      {tiere === undefined && <ActivityIndicator color={p.mute} style={{ marginVertical: 12 }} />}
      {tiere === null && (
        <Text style={[styles.empty, { color: p.mute }]}>
          {t('near.empty')}
        </Text>
      )}
      {tiere && (
        <View style={styles.list}>
          {tiere.map((a) => {
            const g = groupOf(a.gruppe);
            return (
              <Pressable
                key={a.name}
                onPress={() => Alert.alert(a.name, `${a.tipp}\n\n${t('near.where', { where: a.wo })}`)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.item,
                  { backgroundColor: p.card, borderColor: p.line, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View style={styles.icon}>
                  <GroupIcon id={g?.id ?? null} size={20} color={colors.accentLight} />
                </View>
                <Text
                  style={[styles.name, { color: p.ink }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {a.name}
                </Text>
                <Text style={[styles.where, { color: p.mute }]} numberOfLines={2}>
                  {a.wo}
                </Text>
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
    marginTop: 12,
    marginBottom: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  when: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 17,
  },
  list: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    minWidth: 0,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#123826',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  name: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    lineHeight: 17,
    textAlign: 'center',
  },
  where: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 2,
  },
  empty: {
    fontFamily: fonts.sans,
    fontSize: 14,
    marginTop: 4,
  },
});
