import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';

import { SERVER_URL } from '../config';
import { findOfAvatar, useAvatarImage } from '../avatarPhoto';
import { useFindPhoto } from '../finds';
import { PLUS_AVATARS } from '../plus';
import { BadgeId } from '../progress';
import { PLUS_ANIMAL_ART, PLUS_ANIMAL_BG } from './PlusAnimal';
import { colors, fonts } from '../theme';
import { BADGE_TIER, Medal } from './Medal';

// Foto aus der eigenen Sammlung als Profilbild (Plus): 'f-<Fund-ID>' auf dem eigenen Handy.
// In der Rangliste steht dafür 'u:<Code>.<Kennung>' – das geprüfte Vorschaubild vom Server (siehe board.ts).
export const PHOTO_PREFIX = 'f-';
export const isPhotoAvatar = (id: string | null | undefined) => !!id && id.startsWith(PHOTO_PREFIX);

// Profilbild: Plus-Tier (mit goldenem Rahmen), eigenes Foto (Plus), Abzeichen oder Anfangsbuchstabe.
export function Avatar({ id, name, size }: { id: string | null; name: string; size: number }) {
  if (isPhotoAvatar(id)) return <PhotoAvatar avatar={id!} name={name} size={size} />;
  // Foto eines anderen aus der Rangliste (vom Server)
  if (id?.startsWith('u:')) return <PhotoRing uri={remotePhoto(id)} name={name} size={size} />;
  // Foto noch nicht hochgeladen oder nicht erlaubt: Buchstabe im goldenen Plus-Rahmen
  if (id === 'p-letter') return <PhotoRing uri={null} name={name} size={size} />;
  const plus = id ? PLUS_AVATARS.find((a) => a.id === id) : undefined;
  if (plus) return <PlusAvatar size={size} id={plus.id} />;
  if (id && Object.prototype.hasOwnProperty.call(BADGE_TIER, id)) return <Medal id={id as BadgeId} size={size} />;
  const d = Math.round(size * 0.9);
  return (
    <View style={[styles.letter, { width: d, height: d, borderRadius: d / 2, margin: (size - d) / 2 }]}>
      <Text style={[styles.letterText, { fontSize: d * 0.42 }]}>{name[0]?.toUpperCase() ?? '?'}</Text>
    </View>
  );
}

// 'u:K7QX2M.ab12cd34' -> https://…/profilbild/K7QX2M?v=ab12cd34
function remotePhoto(id: string): string | null {
  const m = /^u:([A-Z0-9]{6})\.([a-f0-9]{1,12})$/.exec(id);
  return m ? `${SERVER_URL.replace(/\/$/, '')}/profilbild/${m[1]}?v=${m[2]}` : null;
}

// eigenes Foto: der gewählte Ausschnitt, sonst das ganze Fund-Foto
function PhotoAvatar({ avatar, name, size }: { avatar: string; name: string; size: number }) {
  const crop = useAvatarImage(avatar);
  const photo = useFindPhoto(findOfAvatar(avatar));
  return <PhotoRing uri={crop ?? photo} name={name} size={size} />;
}

// Foto im Kreis mit goldenem Plus-Ring und Stern (wie die Plus-Tiere); ohne Foto der Anfangsbuchstabe
function PhotoRing({ uri: src, name, size }: { uri: string | null; name: string; size: number }) {
  const [failed, setFailed] = useState(false);
  const uri = failed ? null : src;
  const ring = Math.max(2, Math.round(size * 0.06));
  const star = Math.round(size * 0.24);
  return (
    <View style={{ width: size, height: size }}>
      <View style={[styles.photoRing, { width: size, height: size, borderRadius: size / 2, padding: ring }]}>
        {uri ? (
          <Image source={{ uri }} onError={() => setFailed(true)} style={{ width: size - ring * 2, height: size - ring * 2, borderRadius: size / 2 }} />
        ) : (
          <View style={[styles.letter, { flex: 1, borderRadius: size / 2, borderWidth: 0 }]}>
            <Text style={[styles.letterText, { fontSize: size * 0.38 }]}>{name[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
      </View>
      <View style={[styles.photoStar, { width: star, height: star, borderRadius: star / 2 }]}>
        <Svg width={star * 0.7} height={star * 0.7} viewBox="48.5 48.5 9 9">
          <Path d="m53 49.6 1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z" fill="#fff" />
        </Svg>
      </View>
    </View>
  );
}

// Tier auf farbigem Grund mit goldenem Ring und kleinem Stern (alles selbst gezeichnet, keine Emojis)
export function PlusAvatar({ id, size }: { id: string; size: number }) {
  const g = `pa-${id}`;
  const [from, to] = PLUS_ANIMAL_BG[id] ?? ['#3E8A5C', '#123826'];
  const Art = PLUS_ANIMAL_ART[id];
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Defs>
          <RadialGradient id={`${g}-bg`} cx="0.35" cy="0.3" r="0.8">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </RadialGradient>
          <RadialGradient id={`${g}-ring`} cx="0.3" cy="0.25" r="0.9">
            <Stop offset="0" stopColor="#FFF2B8" />
            <Stop offset="0.5" stopColor="#E8B53A" />
            <Stop offset="1" stopColor="#9A6B12" />
          </RadialGradient>
          <ClipPath id={`${g}-clip`}>
            <Circle cx={32} cy={32} r={26} />
          </ClipPath>
        </Defs>
        <Circle cx={32} cy={32} r={30} fill={`url(#${g}-ring)`} />
        <Circle cx={32} cy={32} r={26} fill={`url(#${g}-bg)`} />
        {Art && <G clipPath={`url(#${g}-clip)`}>{Art()}</G>}
        {/* kleiner Plus-Stern unten rechts */}
        <Circle cx={53} cy={53} r={6.5} fill="#C98A10" stroke="#FFF2B8" strokeWidth={1.5} />
        <Path d="m53 49.6 1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z" fill="#fff" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  photoRing: { backgroundColor: '#E8B53A', borderWidth: 1, borderColor: '#9A6B12' },
  photoStar: { position: 'absolute', right: 0, bottom: 0, backgroundColor: '#C98A10', borderWidth: 1.5, borderColor: '#FFF2B8', alignItems: 'center', justifyContent: 'center' },
  letter: {
    borderWidth: 2,
    borderColor: colors.accentLight,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: { fontFamily: fonts.serifBold, color: colors.ink },
});
