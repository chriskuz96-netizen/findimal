import { Modal, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '../i18n';
import { askForPlus, PLUS_AVATARS, usePlus } from '../plus';
import { Badge } from '../progress';
import { colors, darkPalette, fonts, lightPalette } from '../theme';
import { Icon } from './Icon';
import { Avatar, PHOTO_PREFIX } from './Avatar';

type Props = {
  visible: boolean;
  name: string;
  avatar: string | null; // aktuelles Profilbild
  earned: Badge[]; // verdiente Abzeichen
  photos: string[]; // eigene Funde (neueste zuerst) – mit Plus als Profilbild wählbar
  onSelect: (id: string) => void; // '' = Anfangsbuchstabe
  onClose: () => void;
};

const SIZE = 54;

// Auswahl des Profilbilds: fährt von unten hoch, alles auf einen Blick (kein Wischen).
export function AvatarSheet({ visible, name, avatar, earned, photos, onSelect, onClose }: Props) {
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
        {locked && (
          <View style={styles.lock}>
            <Icon name="lock" size={16} color={colors.white} />
          </View>
        )}
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
          <View style={styles.h4Row}>
            <Icon name="medal" size={18} color={colors.accent} />
            <Text style={[styles.h4, { color: p.ink }]}>{t('pro.badgesTitle')}</Text>
          </View>
          <Text style={[styles.hint, { color: p.mute }]}>{t('pro.badgesHint')}</Text>
          <View style={styles.grid}>
            <Item id="" />
            {earned.map((b) => (
              <Item key={b.id} id={b.id} />
            ))}
          </View>

          {/* Plus-Tiere: ohne Plus mit Schloss */}
          <View style={styles.plusHead}>
            <View style={styles.h4Row}>
              <Icon name="star" size={16} color="#E8B53A" />
              <Text style={[styles.h4, { color: p.ink }]}>{t('pro.plusAvatars')}</Text>
            </View>
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

          {/* Eigene Fotos aus der Sammlung (Plus) – bleiben auf dem Handy, andere sehen sie nicht */}
          <View style={[styles.h4Row, { marginTop: 16 }]}>
            <Icon name="star" size={16} color="#E8B53A" />
            <Text style={[styles.h4, { color: p.ink }]}>{t('pro.photoAvatars')}</Text>
          </View>
          <Text style={[styles.hint, { color: p.mute }]}>{photos.length ? t('pro.photoAvatarsHint') : t('pro.photoAvatarsNone')}</Text>
          <View style={styles.grid}>
            {photos.map((id) => (
              <Item key={id} id={PHOTO_PREFIX + id} locked={!plus} />
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
  lock: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(10,30,20,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 6 },
  h4: { fontFamily: fonts.serifBold, fontSize: 17 },
  h4Row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  hint: { fontFamily: fonts.sans, fontSize: 13, marginTop: 2, marginBottom: 6 },
  unlock: { fontFamily: fonts.sansBold, fontSize: 14 },
});
