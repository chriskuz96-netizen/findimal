import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Photo } from '../camera';
import { AdSheet, AdSlot } from '../components/AdSlot';
import { Explorer } from '../components/Explorer';
import { LimitCard } from '../components/LimitCard';
import { SwipeBack } from '../components/SwipeBack';
import { Find, useFindPhoto } from '../finds';
import { useI18n } from '../i18n';
import { Animal, hasDetails, identify, IdentifyResult, loadDetails } from '../identify';
import { breedGuessed, displayName } from '../names';
import { Progress, Reward } from '../progress';
import { colors, darkPalette, fonts, lightPalette, Palette, spacing } from '../theme';
import { usePlus } from '../plus';
import { bigAdDue, markBigAdShown } from '../usage';

type Props =
  // Neues Foto: wird bestimmt und (wenn ein Tier drauf ist) gespeichert
  | {
      photo: Photo;
      saved?: undefined;
      // replaceId: Fund, der mit einer neuen Bestimmung (z. B. nach zweitem Foto) ersetzt wird
      onIdentified: (animal: Animal, replaceId: string | null) => Promise<{ id: string; reward: Reward }>;
      morePhoto: (kind: 'camera' | 'library') => Promise<Photo | null>;
      onDetails: (id: string, animal: Animal) => void; // ausführlicher Steckbrief nachgeladen
      onPlace?: undefined;
      backLabel?: undefined;
      onBack: () => void;
    }
  // Fund aus der Sammlung: wird nur angezeigt
  | {
      photo?: undefined;
      saved: Find;
      onIdentified?: undefined;
      morePhoto?: undefined;
      onDetails: (id: string, animal: Animal) => void;
      onPlace: (id: string, place: string) => void; // Fundort nachträglich ändern
      backLabel?: string; // Text für den Knopf unten, z. B. "Zurück zur Sammlung"
      onBack: () => void;
    };

const MAX_PHOTOS = 3;

// "Gefunden am … in …" – der Ort lässt sich mit dem Stift ändern oder nachtragen
function FoundOn({ find, p, onPlace }: { find: Find; p: Palette; onPlace: (place: string) => void }) {
  const { t, locale } = useI18n();
  const [place, setPlace] = useState(find.place ?? '');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(place);
  const save = () => {
    const v = draft.trim();
    setEditing(false);
    if (v === place) return;
    setPlace(v);
    onPlace(v);
  };
  const date = new Date(find.date).toLocaleDateString(locale);
  if (editing) {
    return (
      <View style={styles.placeEdit}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t('res.placeHint')}
          placeholderTextColor={p.mute}
          maxLength={40}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={save}
          style={[styles.placeInput, { color: p.ink, borderColor: colors.accent }]}
          accessibilityLabel={t('res.placeHint')}
        />
        <Pressable onPress={save} hitSlop={10} style={styles.placeOk} accessibilityRole="button" accessibilityLabel={t('common.save')}>
          <Text style={styles.placeOkText}>✓</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <Pressable
      onPress={() => {
        setDraft(place);
        setEditing(true);
      }}
      hitSlop={8}
      accessibilityRole="button"
      style={styles.placeRow}
    >
      <Text style={[styles.foundOn, { color: p.mute, marginTop: 0 }]}>
        {place ? t('res.foundOnIn', { date, place }) : t('res.foundOn', { date })}
      </Text>
      {place ? (
        <Svg width={15} height={15} viewBox="0 0 24 24">
          <Path d="M4 20h4L19 9l-4-4L4 16v4Z" fill="none" stroke={p.moss} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M13.5 6.5l4 4" stroke={p.moss} strokeWidth={2} />
        </Svg>
      ) : (
        <Text style={[styles.placeAdd, { color: p.moss }]}>+ {t('res.placeAdd')}</Text>
      )}
    </Pressable>
  );
}

