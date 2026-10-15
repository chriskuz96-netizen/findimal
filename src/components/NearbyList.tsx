import { useEffect, useState } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { GroupIcon, groupOf } from '../groups';
import { useI18n } from '../i18n';
import { detectPlace } from '../location';
import { daytime, loadNearby, NearbyAnimal } from '../nearby';
import { colors, darkPalette, fonts, lightPalette, spacing } from '../theme';
import { Explorer } from './Explorer';

// "Jetzt in deiner Nähe": drei Tiere, die man gerade in der Region entdecken kann.
// Ohne Ort: Hinweis mit "Standort verwenden" und "Ort eintippen" direkt an dieser Stelle.
export function NearbyList({
  region,
  onSetRegion,
  onTypeRegion,
}: {
  region: string;
  onSetRegion: (place: string) => void;
  onTypeRegion: () => void;
}) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const { t, lang } = useI18n();
  const [tiere, setTiere] = useState<NearbyAnimal[] | undefined>(undefined);

  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!region) return;
    setTiere(undefined);
    loadNearby(region, lang).then(setTiere);
  }, [region, lang]);

  const useLocation = async () => {
    setLocating(true);
    const place = await detectPlace();
    setLocating(false);
    if (place) onSetRegion(place);
    else Alert.alert(t('reg.notFoundTitle'), t('reg.notFoundText'), [{ text: 'OK', onPress: onTypeRegion }]);
  };

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

      {!region && (
        <View style={[styles.ask, { backgroundColor: p.card, borderColor: p.line }]}>
          <Text style={[styles.askText, { color: p.mute }]}>{t('near.ask')}</Text>
          <Pressable
            onPress={useLocation}
            disabled={locating}
            accessibilityRole="button"
            style={({ pressed }) => [styles.askBtn, { backgroundColor: p.button, opacity: pressed ? 0.85 : 1 }]}
          >
            {locating ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Svg width={16} height={16} viewBox="0 0 24 24">
                  <Path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" fill={colors.accent} />
                  <Circle cx={12} cy={10} r={2.6} fill={p.button} />
                </Svg>
                <Text style={styles.askBtnText}>{t('reg.useLocation')}</Text>
              </>
            )}
          </Pressable>
          <Pressable onPress={onTypeRegion} hitSlop={10} accessibilityRole="button" style={{ marginTop: 10 }}>
            <Text style={[styles.askLink, { color: p.moss }]}>{t('near.type')}</Text>
          </Pressable>
        </View>
      )}
      {!!region && tiere === undefined && <ActivityIndicator color={p.mute} style={{ marginVertical: 12 }} />}
      {!!region && tiere && (
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
  ask: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  askText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 12,
  },
  askBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 12,
    paddingVertical: 11,
    minHeight: 44,
  },
  askBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.white },
  askLink: { fontFamily: fonts.sansBold, fontSize: 14 },
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
});
