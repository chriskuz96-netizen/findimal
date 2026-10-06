import { useState } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { LANGS, useI18n } from '../i18n';
import { colors, darkPalette, fonts, lightPalette } from '../theme';

// Kleiner Sprachknopf "DE ▾" mit Auswahlliste (wie oben rechts in der Vorlage).
export function LanguageButton({ top }: { top: number }) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.wrap, { top }]}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityLabel={t('a11y.language')}
        hitSlop={8}
        style={styles.button}
      >
        <Text style={styles.buttonText}>{lang.toUpperCase()} ▾</Text>
      </Pressable>
      {open && (
        <View style={[styles.menu, { backgroundColor: p.card, borderColor: p.line }]}>
          {LANGS.map((l) => (
            <Pressable
              key={l.id}
              onPress={() => {
                setLang(l.id);
                setOpen(false);
              }}
              style={[styles.item, l.id === lang && { backgroundColor: 'rgba(232,131,58,0.2)' }]}
            >
              <Text style={[styles.itemText, { color: p.ink }]}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// Auswahl als Reihe von Knöpfen (für das Profil)
export function LanguageChips() {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const { lang, setLang } = useI18n();
  return (
    <View style={styles.chips}>
      {LANGS.map((l) => {
        const on = l.id === lang;
        return (
          <Pressable
            key={l.id}
            onPress={() => setLang(l.id)}
            style={[styles.chip, on ? { backgroundColor: p.moss, borderColor: p.moss } : { borderColor: p.line }]}
          >
            <Text style={[styles.chipText, { color: on ? colors.white : p.ink }]}>{l.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 14, zIndex: 5, alignItems: 'flex-end' },
  button: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  buttonText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.white },
  menu: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    minWidth: 150,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  item: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  itemText: { fontFamily: fonts.sansBold, fontSize: 15 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { borderWidth: 1.5, borderRadius: 99, paddingVertical: 8, paddingHorizontal: 14 },
  chipText: { fontFamily: fonts.sansBold, fontSize: 14 },
});
