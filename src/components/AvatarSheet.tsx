import { Modal, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '../i18n';
import { askForPlus, PLUS_AVATARS, usePlus } from '../plus';
import { Badge } from '../progress';
import { colors, darkPalette, fonts, lightPalette } from '../theme';
import { Avatar } from './Avatar';

type Props = {
  visible: boolean;
  name: string;
  avatar: string | null; // aktuelles Profilbild
  earned: Badge[]; // verdiente Abzeichen
  onSelect: (id: string) => void; // '' = Anfangsbuchstabe
  onClose: () => void;
};

const SIZE = 54;

// Auswahl des Profilbilds: fährt von unten hoch, alles auf einen Blick (kein Wischen).
export function AvatarSheet({ visible, name, avatar, earned, onSelect, onClose }: Props) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { plus, setPlus } = usePlus();

  const pick = (id: string) => {
    onSelect(id);
    onClose();
  };

  const Item = ({ id, locked }: { id: string; locked?: boolean }) => {
    const on = (avatar ?? '') === id;
    return (
      <Pressable
        onPress={() => (locked ? askForPlus(t, setPlus) : pick(id))}
        style={[styles.item, on && styles.itemOn]}
        accessibilityRole="button"
      >
        <View style={{ opacity: locked ? 0.45 : 1 }}>
          <Avatar id={id || null} name={name} size={SIZE} />
        </View>
        {locked && <Text style={styles.lock}>🔒</Text>}
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.dim} onPress={onClose} accessibilityLabel={t('ad.close')} />
      <View style={[styles.sheet, { backgroundColor: p.card, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.head}>
          <Text style={[styles.title, { color: p.ink }]}>{t('pro.avatar')}</Text>
          <Pressable onPress={onClose} hitSlop={12} style={[styles.close, { backgroundColor: p.line }]} accessibilityRole="button" accessibilityLabel={t('ad.close')}>
            <Text style={[styles.closeText, { color: p.ink }]}>✕</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: 8 }}>
          {/* Buchstabe und verdiente Abzeichen */}
          <View style={styles.grid}>
            <Item id="" />
            {earned.map((b) => (
              <Item key={b.id} id={b.id} />
            ))}
          </View>

          {/* Plus-Tiere: ohne Plus mit Schloss */}
          <View style={styles.plusHead}>
            <Text style={[styles.h4, { color: p.ink }]}>★ {t('pro.plusAvatars')}</Text>
            {!plus && (
              <Pressable onPress={() => askForPlus(t, setPlus)} hitSlop={8} accessibilityRole="button">
                <Text style={[styles.unlock, { color: colors.accent }]}>{t('pro.unlock')} ›</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.grid}>
            {PLUS_AVATARS.map((a) => (
              <Item key={a.id} id={a.id} locked={!plus} />
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    maxHeight: '82%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontFamily: fonts.serifBold, fontSize: 21 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: fonts.sansBold, fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  item: { padding: 3, borderRadius: 40, borderWidth: 2.5, borderColor: 'transparent' },
  itemOn: { borderColor: colors.accent },
  lock: { position: 'absolute', right: 2, bottom: 2, fontSize: 13 },
  plusHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 6 },
  h4: { fontFamily: fonts.serifBold, fontSize: 17 },
  unlock: { fontFamily: fonts.sansBold, fontSize: 14 },
});
