import { useState } from 'react';
import {
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
import { useI18n } from '../i18n';
import { darkPalette, fonts, lightPalette } from '../theme';

type Props = { onDone: (name: string) => void };

// Begrüßungsseite: fragt beim ersten Start nach dem Namen.
export function OnboardingScreen({ onDone }: Props) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const trimmed = name.trim();

  const submit = () => {
    if (trimmed) onDone(trimmed);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: p.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Explorer size={96} />
        <Text style={[styles.title, { color: p.ink }]}>{t('onb.title')}</Text>
        <Text style={[styles.text, { color: p.mute }]}>{t('onb.question')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('onb.placeholder')}
          placeholderTextColor={p.mute}
          maxLength={24}
          autoComplete="given-name"
          textContentType="givenName"
          autoCapitalize="words"
          returnKeyType="go"
          onSubmitEditing={submit}
          accessibilityLabel={t('onb.placeholder')}
          style={[styles.input, { backgroundColor: p.card, borderColor: p.line, color: p.ink }]}
        />
        <Pressable
          onPress={submit}
          disabled={!trimmed}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: p.moss, opacity: !trimmed ? 0.5 : pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={styles.buttonText}>{t('onb.start')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
    textAlign: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 320,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 20,
    marginBottom: 4,
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
  },
  buttonText: {
    color: '#fff',
    fontFamily: fonts.sansBold,
    fontSize: 17,
  },
});
