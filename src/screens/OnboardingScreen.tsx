import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { AppLogo } from '../components/AppLogo';
import { Explorer } from '../components/Explorer';
import { JungleBackground } from '../components/JungleBackground';
import { LanguageButton } from '../components/LanguageButton';
import { useI18n } from '../i18n';
import { colors, darkPalette, fonts, lightPalette } from '../theme';

type Props = { onDone: (name: string) => void };

// Erster Start: zuerst eine kurze Vorstellung der App, dann die Frage nach dem Namen.
export function OnboardingScreen({ onDone }: Props) {
  const [welcome, setWelcome] = useState(true);
  if (welcome) return <Welcome onNext={() => setWelcome(false)} />;
  return <AskName onDone={onDone} />;
}

// Willkommensseite: wofür Findimal da ist – Tiere entdecken, sammeln und schützen
function Welcome({ onNext }: { onNext: () => void }) {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, [fade]);
  const points: { icon: 'camera' | 'album' | 'heart'; title: string; text: string }[] = [
    { icon: 'camera', title: t('wel.p1'), text: t('wel.p1text') },
    { icon: 'album', title: t('wel.p2'), text: t('wel.p2text') },
    { icon: 'heart', title: t('wel.p3'), text: t('wel.p3text') },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.skyMid }]}>
      <JungleBackground />
      <ScrollView
        contentContainerStyle={[styles.welcome, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 }]}
      >
        <Animated.View
          style={{
            opacity: fade,
            alignItems: 'center',
            transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}
        >
          <AppLogo size={92} />
          <Text style={styles.wTitle}>{t('onb.title')}</Text>
          <Text style={styles.wLead}>{t('wel.lead')}</Text>
          <View style={styles.points}>
            {points.map((pt) => (
              <View key={pt.icon} style={styles.point}>
                <View style={styles.pIcon}>
                  <PointIcon id={pt.icon} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pTitle}>{pt.title}</Text>
                  <Text style={styles.pText}>{pt.text}</Text>
                </View>
              </View>
            ))}
          </View>
          <Pressable
            onPress={onNext}
            accessibilityRole="button"
            style={({ pressed }) => [styles.wButton, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.wButtonText}>{t('wel.go')}</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
      {/* nach der Liste, damit der Knopf oben drüber liegt und antippbar bleibt */}
      <LanguageButton top={insets.top + 14} />
    </View>
  );
}

function PointIcon({ id }: { id: 'camera' | 'album' | 'heart' }) {
  const s = { stroke: colors.accentLight, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      {id === 'camera' && (
        <>
          <Path d="M4 8h3l1.6-2.5h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" {...s} />
          <Circle cx={12} cy={13} r={3.6} {...s} />
        </>
      )}
      {id === 'album' && (
        <>
          <Rect x={3.5} y={4} width={7} height={7} rx={1.5} {...s} />
          <Rect x={13.5} y={4} width={7} height={7} rx={1.5} {...s} />
          <Rect x={3.5} y={14} width={7} height={7} rx={1.5} {...s} />
          <Rect x={13.5} y={14} width={7} height={7} rx={1.5} {...s} />
        </>
      )}
      {id === 'heart' && (
        <>
          <Path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" {...s} />
          <Path d="M12 16v-4.5M12 13.5c-1.6 0-2.6-1-2.6-2.4 1.5 0 2.6.9 2.6 2.4zM12 12.5c1.6 0 2.6-1 2.6-2.4-1.5 0-2.6.9-2.6 2.4z" {...s} strokeWidth={1.4} />
        </>
      )}
    </Svg>
  );
}

// Zweiter Schritt: Name
function AskName({ onDone }: Props) {
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
        <Text style={[styles.title, { color: p.ink }]}>{t('onb.nameTitle')}</Text>
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
  welcome: { paddingHorizontal: 22, flexGrow: 1, justifyContent: 'center' },
  wTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 30,
    color: colors.white,
    textAlign: 'center',
    marginTop: 16,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  wLead: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white,
    opacity: 0.88,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 340,
  },
  points: { alignSelf: 'stretch', gap: 10, marginTop: 24, maxWidth: 420, width: '100%' },
  point: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(10,30,20,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,210,168,0.22)',
    borderRadius: 18,
    padding: 14,
  },
  pIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(232,131,58,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pTitle: { fontFamily: fonts.serifBold, fontSize: 17, color: colors.white },
  pText: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.white, opacity: 0.85, marginTop: 2 },
  wButton: {
    marginTop: 24,
    alignSelf: 'stretch',
    maxWidth: 420,
    backgroundColor: colors.accent,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
  },
  wButtonText: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.ink },
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
