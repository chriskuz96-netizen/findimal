import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { NunitoSans_500Medium, NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Photo, pickPhoto, takePhoto } from './src/camera';
import { AppLogo } from './src/components/AppLogo';
import { PromiseSheet } from './src/components/PromiseSheet';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { Tab, TabBar } from './src/components/TabBar';
import { codeFromUrl } from './src/board';
import { LimitSheet, watchVideo } from './src/components/LimitCard';
import { bonusPhotos, FREE_PHOTOS_PER_DAY, usedToday, VIDEOS_PER_DAY, videosToday } from './src/usage';
import { addFind, Find, loadFinds, removeFind, speciesKey, translateFindTexts, updateFind, updatePlace } from './src/finds';
import { translateAnimal } from './src/identify';
import { LangProvider, useI18n } from './src/i18n';
import { disableTips, enableTips, loadTips, onTipOpened, planTips } from './src/notify';
import { loadZone } from './src/zone';
import { isPlusAvatar, PlusProvider, usePlus } from './src/plus';
import { loadSeenBadges, saveSeenBadges } from './src/seenBadges';
import { computeProgress, computeReward, dayKey } from './src/progress';
import { answerQuiz, correctAnswers, loadQuiz, QuizLog } from './src/quiz';
import { ChallengesScreen } from './src/screens/ChallengesScreen';
import { CollectionScreen } from './src/screens/CollectionScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SeasonScreen } from './src/screens/SeasonScreen';
import { RegionScreen } from './src/screens/RegionScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { StartScreen } from './src/screens/StartScreen';
import { loadAvatar, loadBestRank, loadMaxFriends, loadName, loadRegion, resetAll, saveAvatar, saveBestRank, saveMaxFriends, saveName, saveRegion } from './src/storage';
import { colors, fonts } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <LangProvider>
        <PlusProvider>
          <ErrorBoundary>
            <Main />
          </ErrorBoundary>
        </PlusProvider>
      </LangProvider>
    </SafeAreaProvider>
  );
}

