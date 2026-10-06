import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Photo } from '../camera';
import { HeaderBackground } from '../components/HeaderBackground';
import { Find, useFindPhoto } from '../finds';
import { Explorer } from '../components/Explorer';
import { Animal, identify, IdentifyResult } from '../identify';
import { colors, darkPalette, fonts, lightPalette, Palette, spacing } from '../theme';

type Props =
  // Neues Foto: wird bestimmt und (wenn ein Tier drauf ist) gespeichert
  | { photo: Photo; saved?: undefined; onIdentified: (animal: Animal) => Promise<{ isNew: boolean; reward: string | null }>; onBack: () => void }
  // Fund aus der Sammlung: wird nur angezeigt
  | { photo?: undefined; saved: Find; onIdentified?: undefined; onBack: () => void };

// Ergebnisseite: bestimmt ein neues Foto oder zeigt einen gespeicherten Fund.
export function ResultScreen({ photo, saved, onIdentified, onBack }: Props) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const [result, setResult] = useState<IdentifyResult | null>(
    saved ? { ok: true, animal: saved.animal } : null,
  );
  const [isNew, setIsNew] = useState(false);
  const [reward, setReward] = useState<string | null>(null);
  const savedPhoto = useFindPhoto(saved?.id ?? '');

  const run = useCallback(() => {
    if (!photo) return;
    setResult(null);
    identify(photo).then(async (r) => {
      setResult(r);
      if (r.ok && r.animal.tier_gefunden) {
        const res = await onIdentified(r.animal);
        setIsNew(res.isNew);
        setReward(res.reward);
      }
    });
    // onIdentified absichtlich nicht als Abhängigkeit: nur einmal pro Foto bestimmen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);

  useEffect(run, [run]);

  const animal = result?.ok && result.animal.tier_gefunden ? result.animal : null;

  // Kurzer Text in der Sprechblase des Forschers (lange Texte stehen unten in der Karte)
  let title = 'Moment …';
  let sub = 'Ich schaue genau hin';
  if (result && !result.ok) {
    title = 'Hoppla!';
    sub = 'Das hat nicht geklappt';
  } else if (result?.ok && !animal) {
    title = 'Kein Tier entdeckt';
    sub = 'Versuch es gleich nochmal';
  } else if (animal) {
    title = animal.name;
    sub = animal.wissenschaftlicher_name;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      {/* Grün auch oberhalb, falls man über den oberen Rand hinaus zieht */}
      <View style={styles.overscroll} />
      {/* Dunkler Kopfbereich mit dem Forscher und seiner Sprechblase */}
      <View style={[styles.top, { paddingTop: insets.top + 20 }]}>
        <HeaderBackground />
        <View style={styles.guide}>
          <Explorer size={60} />
          <View style={styles.bubble}>
            <Text style={styles.bubbleTitle}>{title}</Text>
            {!!sub && <Text style={styles.bubbleSub}>{sub}</Text>}
            {animal && <Certainty value={animal.sicherheit} />}
            {!result && <ActivityIndicator color={colors.accentLight} style={styles.spinner} />}
          </View>
        </View>
      </View>

      <View style={styles.photo}>
        {(photo || savedPhoto) && (
          <Image
            source={{ uri: photo ? photo.uri : savedPhoto! }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessibilityLabel="Dein Foto"
          />
        )}
        {isNew && <Text style={styles.stamp}>Neu entdeckt</Text>}
        {!!reward && <Text style={styles.reward}>{reward}</Text>}
      </View>
      {saved && (
        <Text style={[styles.foundOn, { color: p.mute }]}>
          Gefunden am {new Date(saved.date).toLocaleDateString('de-DE')}
        </Text>
      )}

      {animal && <Profile animal={animal} p={p} />}

      {result && !animal && (
        <View style={[styles.sheet, { backgroundColor: p.card, borderColor: p.line }]}>
          <Text style={[styles.p, { color: p.ink }]}>
            {!result.ok
              ? result.message
              : result.animal.hinweis || 'Versuch es mit einem näheren, schärferen Foto.'}
          </Text>
        </View>
      )}

      {result && !result.ok && (
        <Button label="Nochmal versuchen" onPress={run} filled color={p.moss} />
      )}
      <Button label="Weiter entdecken" onPress={onBack} filled={!result || result.ok} color={p.moss} p={p} />
    </ScrollView>
  );
}

// Kleines Schild in der Sprechblase: wie sicher die Bestimmung ist
function Certainty({ value }: { value: Animal['sicherheit'] }) {
  const label =
    value === 'sicher' ? 'Sicher bestimmt' : value === 'wahrscheinlich' ? 'Ziemlich sicher' : 'Nicht ganz sicher';
  return (
    <View style={styles.certainty}>
      <View style={[styles.dot, { backgroundColor: value === 'unsicher' ? colors.accent : '#6FBF8A' }]} />
      <Text style={styles.certaintyText}>{label}</Text>
    </View>
  );
}

// Steckbrief-Karte wie im Entwurf
function Profile({ animal, p }: { animal: Animal; p: Palette }) {
  const rows: [string, string][] = [
    ['Klasse', animal.klasse],
    ['Familie', animal.familie],
    ['Größe', animal.groesse],
    ['Aktiv', animal.aktiv],
    ['Lebensraum', animal.lebensraum],
    ['Verbreitung', animal.verbreitung],
  ];
  const sections: [string, string][] = [
    ['Wusstest du?', animal.wusstest_du],
    ['Rolle in der Natur', animal.rolle_in_der_natur],
    ['Nahrung', animal.nahrung],
    ['Fressfeinde', animal.fressfeinde],
  ];

  return (
    <View style={[styles.sheet, { backgroundColor: p.card, borderColor: p.line }]}>
      {!!animal.kurzbeschreibung && (
        <Text style={[styles.p, styles.intro, { color: p.ink }]}>{animal.kurzbeschreibung}</Text>
      )}
      {animal.sicherheit === 'unsicher' && (
        <Text style={[styles.tip, { color: colors.accent }]}>Tipp: Ein näheres, scharfes Foto hilft mir.</Text>
      )}
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <View key={k} style={styles.kv}>
            <Text style={[styles.k, { color: p.mute }]}>{k}</Text>
            <Text style={[styles.v, { color: p.ink }]}>{v}</Text>
          </View>
        ))}
      {!!animal.gefaehrdung && (
        <View style={[styles.status, { backgroundColor: 'rgba(47,107,71,0.14)' }]}>
          <View style={[styles.dot, { backgroundColor: p.moss }]} />
          <Text style={[styles.statusText, { color: p.moss }]}>{animal.gefaehrdung}</Text>
        </View>
      )}
      {sections
        .filter(([, v]) => v)
        .map(([h, v]) => (
          <View key={h}>
            <Text style={[styles.h4, { color: p.ink }]}>{h}</Text>
            <Text style={[styles.p, { color: p.ink }]}>{v}</Text>
          </View>
        ))}
      <Text style={[styles.ai, { color: p.mute }]}>Angaben laut KI-Einschätzung, ohne Gewähr.</Text>
    </View>
  );
}

