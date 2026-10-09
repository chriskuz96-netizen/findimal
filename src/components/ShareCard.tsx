import * as Sharing from 'expo-sharing';
import { forwardRef, RefObject } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { Translate } from '../i18n';
import { Animal } from '../identify';
import { breedGuessed, displayName } from '../names';
import { colors, fonts } from '../theme';
import { AppLogo } from './AppLogo';

// Größe der Karte auf dem Bildschirm (unsichtbar) – gespeichert wird sie in 1080 × 1350 (Format für Instagram & Co.)
const W = 360;
const H = 450;

type Props = { animal: Animal; photo: string; t: Translate; when?: string };

// Teilen-Bild: Foto, Name, „Wusstest du?“ und das Findimal-Logo.
// Wird außerhalb des Bildschirms gezeichnet und nur zum Teilen fotografiert – alles auf dem Handy, ohne Server.
export const ShareCard = forwardRef<View, Props>(function ShareCard({ animal, photo, t, when }, ref) {
  const fact = animal.wusstest_du || animal.kurzbeschreibung;
  const sub = animal.rasse
    ? `${animal.name}${breedGuessed(animal) ? ` · ${t('res.breedGuess')}` : ''}`
    : animal.wissenschaftlicher_name;
  return (
    <View ref={ref} collapsable={false} style={styles.card} pointerEvents="none">
      <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {displayName(animal)}
        </Text>
        {!!sub && (
          <Text style={styles.sub} numberOfLines={1}>
            {sub}
          </Text>
        )}
        {!!fact && (
          <Text style={styles.fact} numberOfLines={3}>
            <Text style={styles.factLabel}>{t('f.fun')} </Text>
            {fact}
          </Text>
        )}
        <View style={styles.foot}>
          <AppLogo size={22} />
          <Text style={styles.brand}>Findimal</Text>
          <Text style={styles.footText} numberOfLines={1}>
            {when || t('res.shareFoot')}
          </Text>
        </View>
      </View>
    </View>
  );
});

// Karte als Bild speichern und das Teilen-Menü öffnen
export async function shareCard(ref: RefObject<View | null>, t: Translate): Promise<void> {
  try {
    if (!ref.current || !(await Sharing.isAvailableAsync())) throw new Error('nicht verfügbar');
    const uri = await captureRef(ref, { format: 'jpg', quality: 0.9, width: 1080, height: 1350, result: 'tmpfile' });
    await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', UTI: 'public.jpeg', dialogTitle: t('res.share') });
  } catch {
    Alert.alert(t('res.share'), t('res.shareFailed'));
  }
}

const styles = StyleSheet.create({
  // außerhalb des sichtbaren Bereichs, aber vollständig gezeichnet
  card: { position: 'absolute', left: -10000, top: 0, width: W, height: H, backgroundColor: '#17462F' },
  photo: { width: W, height: 268 },
  body: { flex: 1, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 12 },
  name: { fontFamily: fonts.serifBold, fontSize: 26, color: colors.white },
  sub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.accentLight, marginTop: 1 },
  fact: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17, color: colors.white, opacity: 0.92, marginTop: 8 },
  factLabel: { fontFamily: fonts.sansBold, color: colors.accentLight },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 'auto' },
  brand: { fontFamily: fonts.serifBold, fontSize: 15, color: colors.white },
  footText: { flex: 1, textAlign: 'right', fontFamily: fonts.sans, fontSize: 10.5, color: colors.white, opacity: 0.7 },
});