// Ergebnisseite: großes Foto, Name, Belohnung, Fun Fact und einklappbarer Steckbrief.
export function ResultScreen({ photo, saved, onIdentified, morePhoto, onDetails, onPlace, backLabel, onBack }: Props) {
  const p = useColorScheme() === 'dark' ? darkPalette : lightPalette;
  const insets = useSafeAreaInsets();
  const { t, lang, locale } = useI18n();
  const { plus } = usePlus();
  const [photos, setPhotos] = useState<Photo[]>(photo ? [photo] : []);
  const [result, setResult] = useState<IdentifyResult | null>(saved ? { ok: true, animal: saved.animal } : null);
  const [reward, setReward] = useState<Reward | null>(null);
  const [details, setDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  // halbseitige Anzeige ab dem 3. Foto des Tages: kommt beim Tippen auf „Weiter“
  const [bigAd, setBigAd] = useState<'due' | 'open' | null>(null);
  const findId = useRef<string | null>(null);
  const savedPhoto = useFindPhoto(saved?.id ?? '');

  const run = useCallback(
    (list: Photo[]) => {
      if (!onIdentified) return;
      setResult(null);
      identify(list, t, lang).then(async (r) => {
        setResult(r);
        if (r.ok && r.animal.tier_gefunden) {
          const res = await onIdentified(r.animal, findId.current);
          findId.current = res.id;
          setReward(res.reward);
          if (list.length === 1 && (await bigAdDue())) setBigAd('due');
        }
      });
    },
    // nur einmal pro Fotoliste bestimmen
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (photo) run([photo]);
  }, [photo, run]);

  // fresh = true: kein Tier erkannt, das neue Foto ersetzt das alte statt es zu ergänzen
  const addPhoto = async (kind: 'camera' | 'library', fresh = false) => {
    const extra = await morePhoto?.(kind);
    if (!extra) return;
    const list = fresh ? [extra] : [...photos, extra];
    setPhotos(list);
    run(list);
  };

  // Zurück/Weiter: ab dem 3. Foto des Tages kommt vorher einmal die halbseitige Anzeige
  const leave = () => {
    if (bigAd === 'due' && !plus) {
      markBigAdShown();
      setBigAd('open');
      return;
    }
    onBack();
  };

  const animal = result?.ok && result.animal.tier_gefunden ? result.animal : null;

  // Ausführlicher Steckbrief erst beim Aufklappen laden und beim Fund speichern
  const openDetails = async () => {
    const open = !details;
    setDetails(open);
    if (!open || !animal || hasDetails(animal) || loadingDetails) return;
    setLoadingDetails(true);
    const d = await loadDetails(animal, lang);
    setLoadingDetails(false);
    if (!d) return;
    const full = { ...animal, ...d };
    setResult({ ok: true, animal: full });
    const id = saved?.id ?? findId.current;
    if (id) onDetails?.(id, full);
  };
  const limited = !!result && !result.ok && !!result.limit; // Gratis-Fotos für heute aufgebraucht
  const mainUri = photo ? photo.uri : savedPhoto;
  const isNew = !!reward?.items.some((i) => i.id === 'newSpecies');
  const canAddPhoto = !!morePhoto && !!animal && photos.length < MAX_PHOTOS;
  const unsure = canAddPhoto && animal.sicherheit !== 'sicher';
  const noAnimal = !!morePhoto && !!result?.ok && !animal;

  return (
    // ohne eigene Hintergrundfarbe: beim Zurückwischen soll die Seite darunter sichtbar werden
    <View style={{ flex: 1 }}>
      {/* nach rechts wischen = zurück (nicht, solange die halbseitige Anzeige offen ist) */}
      <SwipeBack onBack={leave} enabled={bigAd !== 'open'}>
        <ScrollView
          style={{ flex: 1, backgroundColor: p.bg }}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {/* Großes Foto oben */}
          <View style={[styles.hero, { height: 300 + insets.top }]}>
            {mainUri && (
              <Image
                source={{ uri: mainUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                accessibilityLabel={t('res.yourPhoto')}
              />
            )}
            {!result && (
              <View style={styles.loading}>
                <Explorer size={64} />
                <Text style={styles.loadingTitle}>{t('res.wait')}</Text>
                <Text style={styles.loadingText}>{t('res.looking')}</Text>
                <ActivityIndicator color={colors.accentLight} style={{ marginTop: 10 }} />
              </View>
            )}
            {/* Zurück-Knopf oben links, damit man nicht nach unten scrollen muss */}
            <Pressable
              onPress={leave}
              accessibilityRole="button"
              hitSlop={10}
              style={({ pressed }) => [styles.back, { top: insets.top + 10, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.backText}>{t('pro.back')}</Text>
            </Pressable>
            {isNew && result && <Text style={[styles.stamp, { top: insets.top + 14 }]}>{t('res.new')}</Text>}
            {photos.length > 1 && (
              <View style={styles.thumbs}>
                {photos.slice(1).map((ph) => (
                  <Image key={ph.uri} source={{ uri: ph.uri }} style={styles.thumb} />
                ))}
              </View>
            )}
          </View>

          {/* Name und kurze Beschreibung */}
          {!limited && (
            <View style={[styles.card, styles.nameCard, { backgroundColor: p.card, borderColor: p.line }]}>
              {!result && <Text style={[styles.name, { color: p.ink }]}>{t('res.wait')}</Text>}
              {result && !result.ok && !result.limit && (
                <>
                  <Text style={[styles.name, { color: p.ink }]}>{t('res.oops')}</Text>
                  <Text style={[styles.body, { color: p.mute }]}>{result.message}</Text>
                </>
              )}
              {result?.ok && !animal && (
                <>
                  <Text style={[styles.name, { color: p.ink }]}>{t('res.noAnimal')}</Text>
                  <Text style={[styles.body, { color: p.mute }]}>{result.animal.hinweis || t('res.noAnimalHint')}</Text>
                </>
              )}
              {animal && (
                <>
                  {/* Haustiere: Rasse groß, Tierart klein darunter */}
                  <Text style={[styles.name, { color: p.ink }]}>{displayName(animal)}</Text>
                  {!!animal.rasse && (
                    <Text style={styles.breed}>
                      {animal.name}
                      {breedGuessed(animal) ? ` · ${t('res.breedGuess')}` : ''}
                    </Text>
                  )}
                  {!!animal.wissenschaftlicher_name && (
                    <Text style={[styles.sci, { color: p.mute }]}>{animal.wissenschaftlicher_name}</Text>
                  )}
                  <Certainty value={animal.sicherheit} />
                  {!!animal.kurzbeschreibung && (
                    <Text style={[styles.body, { color: p.ink }]}>{animal.kurzbeschreibung}</Text>
                  )}
                </>
              )}
              {saved && <FoundOn find={saved} p={p} onPlace={(place) => onPlace?.(saved.id, place)} />}
            </View>
          )}

          {result && !result.ok && !result.limit && (
            <Button label={t('res.retry')} onPress={() => run(photos)} p={p} filled />
          )}

          {/* Gratis-Fotos für heute aufgebraucht */}
          {limited && <LimitCard p={p} style={{ marginTop: -34 }} />}

          {/* Kein Tier erkannt: gleich ein neues Foto machen */}
          {noAnimal && (
            <View style={[styles.row, { marginHorizontal: spacing.gutter, marginTop: 12 }]}>
              <SmallButton label={t('res.secondCamera')} onPress={() => addPhoto('camera', true)} filled p={p} />
              <SmallButton label={t('res.secondPick')} onPress={() => addPhoto('library', true)} p={p} />
            </View>
          )}

          {/* KI nicht ganz sicher: zweites Foto direkt unter dem Ergebnis anbieten */}
          {unsure && (
            <View style={[styles.card, styles.second, { backgroundColor: p.card }]}>
              <Text style={[styles.cardTitle, { color: p.ink }]}>{t('res.secondTitle')}</Text>
              <Text style={[styles.body, { color: p.mute }]}>{t('res.secondText')}</Text>
              <View style={styles.row}>
                <SmallButton label={t('res.secondCamera')} onPress={() => addPhoto('camera')} filled p={p} />
                <SmallButton label={t('res.secondPick')} onPress={() => addPhoto('library')} p={p} />
              </View>
            </View>
          )}

          {/* KI sicher: trotzdem leise die Möglichkeit für ein weiteres Foto */}
          {canAddPhoto && !unsure && (
            <Pressable onPress={() => addPhoto('camera')} accessibilityRole="button" hitSlop={8} style={styles.notRight}>
              <Text style={[styles.notRightText, { color: p.moss }]}>{t('res.notRight')}</Text>
            </Pressable>
          )}

          {/* Belohnung */}
          {reward && animal && <RewardCard reward={reward} photos={photos.length} p={p} />}

          {/* Wusstest du? */}
          {animal && !!animal.wusstest_du && (
            <View style={[styles.card, styles.fun, { backgroundColor: 'rgba(232,131,58,0.12)' }]}>
              <Explorer size={40} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: p.ink }]}>{t('f.fun')}</Text>
                <Text style={[styles.body, { color: p.ink, marginTop: 2 }]}>{animal.wusstest_du}</Text>
              </View>
            </View>
          )}

          {/* Anzeigen-Platz 1: nach dem Ergebnis */}
          {animal && <AdSlot p={p} placement="result" />}

          {/* Steckbrief zum Aufklappen */}
          {animal && (
            <>
              <Pressable
                onPress={openDetails}
                style={[styles.toggle, { borderColor: p.line }]}
                accessibilityRole="button"
              >
                <Text style={[styles.toggleText, { color: p.moss }]}>
                  {details ? t('res.hideDetails') : t('res.showDetails')} {details ? '▴' : '▾'}
                </Text>
              </Pressable>
              {details && loadingDetails && <ActivityIndicator color={colors.accent} style={{ marginTop: 12 }} />}
              {details && !loadingDetails && hasDetails(animal) && (
                <>
                  <Details animal={animal} p={p} />
                  {/* Anzeigen-Platz 2: im aufgeklappten Steckbrief */}
                  <AdSlot p={p} placement="details" />
                </>
              )}
              {details && !loadingDetails && !hasDetails(animal) && (
                <Text
                  style={[
                    styles.body,
                    {
                      color: p.mute,
                      marginHorizontal: spacing.gutter,
                      marginTop: 10,
                    },
                  ]}
                >
                  {t('res.detailsFailed')}
                </Text>
              )}
            </>
          )}

          {/* dezente Erinnerung ans Findimal-Ehrenwort */}
          <Text style={[styles.respect, { color: p.mute }]}>🐾 {t('res.respect')}</Text>
          {/* Neues Foto: weiter zur Kamera. Gespeicherter Fund: zurück, woher man kam */}
          <Button label={backLabel ?? t('res.continue')} onPress={leave} p={p} filled={!!result} />
        </ScrollView>

      </SwipeBack>
      {/* Halbseitige Anzeige ab dem 3. Foto des Tages, nach „Weiter“ – danach geht es zurück */}
      {bigAd === 'open' && <AdSheet p={p} onClose={onBack} />}
    </View>
  );
}

// Schild: wie sicher die Bestimmung ist
function Certainty({ value }: { value: Animal['sicherheit'] }) {
  const { t } = useI18n();
  const color = value === 'sicher' ? '#3E9A63' : value === 'wahrscheinlich' ? '#C9A24B' : colors.accent;
  const label = t(value === 'sicher' ? 'res.sure' : value === 'wahrscheinlich' ? 'res.likely' : 'res.unsure');
  return (
    <View style={[styles.certainty, { backgroundColor: `${color}22` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.certaintyText, { color }]}>{label}</Text>
    </View>
  );
}

// Belohnungs-Karte: XP mit Aufschlüsselung und Stufenbalken, der sich füllt
function RewardCard({ reward, photos, p }: { reward: Reward; photos: number; p: Palette }) {
  const { t } = useI18n();
  const pop = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const share = (pr: Progress) => (pr.nextLevelXp ? (pr.xp - pr.levelStart) / (pr.nextLevelXp - pr.levelStart) : 1);
  const from = reward.levelUp ? 0 : share(reward.before);
  const to = share(reward.after);

  useEffect(() => {
    pop.setValue(0);
    bar.setValue(from);
    Animated.sequence([
      Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(bar, {
        toValue: to,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [reward, from, to, pop, bar]);

  const labels = {
    find: t('rew.find'),
    newSpecies: t('rew.newSpecies'),
    season: t('rew.seasonShort'),
    week: t('rew.week'),
    badge: t('rew.badge'),
  };
  const lvl = reward.after.level;
  const lvlName = t(`level.${lvl - 1}` as 'level.0');

  return (
    <View style={[styles.card, styles.reward, { backgroundColor: p.card }]}>
      <View style={styles.rewardHead}>
        <Text style={[styles.cardTitle, { color: p.ink }]}>{t('rew.title')}</Text>
        <Animated.Text
          style={[
            styles.rewardXp,
            {
              opacity: pop,
              transform: [
                {
                  scale: pop.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 1],
                  }),
                },
              ],
            },
          ]}
        >
          +{reward.total} XP
        </Animated.Text>
      </View>
      <View style={styles.chips}>
        {reward.items.map((i) => (
          <View key={i.badge ?? i.id} style={styles.chip}>
            <Text style={styles.chipText}>
              {i.badge ? `${labels.badge}: ${t(`badge.${i.badge}` as 'badge.first')}` : labels[i.id]} +{i.xp}
            </Text>
          </View>
        ))}
      </View>
      {reward.levelUp && <Text style={styles.levelUp}>{t('rew.levelUp', { n: lvl, name: lvlName })}</Text>}
      <View style={styles.levelRow}>
        <Text style={[styles.levelText, { color: p.ink }]}>{t('ch.levelLine', { n: lvl, name: lvlName })}</Text>
        <Text style={[styles.levelXp, { color: p.mute }]}>
          {reward.after.xp}
          {reward.after.nextLevelXp ? ` / ${reward.after.nextLevelXp}` : ''} XP
        </Text>
      </View>
      <View style={[styles.bar, { backgroundColor: p.line }]}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: bar.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      {photos > 1 && <Text style={[styles.small, { color: p.mute }]}>{t('rew.updated', { n: photos })}</Text>}
    </View>
  );
}

// Ausführlicher Steckbrief
function Details({ animal, p }: { animal: Animal; p: Palette }) {
  const { t } = useI18n();
  const rows: [string, string | undefined][] = [
    [t('f.class'), animal.klasse],
    [t('f.family'), animal.familie],
    [t('f.size'), animal.groesse],
    [t('f.active'), animal.aktiv],
    [t('f.habitat'), animal.lebensraum],
    [t('f.range'), animal.verbreitung],
  ];
  const sections: [string, string | undefined][] = [
    [t('f.role'), animal.rolle_in_der_natur],
    [t('f.food'), animal.nahrung],
    [t('f.predators'), animal.fressfeinde],
  ];
  return (
    <View style={[styles.card, { backgroundColor: p.card, borderColor: p.line, borderWidth: 1 }]}>
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <View key={k} style={styles.kv}>
            <Text style={[styles.k, { color: p.mute }]}>{k}</Text>
            <Text style={[styles.v, { color: p.ink }]}>{v}</Text>
          </View>
        ))}
      {!!animal.gefaehrdung && (
        <View style={[styles.certainty, { backgroundColor: 'rgba(47,107,71,0.14)', marginTop: 10 }]}>
          <View style={[styles.dot, { backgroundColor: p.moss }]} />
          <Text style={[styles.certaintyText, { color: p.moss }]}>{animal.gefaehrdung}</Text>
        </View>
      )}
      {sections
        .filter(([, v]) => v)
        .map(([h, v]) => (
          <View key={h}>
            <Text style={[styles.h4, { color: p.ink }]}>{h}</Text>
            <Text style={[styles.body, { color: p.ink, marginTop: 0 }]}>{v}</Text>
          </View>
        ))}
      <Text style={[styles.small, { color: p.mute, marginTop: 12 }]}>{t('res.ai')}</Text>
    </View>
  );
}

function Button({ label, onPress, filled, p }: { label: string; onPress: () => void; filled: boolean; p: Palette }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        filled ? { backgroundColor: p.button } : { borderWidth: 1.5, borderColor: p.line },
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.btnText, { color: filled ? colors.white : p.ink }]}>{label}</Text>
    </Pressable>
  );
}

