import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { NunitoSans_500Medium, NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, AppState, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnOpen, OnPicked, Photo, pickPhoto, takePhoto } from './src/camera';
import { AppLogo } from './src/components/AppLogo';
import { Preparing } from './src/components/Preparing';
import { useTabDots } from './src/tabDots';
import { LoopsPaused } from './src/hooks/useLoop';
import { CodeScreen } from './src/screens/CodeScreen';
import { PromiseSheet } from './src/components/PromiseSheet';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { Tab, TabBar } from './src/components/TabBar';
import { allowAutoJoin, autoJoin, codeFromUrl } from './src/board';
import { LimitSheet, watchVideo } from './src/components/LimitCard';
import { bonusPhotos, FREE_PHOTOS_PER_DAY, usedToday, VIDEOS_PER_DAY, videosToday } from './src/usage';
import { addFind, counts, Find, forgetFinds, loadFinds, removeFind, speciesKey, translateFindTexts, updateFind, updatePlace } from './src/finds';
import { Animal, checkAppKey, getAppKey, translateAnimal } from './src/identify';
import { updateBeforeSetup } from './src/firstUpdate';
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
import { colors } from './src/theme';

export default function App() {
  return (
    // Gesten (Zurückwischen) laufen direkt auf dem Bildschirm-Thread, nicht über JavaScript
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LangProvider>
          <PlusProvider>
            <ErrorBoundary>
              <Main />
            </ErrorBoundary>
          </PlusProvider>
        </LangProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
  const [firstVisit, setFirstVisit] = useState(false); // gerade eingerichtet: „Willkommen“ statt „Willkommen zurück“
  // Testphase: Findimal-Code gleich am Anfang abfragen, wenn der Server einen verlangt
  // (und der gespeicherte fehlt oder nicht mehr stimmt). Einmal pro Start prüfen.
  const [askCode, setAskCode] = useState(false);
  const codeChecked = useRef(false);
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
  // Zurück in der App (z. B. am nächsten Morgen): Gratis-Fotos neu zählen und alles neu zeichnen
  const [, setWoke] = useState(0);
  useEffect(() => {
    refreshFreeLeft();
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      refreshFreeLeft();
      setWoke((n) => n + 1);
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const [preparing, setPreparing] = useState<string | null>(null); // gewähltes Foto, solange es vorbereitet wird
  const startPhoto = async (get: (onPicked: OnPicked, onOpen: OnOpen) => Promise<Photo | null>) => {
    if (photoBusy.current) return;
    photoBusy.current = true;
    let under: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!plus && (await usedToday()) >= FREE_PHOTOS_PER_DAY && (await bonusPhotos()) <= 0) return setLimitOpen(true);
      // Ladebildschirm erst unter die Kamera/Fotoauswahl legen, wenn sie den Bildschirm ganz verdeckt
      // (sonst sieht man „Moment …“ beim Hochfahren durchscheinen). Fährt sie nach dem Foto weg,
      // kommt direkt „Moment …“ statt kurz die Startseite.
      const onOpen = () => {
        under = setTimeout(() => setPreparing((cur) => cur ?? ''), 700);
      };
      const p = await get((uri) => {
        clearTimeout(under);
        setPreparing(uri);
      }, onOpen);
      if (p) setPhoto(p);
    } catch {
      // z. B. iCloud-Foto nicht ladbar
      Alert.alert(t('id.error'));
    } finally {
      clearTimeout(under);
      photoBusy.current = false;
      setPreparing(null);
    }
  };
  const [openFind, setOpenFind] = useState<Find | null>(null);
  const tipsAfterSave = useRef(false); // Natur-Tipps-Frage, sobald der erste Fund gespeichert ist
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
    // noch kein Name = allererster Start: vorher kurz das neueste Update holen
    loadName().then(async (n) => {
      if (!n) await updateBeforeSetup();
      setName(n);
    });
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
        const next = await translateFindTexts(f.id, texts, target);
        findsRef.current = next; // sofort, damit der nächste Durchlauf den neuen Stand sieht
        setFinds(next);
      }
      translating.current = false;
    })();
  }, [lang, loaded]);

  // Natur-Tipps: bei jedem Start (und Sprachwechsel) die nächsten Wochen neu einplanen;
  // Tippen auf einen Tipp öffnet die Saison-Seite
  useEffect(() => {
    if (loaded) planTips(lang);
  }, [lang, loaded]);
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
    Linking.getInitialURL().then(handle).catch(() => {});
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
    startPhoto((cb, open) => takePhoto(t, cb, open));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantCamera, fontsLoaded, name, region, photo]);

  // Punkte, Stufe, Serie und Challenges – immer frisch berechnet
  const now = new Date();
  // nur echte Funde zählen für Punkte, Arten und Challenges (Internetbilder, Zeichnungen usw. nicht)
  const realFinds = finds.filter(counts);
  const progress = computeProgress(realFinds, correctAnswers(quiz), now, { bestRank, maxFriends });
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
  const newestFind = finds.reduce<string | undefined>((a, f) => (!a || f.date > a ? f.date : a), undefined);
  const dots = useTabDots(tab, quiz, freshBadges.length, newestFind);
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

  useEffect(() => {
    if (codeChecked.current || !name || region == null) return;
    codeChecked.current = true;
    getAppKey()
      .then(checkAppKey)
      .then((r) => r === 'wrong' && setAskCode(true));
  }, [name, region]);

  // Rangliste: wer sich bei der Einrichtung einen Entdecker-Namen gegeben hat, ist automatisch dabei
  // (einmal pro Start versuchen, z. B. wenn beim ersten Mal kein Internet da war)
  const boardChecked = useRef(false);
  useEffect(() => {
    if (boardChecked.current || !name || !loaded || askCode) return;
    boardChecked.current = true;
    autoJoin({
      name,
      xp: progress.xp,
      level: progress.level,
      species: new Set(realFinds.map((f) => speciesKey(f.animal))).size,
      avatar: avatarBadge ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, loaded, askCode]);

  // Kein Ort eingestellt ("Später" gewählt): beim Öffnen der App einmal am Tag wieder nach dem Ort fragen
  const regionChecked = useRef(false);
  useEffect(() => {
    if (regionChecked.current || !name || region !== '') return;
    regionChecked.current = true;
    const today = new Date().toDateString();
    AsyncStorage.getItem('findimal-region-asked')
      .then((day) => {
        if (day === today) return;
        AsyncStorage.setItem('findimal-region-asked', today).catch(() => {});
        setAskRegion(true);
      })
      .catch(() => {});
  }, [name, region]);

  // Solange Schriften oder Name laden: Startbild mit dem Findimal-Symbol.
  if (!fontsLoaded || !loaded || name === undefined || region === undefined) {
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
            setFirstVisit(true);
            allowAutoJoin();
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
          name={askRegion ? undefined : name}
          onDone={(r) => {
            // "Später" beim Ändern behält die alte Region
            const next = askRegion && !r ? region ?? '' : r;
            saveRegion(next);
            setRegion(next);
            setAskRegion(false);
            // heute nicht noch einmal fragen
            if (!next) {
              regionChecked.current = true;
              AsyncStorage.setItem('findimal-region-asked', new Date().toDateString()).catch(() => {});
            }
          }}
        />
      </>
    );
  }

  if (askCode) {
    return (
      <>
        <StatusBar style="auto" />
        <CodeScreen onDone={() => setAskCode(false)} />
      </>
    );
  }

  // Profil und Ergebnis liegen ÜBER den Tabs (die darunter gezeichnet bleiben).
  // So sieht man beim Zurückwischen die richtige Seite darunter statt einer weißen Fläche.
  // Fund speichern (neu oder als Ersatz, z. B. nach „Stimmt nicht?“) und Belohnung berechnen
  const saveIdentified = async (animal: Animal, replaceId: string | null, shot: Photo) => {
    const quizXp = correctAnswers(quizRef.current);
    // Stand ohne diesen Fund (bei einem zweiten Foto wird der alte Fund ersetzt)
    const others = findsRef.current.filter((f) => f.id !== replaceId && counts(f));
    const before = computeProgress(others, quizXp, new Date(), { bestRank, maxFriends });
    const isNew = !others.some((f) => speciesKey(f.animal) === speciesKey(animal));
    let id = replaceId;
    let next: Find[];
    if (replaceId) {
      next = await updateFind(replaceId, animal);
    } else {
      const added = await addFind(shot, animal, region || undefined, lang);
      next = added.finds;
      id = added.id;
    }
    setFinds(next);
    // Fund ist gespeichert: hat man die Seite schon verlassen, jetzt nach den Natur-Tipps fragen
    if (tipsAfterSave.current) {
      tipsAfterSave.current = false;
      setTimeout(askTips, 300);
    }
    const after = computeProgress(next.filter(counts), quizXp, new Date(), { bestRank, maxFriends });
    return { id: id!, reward: computeReward(before, after, isNew) };
  };

  const overlay = showProfile ? (
    <ProfileScreen
      name={name}
      region={region}
      avatar={avatarBadge}
      progress={progress}
      finds={realFinds}
      onBack={() => setShowProfile(false)}
      onRename={(n) => {
        saveName(n);
        setName(n);
      }}
      onChangeRegion={() => setAskRegion(true)}
      onSelectAvatar={chooseAvatar}
      onReset={async () => {
        await resetAll();
        forgetFinds();
        setFinds([]);
        setSeenBadges([]);
        refreshFreeLeft();
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
      onIdentified={saveIdentified}
      morePhoto={(kind) => (kind === 'camera' ? takePhoto(t) : pickPhoto())}
      onDetails={(id, animal) => updateFind(id, animal).then(setFinds)}
      onBack={(to) => {
        // nach einem neuen Foto geht es zur Startseite mit der Kamera – fürs nächste Tier (oder auf Wunsch zur Sammlung)
        setPhoto(null);
        setTab(to ?? 'start');
        refreshFreeLeft();
        // der erste Fund wird evtl. noch gespeichert (Ort abwarten) – dann danach fragen
        if (findsRef.current.length) setTimeout(askTips, 600);
        else tipsAfterSave.current = true;
      }}
    />
  ) : openFind ? (
    <ResultScreen
      saved={openFind}
      onIdentified={saveIdentified}
      onDetails={(id, animal) => updateFind(id, animal).then(setFinds)}
      onPlace={(id, place) => updatePlace(id, place).then(setFinds)}
      backLabel={t(tab === 'season' ? 'res.backSeason' : tab === 'collection' ? 'res.backCollection' : 'res.back')}
      onBack={() => setOpenFind(null)}
    />
  ) : null;

  return (
    <>
      <StatusBar style="light" />
      {/* Seiten darunter: Animationen anhalten, solange Profil oder Ergebnis darüber liegt */}
      <LoopsPaused.Provider value={!!overlay}>
      <View style={{ flex: 1 }}>
        {tab === 'start' && (
          <StartScreen
            firstVisit={firstVisit}
            name={name}
            region={region}
            onSetRegion={(r) => {
              saveRegion(r);
              setRegion(r);
            }}
            onTypeRegion={() => setAskRegion(true)}
            onOpenProfile={() => setShowProfile(true)}
            xp={progress.xp}
            avatar={avatarBadge}
            freeLeft={freeLeft}
            videosLeft={videosLeft}
            onWatchVideo={() => watchVideo(t)}
            onTakePhoto={() => startPhoto((cb, open) => takePhoto(t, cb, open))}
            onPickPhoto={() => startPhoto((cb, open) => pickPhoto(cb, open))}
          />
        )}
        {tab === 'collection' && (
          <CollectionScreen
            finds={finds}
            name={name}
            avatar={avatarBadge}
            level={progress.level}
            onOpenProfile={() => setShowProfile(true)}
            onOpen={setOpenFind}
            onDelete={(f) => removeFind(f.id).then(setFinds)}
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
            species={new Set(realFinds.map((f) => speciesKey(f.animal))).size}
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
          <SeasonScreen finds={realFinds} place={region ?? ''} onChangePlace={() => setAskRegion(true)} />
        )}
      </View>
      </LoopsPaused.Provider>
      <TabBar active={tab} onSelect={setTab} dots={dots} />
      {overlay && <View style={StyleSheet.absoluteFill}>{overlay}</View>}
      <LimitSheet visible={limitOpen} onClose={() => setLimitOpen(false)} />
      {/* Foto ist gewählt und wird noch vorbereitet (z. B. aus iCloud geladen) – sieht schon aus wie die Ergebnisseite */}
      {preparing !== null && <Preparing uri={preparing} />}
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

