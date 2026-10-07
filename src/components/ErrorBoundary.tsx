import { Component, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '../i18n';
import { colors } from '../theme';
import { AppLogo } from './AppLogo';

// Sicherheitsnetz: Stürzt ein Bildschirm unerwartet ab, zeigt die App eine freundliche Seite
// statt eines leeren Bildschirms. "Nochmal versuchen" baut die App neu auf; Funde bleiben gespeichert.
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; round: number }> {
  state = { failed: false, round: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <Oops onRetry={() => this.setState((s) => ({ failed: false, round: s.round + 1 }))} />;
    }
    // neuer key nach "Nochmal versuchen" = alles frisch aufbauen
    return <View key={this.state.round} style={{ flex: 1 }}>{this.props.children}</View>;
  }
}

function Oops({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <View style={styles.wrap}>
      <AppLogo size={96} />
      <Text style={styles.title}>{t('err.title')}</Text>
      <Text style={styles.text}>{t('err.text')}</Text>
      <Pressable onPress={onRetry} style={styles.btn} accessibilityRole="button">
        <Text style={styles.btnText}>{t('err.retry')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.skyMid, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  title: { fontSize: 24, fontWeight: '700', color: colors.white, textAlign: 'center' },
  text: { fontSize: 16, lineHeight: 22, color: colors.accentLight, textAlign: 'center' },
  btn: { marginTop: 8, backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 28 },
  btnText: { fontSize: 17, fontWeight: '700', color: colors.ink },
});
