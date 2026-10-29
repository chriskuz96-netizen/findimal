import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, PanResponder, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';

import { useFindPhoto } from '../finds';
import { useI18n } from '../i18n';
import { colors, fonts } from '../theme';

// Bildausschnitt fürs Profilbild wählen: Foto im Kreis verschieben (ein Finger) und zoomen
// (zwei Finger oder – / +). „Fertig“ speichert den Ausschnitt als quadratisches Bild (400 × 400).
const MAX_ZOOM = 4;

export function PhotoCropper({
  findId,
  onDone,
  onCancel,
}: {
  findId: string | null;
  onDone: (uri: string) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const S = Math.min(useWindowDimensions().width - 48, 340); // Größe des Rahmens
  const uri = useFindPhoto(findId ?? '');
  const [img, setImg] = useState<{ w: number; h: number } | null>(null);
  const [busy, setBusy] = useState(false);
  // Lage des Bildes: zoom (1 = füllt den Rahmen gerade aus) und linke obere Ecke (x, y) im Rahmen
  const view = useRef({ zoom: 1, x: 0, y: 0 });
  const [shown, setShown] = useState(view.current);

  useEffect(() => {
    setImg(null);
    if (!uri) return;
    Image.getSize(uri, (w, h) => setImg({ w, h }), () => setImg(null));
  }, [uri]);

  // Grundmaßstab: das Bild deckt den Rahmen gerade ab
  const base = img ? S / Math.min(img.w, img.h) : 1;
  const apply = (zoom: number, x: number, y: number) => {
    if (!img) return;
    const z = Math.max(1, Math.min(MAX_ZOOM, zoom));
    const W = img.w * base * z;
    const H = img.h * base * z;
    const nx = Math.min(0, Math.max(S - W, x));
    const ny = Math.min(0, Math.max(S - H, y));
    view.current = { zoom: z, x: nx, y: ny };
    setShown(view.current);
  };
  // Start: mittig
  useEffect(() => {
    if (img) apply(1, (S - img.w * base) / 2, (S - img.h * base) / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, S]);

  // Zoomen um den Mittelpunkt des Rahmens
  const zoomTo = (z: number, cx = S / 2, cy = S / 2) => {
    const v = view.current;
    const nz = Math.max(1, Math.min(MAX_ZOOM, z));
    const k = nz / v.zoom;
    apply(nz, cx - (cx - v.x) * k, cy - (cy - v.y) * k);
  };

  // Finger: einer verschiebt, zwei zoomen (um die Mitte des Rahmens).
  // Der Responder entsteht nur einmal: er ruft immer die aktuellen Funktionen (mit geladenem Bild) auf.
  const fns = useRef({ apply, zoomTo });
  fns.current = { apply, zoomTo };
  const last = useRef({ dx: 0, dy: 0, dist: 0 });
  const dist = (e: { nativeEvent: { touches: { pageX: number; pageY: number }[] } }) => {
    const ts = e.nativeEvent.touches;
    return ts.length >= 2 ? Math.hypot(ts[0].pageX - ts[1].pageX, ts[0].pageY - ts[1].pageY) : 0;
  };
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        last.current = { dx: 0, dy: 0, dist: dist(e) };
      },
      onPanResponderMove: (e, g) => {
        const d = dist(e);
        const v = view.current;
        if (d && last.current.dist) fns.current.zoomTo((v.zoom * d) / last.current.dist);
        else fns.current.apply(v.zoom, v.x + g.dx - last.current.dx, v.y + g.dy - last.current.dy);
        last.current = { dx: g.dx, dy: g.dy, dist: d };
      },
    }),
  ).current;

  const done = async () => {
    if (!img || !uri || busy) return;
    setBusy(true);
    try {
      const v = view.current;
      const k = base * v.zoom; // Bildpunkte -> Bildschirm
      const side = Math.min(img.w, img.h, S / k);
      const originX = Math.max(0, Math.min(img.w - side, -v.x / k));
      const originY = Math.max(0, Math.min(img.h - side, -v.y / k));
      const out = await ImageManipulator.manipulate(uri)
        .crop({ originX, originY, width: side, height: side })
        .resize({ width: 400, height: 400 })
        .renderAsync();
      const saved = await out.saveAsync({ compress: 0.8, format: SaveFormat.JPEG, base64: true });
      onDone(saved.base64 ? `data:image/jpeg;base64,${saved.base64}` : saved.uri);
    } catch {
      onCancel();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={!!findId} animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.wrap, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <Text selectable={false} style={styles.title}>{t('crop.title')}</Text>
        <Text selectable={false} style={styles.hint}>{t('crop.hint')}</Text>
        <View style={[styles.frame, { width: S, height: S }]} {...responder.panHandlers}>
          {uri && img ? (
            <Image
              source={{ uri }}
              style={{ position: 'absolute', left: shown.x, top: shown.y, width: img.w * base * shown.zoom, height: img.h * base * shown.zoom }}
            />
          ) : (
            <ActivityIndicator color={colors.white} style={{ marginTop: S / 2 - 10 }} />
          )}
          {/* dunkle Fläche um den Kreis: das wird später abgeschnitten */}
          <Svg width={S} height={S} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <Mask id="crop-hole">
                <Rect width={S} height={S} fill="#fff" />
                <Circle cx={S / 2} cy={S / 2} r={S / 2 - 2} fill="#000" />
              </Mask>
            </Defs>
            <Rect width={S} height={S} fill="rgba(0,0,0,0.55)" mask="url(#crop-hole)" />
            <Circle cx={S / 2} cy={S / 2} r={S / 2 - 2} stroke="#E8B53A" strokeWidth={3} fill="none" />
          </Svg>
        </View>
        <View style={styles.zoomRow}>
          <Pressable onPress={() => zoomTo(view.current.zoom / 1.25)} style={styles.zoomBtn} accessibilityRole="button" accessibilityLabel={t('crop.out')}>
            <Text style={styles.zoomText}>–</Text>
          </Pressable>
          <Pressable onPress={() => zoomTo(view.current.zoom * 1.25)} style={styles.zoomBtn} accessibilityRole="button" accessibilityLabel={t('crop.in')}>
            <Text style={styles.zoomText}>+</Text>
          </Pressable>
        </View>
        <View style={styles.btnRow}>
          <Pressable onPress={onCancel} style={[styles.btn, styles.cancel]} accessibilityRole="button">
            <Text style={styles.btnText}>{t('common.cancel')}</Text>
          </Pressable>
          <Pressable onPress={done} style={[styles.btn, styles.ok]} accessibilityRole="button">
            {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>{t('crop.done')}</Text>}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0E2219', alignItems: 'center' },
  title: { fontFamily: fonts.serifBold, fontSize: 24, color: colors.white },
  hint: { fontFamily: fonts.sans, fontSize: 14, color: '#CFE3D6', marginTop: 6, marginBottom: 22, textAlign: 'center', paddingHorizontal: 24 },
  frame: { overflow: 'hidden', backgroundColor: '#000', borderRadius: 12 },
  zoomRow: { flexDirection: 'row', gap: 16, marginTop: 20 },
  zoomBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  zoomText: { fontFamily: fonts.sansBold, fontSize: 26, color: colors.white, marginTop: -2 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 'auto', alignSelf: 'stretch', paddingHorizontal: 24 },
  btn: { flex: 1, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  cancel: { backgroundColor: 'rgba(255,255,255,0.12)' },
  ok: { backgroundColor: '#1F6E47' },
  btnText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.white },
});
