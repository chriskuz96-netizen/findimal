import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Explorer } from '../components/Explorer';
import { detectPlace } from '../location';
import { useI18n } from '../i18n';
import { colors, darkPalette, fonts, lightPalette } from '../theme';

type Props = { onDone: (region: string) => void };

// Zweite Begrüßungsfrage: Wo bist du unterwegs? ('' = später)
export function RegionScreen({ onDone }: Props) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [region, setRegion] = useState('');
  const [locating, setLocating] = useState(false);
  const trimmed = region.trim();

  const useLocation = async () => {
    setLocating(true);
    const place = await detectPlace();
    setLocating(false);
    if (place) onDone(place);
    else
      Alert.alert(t('reg.notFoundTitle'), t('reg.notFoundText'));
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: p.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Explorer size={96} />
        <Text style={[styles.title, { color: p.ink }]}>{t('reg.title')}</Text>
        <Text style={[styles.text, { color: p.mute }]}>
          {t('reg.text')}
        </Text>

        <Pressable
          onPress={useLocation}
          disabled={locating}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: p.button, marginTop: 20, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          {locating ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>{t('reg.useLocation')}</Text>
          )}
        </Pressable>

        <Text style={[styles.or, { color: p.mute }]}>{t('reg.or')}</Text>
        <TextInput
          value={region}
          onChangeText={setRegion}
          placeholder={t('reg.placeholder')}
          placeholderTextColor={p.mute}
          maxLength={40}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={() => trimmed && onDone(trimmed)}
          accessibilityLabel={t('pro.region')}
          style={[styles.input, { backgroundColor: p.card, borderColor: p.line, color: p.ink }]}
        />
        <Pressable
          onPress={() => trimmed && onDone(trimmed)}
          disabled={!trimmed}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            styles.outline,
            { borderColor: p.line, opacity: !trimmed ? 0.5 : pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={[styles.buttonText, { color: p.ink }]}>{t('reg.next')}</Text>
        </Pressable>
        <Pressable onPress={() => onDone('')} hitSlop={10} style={{ marginTop: 14 }}>
          <Text style={[styles.link, { color: p.moss }]}>{t('reg.later')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 28,
    marginTop: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  text: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 340,
  },
  or: {
    fontFamily: fonts.sans,
    fontSize: 13,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    maxWidth: 320,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    fontFamily: fonts.sansBold,
    fontSize: 17,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    maxWidth: 320,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  buttonText: {
    color: colors.white,
    fontFamily: fonts.sansBold,
    fontSize: 17,
  },
  link: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
});
