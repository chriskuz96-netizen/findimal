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
import { Animal, cancelIdentify, hasDetails, identify, IdentifyCancel, IdentifyResult, loadDetails, newCancel } from '../identify';
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
      // shot: das Foto, das bestimmt wurde (wird beim neuen Fund gespeichert)
      onIdentified: (animal: Animal, replaceId: string | null, shot: Photo) => Promise<{ id: string; reward: Reward }>;
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
const CANCEL_AFTER = 8; // Sekunden, bis „Abbrechen“ erscheint (nicht vorschnell abbrechen)

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

  // Laufende Bestimmung (zum Abbrechen) und Stand davor (bei einem weiteren Foto)
  const pending = useRef<IdentifyCancel | null>(null);
  const before = useRef<{ photos: Photo[]; result: IdentifyResult | null } | null>(null);

  const run = useCallback(
    (list: Photo[]) => {
      if (!onIdentified) return;
      setResult(null);
      const c = newCancel();
      pending.current = c;
      identify(list, t, lang, c).then(async (r) => {
        // abgebrochen oder von einer neueren Bestimmung überholt: nichts anzeigen, nichts speichern
        if (pending.current !== c || (!r.ok && r.cancelled)) return;
        pending.current = null;
        before.current = null;
        setResult(r);
        if (r.ok && r.animal.tier_gefunden) {
          const res = await onIdentified(r.animal, findId.current, list[0]);
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
  const adding = useRef(false); // kein zweites Foto, solange eins noch geholt wird
  const addPhoto = async (kind: 'camera' | 'library', fresh = false) => {
    if (adding.current) return;
    adding.current = true;
    const extra = await morePhoto?.(kind).finally(() => (adding.current = false));
    if (!extra) return;
    const list = fresh ? [extra] : [...photos, extra];
    before.current = { photos, result };
    setPhotos(list);
    run(list);
  };

  // Abbrechen während der Bestimmung: zählt nicht als Gratis-Foto.
  // Beim ersten Foto geht es zurück, bei einem weiteren Foto bleibt das bisherige Ergebnis.
  const cancel = () => {
    const c = pending.current;
    if (!c) return;
    pending.current = null;
    cancelIdentify(c);
    const prev = before.current;
    before.current = null;
    if (prev) {
      setPhotos(prev.photos);
      setResult(prev.result);
    } else {
      onBack();
    }
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
  const mainUri = photo ? (photos[0]?.uri ?? photo.uri) : savedPhoto; // nach "neues Foto" das neue zeigen
  const isNew = !!reward?.items.some((i) => i.id === 'newSpecies');
  const canAddPhoto = !!morePhoto && !!animal && photos.length < MAX_PHOTOS;
  const unsure = canAddPhoto && animal.sicherheit !== 'sicher';
  const noAnimal = !!morePhoto && !!result?.ok && !animal;
  const busy = !!onIdentified && !result; // wird gerade bestimmt: nur Abbrechen möglich
  // Wartezeit in Sekunden: längeres Warten bekommt neue Texte, Abbrechen erscheint erst später
  const [waited, setWaited] = useState(0);
  useEffect(() => {
    if (!busy) return setWaited(0);
    const start = Date.now();
    const timer = setInterval(() => setWaited(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [busy]);
  const waitText =
    waited >= 35 ? t('res.looking5') : waited >= 22 ? t('res.looking4') : waited >= 12 ? t('res.looking3') : waited >= 6 ? t('res.looking2') : t('res.looking');
  const canCancel = busy && waited >= CANCEL_AFTER;

  return (
    // ohne eigene Hintergrundfarbe: beim Zurückwischen soll die Seite darunter sichtbar werden
    <View style={{ flex: 1 }}>
      {/* nach rechts wischen = zurück (nicht, solange die halbseitige Anzeige offen ist) */}
      <SwipeBack onBack={leave} enabled={bigAd !== 'open' && !busy}>
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
                <Text style={styles.loadingText}>{waitText}</Text>
                <ActivityIndicator color={colors.accentLight} style={{ marginTop: 10 }} />
                {/* klein und erst nach ein paar Sekunden, damit man nicht vorschnell abbricht */}
                {canCancel && (
                  <Pressable onPress={cancel} accessibilityRole="button" hitSlop={12} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                  </Pressable>
                )}
                {canCancel && !plus && <Text style={styles.cancelHint}>{t('res.cancelHint')}</Text>}
              </View>
            )}
            {/* Zurück-Knopf oben links, damit man nicht nach unten scrollen muss (nicht während der Bestimmung) */}
            {!busy && (
              <Pressable
                onPress={leave}
                accessibilityRole="button"
                hitSlop={10}
                style={({ pressed }) => [styles.back, { top: insets.top + 10, opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.backText}>{t('pro.back')}</Text>
              </Pressable>
            )}
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
          {/* während der Bestimmung steht alles oben im Foto */}
          {!limited && !busy && (
            <View style={[styles.card, styles.nameCard, { backgroundColor: p.card, borderColor: p.line }]}>
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
          {!busy && <Button label={backLabel ?? t('res.continue')} onPress={leave} p={p} filled={!!result} />}
        </ScrollView>

      </SwipeBack>
      {/* Belohnung: kurz unten einblenden, Balken füllt sich, dann wieder weg */}
      {reward && animal && (
        <RewardToast key={`${reward.after.xp}-${photos.length}`} reward={reward} photos={photos.length} p={p} bottom={insets.bottom} />
      )}
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
function RewardToast({ reward, photos, p, bottom }: { reward: Reward; photos: number; p: Palette; bottom: number }) {
  const { t } = useI18n();
  const pop = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const count = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(1)).current;
  const share = (pr: Progress) => (pr.nextLevelXp ? (pr.xp - pr.levelStart) / (pr.nextLevelXp - pr.levelStart) : 1);
  const from = share(reward.before);
  const to = share(reward.after);
  // Beim Stufenaufstieg zeigt der Balken erst die alte Stufe, dann die neue
  const [shownLevel, setShownLevel] = useState(reward.levelUp ? reward.before.level : reward.after.level);
  const [shownXp, setShownXp] = useState(reward.before.xp);
  const [leveled, setLeveled] = useState(false);
  // alter Stand im Balken (bei neuer Stufe: 0); alles darüber ist neu und leuchtet hell
  const [base, setBase] = useState(reward.levelUp ? 0 : share(reward.before));
  // Ein- und Ausblenden von unten
  const slide = useRef(new Animated.Value(0)).current;
  const [gone, setGone] = useState(false);
  const hide = () =>
    Animated.timing(slide, { toValue: 0, duration: 300, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() =>
      setGone(true),
    );

  useEffect(() => {
    slide.setValue(0);
    Animated.timing(slide, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const away = setTimeout(hide, reward.levelUp ? 6000 : 4800);
    return () => clearTimeout(away);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reward]);

  useEffect(() => {
    pop.setValue(0);
    bar.setValue(from);
    count.setValue(reward.before.xp);
    setShownLevel(reward.levelUp ? reward.before.level : reward.after.level);
    setLeveled(false);
    const id = count.addListener(({ value }) => setShownXp(Math.round(value)));
    const fill = (toValue: number, duration: number) =>
      Animated.timing(bar, { toValue, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    // XP zählen hoch, während sich der Balken füllt
    const counting = Animated.timing(count, {
      toValue: reward.after.xp,
      duration: reward.levelUp ? 2400 : 2000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    const filling = reward.levelUp
      ? Animated.sequence([
          fill(1, 1100),
          Animated.timing(bar, { toValue: 0, duration: 0, useNativeDriver: false }),
          fill(to, 1200),
        ])
      : fill(to, 2000);
    // das neue Stück pulsiert zweimal, damit man sieht, was dazugekommen ist
    glow.setValue(0.6);
    Animated.sequence([
      Animated.delay(900),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 380, useNativeDriver: false }),
          Animated.timing(glow, { toValue: 0.55, duration: 380, useNativeDriver: false }),
        ]),
        { iterations: 3 },
      ),
      Animated.timing(glow, { toValue: 1, duration: 300, useNativeDriver: false }),
    ]).start();
    Animated.sequence([
      Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.delay(250),
      Animated.parallel([counting, filling]),
    ]).start();
    // Stufenwechsel ungefähr dann, wenn der Balken voll ist
    setBase(from);
    const timer = reward.levelUp
      ? setTimeout(() => {
          setShownLevel(reward.after.level);
          setLeveled(true);
          setBase(0);
        }, 1700)
      : null;
    return () => {
      count.removeListener(id);
      if (timer) clearTimeout(timer);
    };
  }, [reward, from, to, pop, bar, count, glow]);

  const labels = {
    find: t('rew.find'),
    newSpecies: t('rew.newSpecies'),
    season: t('rew.seasonShort'),
    week: t('rew.week'),
    badge: t('rew.badge'),
  };
  const lvl = reward.after.level;
  const lvlName = t(`level.${shownLevel - 1}` as 'level.0');
  const maxLevel = !reward.after.nextLevelXp && shownLevel === lvl;

  if (gone) return null;
  // gleiches Aussehen wie der Kopf der Challenges-Seite
  return (
    <Animated.View
      style={[
        styles.toast,
        {
          bottom: bottom + 14,
          opacity: slide,
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [140, 0] }) }],
        },
      ]}
    >
      <Pressable onPress={hide} accessibilityRole="button">
        <View style={styles.tHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tSmall}>{t('ch.level', { n: shownLevel })}</Text>
            <Text style={styles.tName} numberOfLines={1}>
              {lvlName}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.tXp}>{shownXp} XP</Text>
            <Animated.Text style={[styles.tGain, { opacity: pop }]}>+{reward.total} XP</Animated.Text>
          </View>
        </View>
        <View style={styles.tRow}>
          <View style={styles.tDot}>
            <Text style={styles.tDotText}>{shownLevel}</Text>
          </View>
          <View style={styles.tBar}>
            {/* hinten: hell leuchtend bis zum neuen Stand – vorne: der alte Stand in Orange */}
            <Animated.View
              style={[
                styles.tGlow,
                { opacity: glow, width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
              ]}
            />
            <View style={[styles.barFill, styles.tBase, { width: `${Math.round(base * 100)}%` }]} />
          </View>
          {!maxLevel && (
            <View style={[styles.tDot, styles.tDotNext]}>
              <Text style={[styles.tDotText, { color: colors.white }]}>{shownLevel + 1}</Text>
            </View>
          )}
        </View>
        <Text style={styles.tSub}>
          {leveled
            ? t('rew.levelUp', { n: lvl, name: lvlName })
            : reward.items
                .map((i) => `${i.badge ? `${labels.badge}: ${t(`badge.${i.badge}` as 'badge.first')}` : labels[i.id]} +${i.xp}`)
                .join(' · ')}
        </Text>
        {photos > 1 && <Text style={[styles.tSub, { marginTop: 2 }]}>{t('rew.updated', { n: photos })}</Text>}
      </Pressable>
    </Animated.View>
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
  loadingTitle: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.white, marginTop: 10 },
  loadingText: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.accentLight,
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 28,
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
  cancelBtn: { marginTop: 14 },
  cancelText: { fontFamily: fonts.sans, fontSize: 13, color: colors.white, opacity: 0.6, textDecorationLine: 'underline' },
  cancelHint: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.white, opacity: 0.45, marginTop: 3 },
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
  toast: {
    position: 'absolute',
    left: spacing.gutter,
    right: spacing.gutter,
    borderRadius: 20,
    backgroundColor: '#123826',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tSmall: { fontFamily: fonts.sansBold, fontSize: 11.5, color: colors.accentLight, textTransform: 'uppercase', letterSpacing: 0.6 },
  tName: { fontFamily: fonts.serifBold, fontSize: 20, color: colors.white },
  tXp: { fontFamily: fonts.serifBold, fontSize: 19, color: colors.accentLight },
  tGain: { fontFamily: fonts.sansBold, fontSize: 12.5, color: '#9FE0B4' },
  tRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  tDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  tDotNext: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)' },
  tDotText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.ink },
  tBar: { flex: 1, height: 8, borderRadius: 6, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.15)' },
  tGlow: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 6, backgroundColor: '#FFD97A' },
  tBase: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  tSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.white, opacity: 0.8, marginTop: 6 },
  bar: { flex: 1, height: 10, borderRadius: 9, overflow: 'hidden' },
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