function Main() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    NunitoSans_500Medium,
    NunitoSans_700Bold,
  });
  const { t, lang } = useI18n();
  const { plus } = usePlus();
  // undefined = wird noch geladen, null = noch kein Name gespeichert
  const [name, setName] = useState<string | null | undefined>(undefined);
  // undefined = wird geladen, null = noch nicht gefragt, '' = übersprungen
  const [region, setRegion] = useState<string | null | undefined>(undefined);
  const [askRegion, setAskRegion] = useState(false);
  const [finds, setFinds] = useState<Find[]>([]);
  const [tab, setTab] = useState<Tab>('start');
  // Neues Foto (wird bestimmt) oder geöffneter Fund aus der Sammlung
  const [photo, setPhoto] = useState<Photo | null>(null);
  // Gratis-Fotos, die heute noch übrig sind (der Server zählt verbindlich)
  const [freeLeft, setFreeLeft] = useState(FREE_PHOTOS_PER_DAY);
  // Videos für Extra-Fotos, die heute noch gehen (Hinweis unter der Kamera)
  const [videosLeft, setVideosLeft] = useState(VIDEOS_PER_DAY);
  const refreshFreeLeft = () => {
    // Gratis-Fotos von heute plus Extra-Fotos aus Einladungen
    Promise.all([usedToday(), bonusPhotos()]).then(([u, b]) => setFreeLeft(Math.max(0, FREE_PHOTOS_PER_DAY - u) + b));
    videosToday().then((v) => setVideosLeft(Math.max(0, VIDEOS_PER_DAY - v)));
  };
  useEffect(() => {
    refreshFreeLeft();
  }, []);
  // Beim ersten Öffnen der App (nach Name und Ort) einmal das Findimal-Ehrenwort (Tiere nicht stören)
  const [promised, setPromised] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem('findimal-promise')
      .then((v) => setPromised(v === '1'))
      .catch(() => {});
  }, []);
  // Vor dem Fotografieren prüfen, damit niemand umsonst ein Foto macht
  // Solange ein Foto ausgewählt und vorbereitet wird, startet kein zweites (sonst überholen
  // sich zwei Fotos und das alte Ergebnis platzt später ins neue). Bis es fertig ist, läuft ein Ladekreis.
  const photoBusy = useRef(false);
  const [limitOpen, setLimitOpen] = useState(false); // Fenster „Gratis-Fotos aufgebraucht“
  const [preparing, setPreparing] = useState(false);
  const startPhoto = async (get: (onPicked: (b: boolean) => void) => Promise<Photo | null>) => {
    if (photoBusy.current) return;
    photoBusy.current = true;
    try {
      if (!plus && (await usedToday()) >= FREE_PHOTOS_PER_DAY && (await bonusPhotos()) <= 0) return setLimitOpen(true);
      const p = await get(setPreparing);
      if (p) setPhoto(p);
    } finally {
      photoBusy.current = false;
      setPreparing(false);
    }
  };
  const [openFind, setOpenFind] = useState<Find | null>(null);
  // Aktuelle Liste auch in Rückrufen, die später fertig werden
  const findsRef = useRef<Find[]>([]);
  findsRef.current = finds;
  const [quiz, setQuiz] = useState<QuizLog>({});
  const [avatar, setAvatar] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  // Bester Platz in der weltweiten Rangliste (Abzeichen Top 100/50/10/Nr. 1 bleiben)
  const [bestRank, setBestRank] = useState<number | null>(null);
  const [maxFriends, setMaxFriends] = useState(0);
  const quizRef = useRef<QuizLog>({});
  quizRef.current = quiz;

  // true, sobald Funde, Quiz und Rangliste geladen sind
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    loadName().then(setName);
    loadRegion().then(setRegion);
    loadAvatar().then(setAvatar);
    Promise.all([
      loadFinds().then(setFinds),
      loadQuiz().then(setQuiz),
      loadBestRank().then(setBestRank),
      loadMaxFriends().then(setMaxFriends),
    ]).finally(() => setLoaded(true));
  }, []);

  // Sprachwechsel: gespeicherte Funde einmal im Hintergrund übersetzen (nacheinander, sehr günstig).
  // Alte Funde ohne Sprache wurden auf Deutsch bestimmt.
  const translating = useRef(false);
  const langRef = useRef(lang);
  langRef.current = lang;
  useEffect(() => {
    if (!loaded || translating.current) return;
    translating.current = true;
    (async () => {
      // immer in die gerade eingestellte Sprache (falls währenddessen nochmal gewechselt wird)
      for (;;) {
        const target = langRef.current;
        const f = findsRef.current.find((x) => (x.lang ?? 'de') !== target);
        if (!f) break;
        const texts = await translateAnimal(f.animal, target);
        if (!texts) break; // offline o. Ä.: beim nächsten Start nochmal
        const next = await translateFindTexts(findsRef.current, f.id, texts, target);
        findsRef.current = next; // sofort, damit der nächste Durchlauf den neuen Stand sieht
        setFinds(next);
      }
      translating.current = false;
    })();
  }, [lang, loaded]);

  // Natur-Tipps: bei jedem Start (und Sprachwechsel) die nächsten Wochen neu einplanen;
  // Tippen auf einen Tipp öffnet die Saison-Seite
  useEffect(() => {
    planTips(lang);
  }, [lang, region]);
  useEffect(
    () =>
      onTipOpened(() => {
        setOpenFind(null);
        setShowProfile(false);
        setTab('season');
      }),
    [],
  );
  // Nach dem ersten Fund einmal fragen, ob man Natur-Tipps möchte
  const askTips = async () => {
    if (findsRef.current.length < 1 || (await loadTips()) !== null || (await loadZone()) === 'other') return;
    Alert.alert(t('tips.askTitle'), t('tips.askText'), [
      { text: t('tips.no'), style: 'cancel', onPress: () => disableTips() },
      { text: t('tips.yes'), onPress: () => enableTips(lang) },
    ]);
  };

  // Einladungslink eines Freundes: Code merken und zur Rangliste (Challenges) wechseln.
  // findimal://kamera (z. B. vom Knopf im Kontrollzentrum): direkt die Kamera öffnen.
  const [invite, setInvite] = useState<string | null>(null);
  const [wantCamera, setWantCamera] = useState(false);
  useEffect(() => {
    const handle = (url: string | null) => {
      if (url) {
        const { hostname, path } = Linking.parse(url);
        if (hostname === 'kamera' || path === 'kamera') return setWantCamera(true);
      }
      const code = codeFromUrl(url);
      if (!code) return;
      setInvite(code);
      setOpenFind(null);
      setShowProfile(false);
      setTab('challenges');
    };
    Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', (e) => handle(e.url));
    return () => sub.remove();
  }, []);

  // Kamera öffnen, sobald die App fertig geladen ist (Name und Region bekannt)
  useEffect(() => {
    if (!wantCamera || !fontsLoaded || !name || region === null || region === undefined || photo) return;
    setWantCamera(false);
    setOpenFind(null);
    setShowProfile(false);
    setTab('start');
    startPhoto((cb) => takePhoto(t, cb));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantCamera, fontsLoaded, name, region, photo]);

  // Punkte, Stufe, Serie und Challenges – immer frisch berechnet
  const now = new Date();
  const progress = computeProgress(finds, correctAnswers(quiz), now, { bestRank, maxFriends });
  // Profilbild nur, solange das Abzeichen noch verdient ist (z. B. nach Löschen von Funden)
  // Plus-Tiere nur, solange Plus aktiv ist
  const avatarBadge =
    (plus && isPlusAvatar(avatar) ? avatar : null) ??
    progress.badges.find((b) => b.id === avatar && b.earned)?.id ??
    null;
  // Neue Abzeichen: verdient, aber noch nicht angesehen (Punkt im Menü, "NEU" in den Challenges)
  const earnedIds = progress.badges.filter((b) => b.earned).map((b) => b.id);
  const [seenBadges, setSeenBadges] = useState<string[] | null>(null);
  useEffect(() => {
    if (!loaded) return;
    loadSeenBadges().then((v) => {
      if (v) return setSeenBadges(v);
      // erstes Mal: alles bisher Verdiente gilt als gesehen
      saveSeenBadges(earnedIds);
      setSeenBadges(earnedIds);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);
  const freshBadges = seenBadges ? earnedIds.filter((id) => !seenBadges.includes(id)) : [];
  const seeBadges = (ids: string[]) => {
    if (!seenBadges || ids.every((id) => seenBadges.includes(id))) return;
    const next = [...seenBadges, ...ids.filter((id) => !seenBadges.includes(id))];
    saveSeenBadges(next);
    setSeenBadges(next);
  };
  const chooseAvatar = (id: string) => {
    saveAvatar(id);
    setAvatar(id);
  };

  // Solange Schriften oder Name laden: Startbild mit dem Findimal-Symbol.
  if (!fontsLoaded || name === undefined || region === undefined) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.skyMid, alignItems: 'center', justifyContent: 'center' }}>
        <AppLogo size={140} />
      </View>
    );
  }

  if (!name) {
    return (
      <>
        <StatusBar style="auto" />
        <OnboardingScreen
          onDone={(newName) => {
            saveName(newName);
            setName(newName);
          }}
        />
      </>
    );
  }

  // Nach dem Namen einmal nach der Region fragen (oder wenn sie geändert werden soll)
  if (region === null || askRegion) {
    return (
      <>
        <StatusBar style="auto" />
        <RegionScreen
          onDone={(r) => {
            // "Später" beim Ändern behält die alte Region
            const next = askRegion && !r ? region ?? '' : r;
            saveRegion(next);
            setRegion(next);
            setAskRegion(false);
          }}
        />
      </>
    );
  }

  // Profil und Ergebnis liegen ÜBER den Tabs (die darunter gezeichnet bleiben).
  // So sieht man beim Zurückwischen die richtige Seite darunter statt einer weißen Fläche.
  const overlay = showProfile ? (
    <ProfileScreen
      name={name}
      region={region}
      avatar={avatarBadge}
      progress={progress}
      finds={finds}
      onBack={() => setShowProfile(false)}
      onRename={(n) => {
        saveName(n);
        setName(n);
      }}
      onChangeRegion={() => setAskRegion(true)}
      onSelectAvatar={chooseAvatar}
      onReset={async () => {
        await resetAll();
        setFinds([]);
        setQuiz({});
        setAvatar('');
        setBestRank(null);
        setMaxFriends(0);
        setRegion(null);
        setShowProfile(false);
        setTab('start');
        setName(null);
      }}
    />
  ) : photo ? (
    // key: jedes neue Foto bekommt eine frische Ergebnisseite
    <ResultScreen
      key={photo.uri}
      photo={photo}
      onIdentified={async (animal, replaceId, shot) => {
        const quizXp = correctAnswers(quizRef.current);
        // Stand ohne diesen Fund (bei einem zweiten Foto wird der alte Fund ersetzt)
        const others = findsRef.current.filter((f) => f.id !== replaceId);
        const before = computeProgress(others, quizXp, new Date(), { bestRank, maxFriends });
        const isNew = !others.some((f) => speciesKey(f.animal) === speciesKey(animal));
        let id = replaceId;
        let next: Find[];
        if (replaceId) {
          next = await updateFind(findsRef.current, replaceId, animal);
        } else {
          const added = await addFind(findsRef.current, shot, animal, region || undefined, lang);
          next = added.finds;
          id = added.id;
        }
        setFinds(next);
        const after = computeProgress(next, quizXp, new Date(), { bestRank, maxFriends });
        return { id: id!, reward: computeReward(before, after, isNew) };
      }}
      morePhoto={(kind) => (kind === 'camera' ? takePhoto(t) : pickPhoto())}
      onDetails={(id, animal) => updateFind(findsRef.current, id, animal).then(setFinds)}
      onBack={() => {
        // nach einem neuen Foto geht es zur Startseite mit der Kamera – fürs nächste Tier
        setPhoto(null);
        setTab('start');
        refreshFreeLeft();
        setTimeout(askTips, 600);
      }}
    />
  ) : openFind ? (
    <ResultScreen
      saved={openFind}
      onDetails={(id, animal) => updateFind(findsRef.current, id, animal).then(setFinds)}
      onPlace={(id, place) => updatePlace(findsRef.current, id, place).then(setFinds)}
      backLabel={t(tab === 'season' ? 'res.backSeason' : tab === 'collection' ? 'res.backCollection' : 'res.back')}
      onBack={() => setOpenFind(null)}
    />
  ) : null;

  return (
    <>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        {tab === 'start' && (
          <StartScreen
            name={name}
            region={region}
            onOpenProfile={() => setShowProfile(true)}
            xp={progress.xp}
            avatar={avatarBadge}
            freeLeft={freeLeft}
            videosLeft={videosLeft}
            onWatchVideo={() => watchVideo(t)}
            onTakePhoto={() => startPhoto((cb) => takePhoto(t, cb))}
            onPickPhoto={() => startPhoto((cb) => pickPhoto(cb))}
          />
        )}
        {tab === 'collection' && (
          <CollectionScreen
            finds={finds}
            onOpen={setOpenFind}
            onDelete={(f) => removeFind(findsRef.current, f.id).then(setFinds)}
            onDiscover={() => setTab('start')}
          />
        )}
        {tab === 'challenges' && (
          <ChallengesScreen
            active={!overlay}
            freshBadges={freshBadges}
            onSeeBadges={seeBadges}
            onOpenProfile={() => setShowProfile(true)}
            onBonus={refreshFreeLeft}
            progress={progress}
            quiz={quiz}
            onAnswer={(q, i) => answerQuiz(quizRef.current, q, i).then(setQuiz)}
            avatar={avatarBadge ?? ''}
            name={name}
            species={new Set(finds.map((f) => speciesKey(f.animal))).size}
            invite={invite}
            onRank={(rank) => {
              if (bestRank && bestRank <= rank) return;
              setBestRank(rank);
              saveBestRank(rank);
            }}
            onFriends={(n) => {
              if (n <= maxFriends) return;
              setMaxFriends(n);
              saveMaxFriends(n);
            }}
            onInviteDone={() => setInvite(null)}
          />
        )}
        {tab === 'season' && (
          <SeasonScreen finds={finds} onOpen={setOpenFind} />
        )}
      </View>
      <TabBar active={tab} onSelect={setTab} dot={freshBadges.length ? 'challenges' : null} />
      {overlay && <View style={StyleSheet.absoluteFill}>{overlay}</View>}
      <LimitSheet visible={limitOpen} onClose={() => setLimitOpen(false)} />
      {/* Foto ist gewählt und wird noch vorbereitet (z. B. aus iCloud geladen) */}
      {preparing && (
        <View style={[StyleSheet.absoluteFill, styles.preparing]}>
          <View style={styles.prepBox}>
            <ActivityIndicator color={colors.accentLight} />
            <Text style={styles.prepText}>{t('res.preparing')}</Text>
          </View>
        </View>
      )}
      {!promised && !overlay && (
        <PromiseSheet
          onDone={() => {
            setPromised(true);
            AsyncStorage.setItem('findimal-promise', '1').catch(() => {});
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  preparing: { backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  prepBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#17462F',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  prepText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.white },
});