function Button({
  label,
  onPress,
  filled,
  color,
  p,
}: {
  label: string;
  onPress: () => void;
  filled: boolean;
  color: string;
  p?: Palette;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        filled
          ? { backgroundColor: color }
          : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: p?.line },
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.btnText, { color: filled ? colors.white : p?.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: {
    overflow: 'hidden',
    backgroundColor: '#17462F',
    paddingHorizontal: spacing.gutter,
    paddingBottom: 22,
    borderBottomLeftRadius: spacing.radiusHero,
    borderBottomRightRadius: spacing.radiusHero,
  },
  guide: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  bubble: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  bubbleTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 21,
    lineHeight: 24,
    color: colors.white,
  },
  bubbleSub: {
    fontFamily: fonts.sans,
    fontStyle: 'italic',
    fontSize: 15,
    color: colors.accentLight,
    marginTop: 2,
    marginBottom: 6,
  },
  overscroll: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    height: 1000,
    backgroundColor: '#17462F',
  },
  spinner: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  certainty: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 2,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  certaintyText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.white,
  },
  intro: {
    marginBottom: 12,
  },
  tip: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    marginTop: -6,
    marginBottom: 12,
  },
  photo: {
    margin: spacing.gutter,
    height: 240,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#5a4a33',
  },
  stamp: {
    position: 'absolute',
    right: 12,
    top: 12,
    borderWidth: 2,
    borderColor: colors.coral,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    color: colors.coral,
    fontFamily: fonts.serifBold,
    fontSize: 17,
    paddingHorizontal: 10,
    transform: [{ rotate: '7deg' }],
  },
  reward: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: colors.accent,
    color: colors.ink,
    fontFamily: fonts.sansBold,
    fontSize: 13,
    borderRadius: 99,
    overflow: 'hidden',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  foundOn: {
    marginTop: -8,
    marginBottom: 10,
    marginHorizontal: spacing.gutter,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  sheet: {
    marginHorizontal: spacing.gutter,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  kv: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 5,
  },
  k: {
    width: 92,
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  v: {
    flex: 1,
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  status: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    marginBottom: 2,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 99,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
  },
  h4: {
    fontFamily: fonts.serifBold,
    fontSize: 15,
    marginTop: 12,
    marginBottom: 2,
  },
  p: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    lineHeight: 21,
  },
  ai: {
    fontFamily: fonts.sans,
    fontSize: 12,
    marginTop: 12,
  },
  btn: {
    marginHorizontal: spacing.gutter,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: fonts.sansBold,
    fontSize: 17,
  },
});
