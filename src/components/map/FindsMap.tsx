import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Find } from '../../finds';
import { GroupIcon, groupOf } from '../../groups';
import { colors } from '../../theme';

type Props = { finds: Find[]; locale: string; onOpen: (f: Find) => void };

// Karte mit allen Funden, die einen Fundort haben (Apple Karten, kein Schlüssel nötig).
export function FindsMap({ finds, locale, onOpen }: Props) {
  const points = finds.filter((f) => f.coords);
  const lats = points.map((f) => f.coords!.lat);
  const lngs = points.map((f) => f.coords!.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const region = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.5),
    longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.5),
  };

  return (
    <MapView style={StyleSheet.absoluteFill} initialRegion={region} showsUserLocation>
      {points.map((f) => (
        <Marker
          key={f.id}
          coordinate={{ latitude: f.coords!.lat, longitude: f.coords!.lng }}
          title={f.animal.name}
          description={new Date(f.date).toLocaleDateString(locale)}
          onCalloutPress={() => onOpen(f)}
        >
          <View style={styles.pin}>
            <GroupIcon id={groupOf(f.animal.gruppe)?.id ?? null} size={18} color={colors.accentLight} />
          </View>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#123826',
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