function SmallButton({
  label,
  onPress,
  filled,
  p,
}: {
  label: string;
  onPress: () => void;
  filled?: boolean;
  p: Palette;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.smallBtn,
        filled ? { backgroundColor: colors.accent, borderColor: colors.accent } : { borderColor: p.line },
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Text style={[styles.smallBtnText, { color: filled ? colors.ink : p.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#17462F',
    borderBottomLeftRadius: spacing.radiusHero,
    borderBottomRightRadius: spacing.radiusHero,
    overflow: 'hidden',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12,42,28,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
  },
  loadingTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 22,
    color: colors.white,
    marginTop: 10,
  },
  loadingText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.accentLight,
    marginTop: 2,
  },
  back: {
    position: 'absolute',
    left: 14,
    zIndex: 3,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 99,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  backText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.white },
  stamp: {
    position: 'absolute',
    right: 14,
    borderWidth: 2,
    borderColor: colors.coral,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    color: colors.coral,
    fontFamily: fonts.serifBold,
    fontSize: 17,
    paddingHorizontal: 10,
    overflow: 'hidden',
    transform: [{ rotate: '7deg' }],
  },
  thumbs: {
    position: 'absolute',
    left: 14,
    bottom: 46,
    flexDirection: 'row',
    gap: 6,
  },
  thumb: {
    width: 46,
    height: 46,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.white,
  },
  card: {
    marginHorizontal: spacing.gutter,
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
  },
  nameCard: {
    marginTop: -34,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  name: { fontFamily: fonts.serifBold, fontSize: 25, lineHeight: 29 },
  breed: {
    fontFamily: fonts.sansBold,
    fontSize: 17,
    color: colors.accent,
    marginTop: 2,
  },
  sci: {
    fontFamily: fonts.sans,
    fontStyle: 'italic',
    fontSize: 14,
    marginTop: 1,
  },
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, marginTop: 8 },
  foundOn: { fontFamily: fonts.sans, fontSize: 13, marginTop: 10 },
  respect: { fontFamily: fonts.sans, fontSize: 12.5, textAlign: 'center', marginTop: 16, marginHorizontal: spacing.gutter },
  placeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  placeAdd: { fontFamily: fonts.sansBold, fontSize: 13 },
  placeEdit: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  placeInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, borderBottomWidth: 2, paddingVertical: 4 },
  placeOk: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOkText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  certainty: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 99,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  certaintyText: { fontFamily: fonts.sansBold, fontSize: 13 },
  second: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.accent },
  notRight: { alignSelf: 'center', marginTop: 12 },
  notRightText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  cardTitle: { fontFamily: fonts.serifBold, fontSize: 18 },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  smallBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
  },
  smallBtnText: { fontFamily: fonts.sansBold, fontSize: 15 },
  reward: { borderWidth: 2, borderColor: colors.accent },
  rewardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardXp: { fontFamily: fonts.serifBold, fontSize: 30, color: colors.accent },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    backgroundColor: 'rgba(232,131,58,0.16)',
    borderRadius: 99,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  chipText: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: colors.accentDark,
  },
  levelUp: {
    fontFamily: fonts.serifBold,
    fontSize: 17,
    color: colors.accent,
    marginTop: 12,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 14,
  },
  levelText: { fontFamily: fonts.sansBold, fontSize: 14 },
  levelXp: { fontFamily: fonts.sans, fontSize: 13 },
  bar: { height: 10, borderRadius: 9, marginTop: 6, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 9 },
  small: { fontFamily: fonts.sans, fontSize: 12, marginTop: 8 },
  fun: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  toggle: {
    marginHorizontal: spacing.gutter,
    marginTop: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleText: { fontFamily: fonts.sansBold, fontSize: 15 },
  kv: { flexDirection: 'row', gap: 14, marginBottom: 6 },
  k: { width: 96, fontFamily: fonts.sans, fontSize: 14 },
  v: { flex: 1, fontFamily: fonts.sansBold, fontSize: 14 },
  h4: { fontFamily: fonts.serifBold, fontSize: 15, marginTop: 12 },
  btn: {
    marginHorizontal: spacing.gutter,
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  btnText: { fontFamily: fonts.sansBold, fontSize: 17 },
});
