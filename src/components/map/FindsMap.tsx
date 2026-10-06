import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Find } from '../../finds';
import { GroupIcon, groupOf } from '../../groups';
import { colors, fonts } from '../../theme';

type Props = { finds: Find[]; locale: string; onOpen: (f: Find) => void };

const TILE = 256;

// Umrechnung Längen-/Breitengrad -> Pixel auf der Weltkarte (Web-Mercator, wie bei OpenStreetMap)
function project(lat: number, lng: number, zoom: number) {
  const scale = TILE * 2 ** zoom;
  const rad = (lat * Math.PI) / 180;
  return {
    x: ((lng + 180) / 360) * scale,
    y: ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * scale,
  };
}

// Karte aus OpenStreetMap-Kacheln mit allen Funden, die einen Fundort haben.
// Bewusst ohne Karten-Paket, damit die App in Expo Snack / Expo Go sicher startet.
export function FindsMap({ finds, onOpen }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const points = finds.filter((f) => f.coords);
  const { w, h } = size;

  let content = null;
  if (w > 0 && points.length) {
    // größte Zoomstufe, bei der alle Funde (mit Rand) auf die Karte passen
    let zoom = 16;
    for (; zoom > 2; zoom--) {
      const px = points.map((f) => project(f.coords!.lat, f.coords!.lng, zoom));
      const spanX = Math.max(...px.map((q) => q.x)) - Math.min(...px.map((q) => q.x));
      const spanY = Math.max(...px.map((q) => q.y)) - Math.min(...px.map((q) => q.y));
      if (spanX <= w - 80 && spanY <= h - 80) break;
    }
    const px = points.map((f) => project(f.coords!.lat, f.coords!.lng, zoom));
    const cx = (Math.max(...px.map((q) => q.x)) + Math.min(...px.map((q) => q.x))) / 2;
    const cy = (Math.max(...px.map((q) => q.y)) + Math.min(...px.map((q) => q.y))) / 2;
    const left = cx - w / 2;
    const top = cy - h / 2;
    const max = 2 ** zoom;

    // Kacheln, die den sichtbaren Ausschnitt abdecken
    const tiles = [];
    for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + w) / TILE); tx++) {
      for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + h) / TILE); ty++) {
        if (ty < 0 || ty >= max) continue;
        const x = ((tx % max) + max) % max;
        tiles.push(
          <Image
            key={`${tx}-${ty}`}
            source={{ uri: `https://tile.openstreetmap.org/${zoom}/${x}/${ty}.png` }}
            style={{ position: 'absolute', left: tx * TILE - left, top: ty * TILE - top, width: TILE, height: TILE }}
          />,
        );
      }
    }

    content = (
      <>
        {tiles}
        {points.map((f, i) => (
          <Pressable
            key={f.id}
            onPress={() => onOpen(f)}
            accessibilityRole="button"
            accessibilityLabel={f.animal.name}
            hitSlop={6}
            style={[styles.pin, { left: px[i].x - left - 17, top: px[i].y - top - 17 }]}
          >
            <GroupIcon id={groupOf(f.animal.gruppe)?.id ?? null} size={18} color={colors.accentLight} />
          </Pressable>
        ))}
        <Text style={styles.credit}>© OpenStreetMap</Text>
      </>
    );
  }

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.box]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#cfdccb', overflow: 'hidden' },
  pin: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#123826',
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  credit: {
    position: 'absolute',
    right: 6,
    bottom: 4,
    fontFamily: fonts.sans,
    fontSize: 10,
    color: '#333',
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
