import { useState } from 'react';
import {
  ActivityIndicator,
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
import { checkAppKey, saveAppKey } from '../identify';
import { colors, darkPalette, fonts, lightPalette } from '../theme';

// Testphase: Findimal-Code gleich nach der Begrüßung abfragen (nicht erst beim ersten Foto).
// Kommt nur, wenn der Server einen Code verlangt – ist er später für alle offen, sieht man die Seite nie.
export function CodeScreen({ onDone }: { onDone: () => void }) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [wrong, setWrong] = useState(false);
  const trimmed = code.trim();

  const submit = async () => {
    if (!trimmed || checking) return;
    setChecking(true);
    setWrong(false);
    const result = await checkAppKey(trimmed);
    setChecking(false);
    if (result === 'wrong') return setWrong(true);
    // passt (oder offline – dann beim ersten Foto noch einmal prüfen)
    await saveAppKey(trimmed);
    onDone();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: p.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Explorer size={96} />
        <Text style={[styles.title, { color: p.ink }]}>{t('code.title')}</Text>
        <Text style={[styles.text, { color: p.mute }]}>{t('code.text')}</Text>

        <TextInput
          value={code}
          onChangeText={(v) => {
            setCode(v);
            setWrong(false);
          }}
          placeholder={t('code.placeholder')}
          placeholderTextColor={`${p.mute}99`}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={submit}
          accessibilityLabel={t('code.title')}
          style={[
            styles.input,
            { backgroundColor: p.card, borderColor: wrong ? colors.accent : p.line, color: p.ink },
            !code && styles.inputEmpty,
          ]}
        />
        {wrong && <Text style={[styles.wrong, { color: colors.accent }]}>{t('code.wrong')}</Text>}

        <Pressable
          onPress={submit}
          disabled={!trimmed || checking}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: p.button, opacity: !trimmed ? 0.5 : pressed ? 0.85 : 1 },
          ]}
        >
          {checking ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{t('code.next')}</Text>}
        </Pressable>
        <Pressable onPress={onDone} hitSlop={10} style={{ marginTop: 14 }}>
          <Text style={[styles.link, { color: p.moss }]}>{t('code.later')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// gleiches Aussehen wie die Frage nach der Region
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
    marginBottom: 20,
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
  inputEmpty: {
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  wrong: {
    fontFamily: fonts.sans,
    fontSize: 14,
    marginTop: 8,
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
