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
  | { photo: Photo; saved?: undefined; onIdentified: (animal: Animal) => Promise<boolean>; onBack: () => void }
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
  const savedPhoto = useFindPhoto(saved?.id ?? '');

  const run = useCallback(() => {
    if (!photo) return;
    setResult(null);
    identify(photo).then(async (r) => {
      setResult(r);
      if (r.ok && r.animal.tier_gefunden) setIsNew(await onIdentified(r.animal));
    });
    // onIdentified absichtlich nicht als Abhängigkeit: nur einmal pro Foto bestimmen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);

  useEffect(run, [run]);

  const animal = result?.ok && result.animal.tier_gefunden ? result.animal : null;

  // Text in der Sprechblase des Forschers
  let title = 'Moment …';
  let sub = 'Ich schaue genau hin';
  let text = 'Gleich weißt du, wen du entdeckt hast.';
  if (result && !result.ok) {
    title = 'Hoppla!';
    sub = 'Das hat nicht geklappt';
    text = result.message;
  } else if (result?.ok && !animal) {
    title = 'Hmm …';
    sub = 'Kein Tier entdeckt';
    text = result.animal.hinweis || 'Versuch es mit einem näheren, schärferen Foto.';
  } else if (animal) {
    title = animal.name;
    sub = animal.wissenschaftlicher_name;
    text = animal.kurzbeschreibung;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: p.bg }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      {/* Dunkler Kopfbereich mit dem Forscher und seiner Sprechblase */}
      <View style={[styles.top, { paddingTop: insets.top + 24 }]}>
        <HeaderBackground />
        <View style={styles.guide}>
          <Explorer size={72} />
          <View style={styles.bubble}>
            <Text style={styles.bubbleTitle}>{title}</Text>
            <Text style={styles.bubbleSub}>{sub}</Text>
            <Text style={styles.bubbleText}>{text}</Text>
            {!result && <ActivityIndicator color={colors.accentLight} style={{ marginTop: 8 }} />}
          </View>
        </View>
      </View>

      <View style={styles.photo}>
        {(photo || savedPhoto) && (
          <Image
            source={{ uri: photo ? photo.uri : savedPhoto! }}
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Dein Foto"
          />
        )}
        {isNew && <Text style={styles.stamp}>Neu entdeckt</Text>}
      </View>
      {saved && (
        <Text style={[styles.foundOn, { color: p.mute }]}>
          Gefunden am {new Date(saved.date).toLocaleDateString('de-DE')}
        </Text>
      )}

      {animal && <Profile animal={animal} p={p} />}

      {result && !result.ok && (
        <Button label="Nochmal versuchen" onPress={run} filled color={p.moss} />
      )}
      <Button label="Weiter entdecken" onPress={onBack} filled={!result || !!animal || result.ok} color={p.moss} p={p} />
    </ScrollView>
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
      {animal.sicherheit !== 'sicher' && (
        <Text style={[styles.unsure, { color: colors.accentDark }]}>
          {animal.sicherheit === 'wahrscheinlich'
            ? 'Ziemlich sicher, aber schau gern nochmal genau hin.'
            : 'Da bin ich mir nicht sicher. Ein näheres Foto hilft mir.'}
        </Text>
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
  bubbleText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 21,
    color: colors.white,
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
  unsure: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    marginBottom: 10,
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
