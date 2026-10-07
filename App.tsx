import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { NunitoSans_500Medium, NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Photo, pickPhoto, takePhoto } from './src/camera';
import { AppLogo } from './src/components/AppLogo';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { Tab, TabBar } from './src/components/TabBar';
import { codeFromUrl } from './src/board';
import { showLimit } from './src/components/LimitCard';
import { FREE_PHOTOS_PER_DAY, usedToday } from './src/usage';
import { addFind, Find, loadFinds, removeFind, speciesKey, updateFind } from './src/finds';
import { LangProvider, useI18n } from './src/i18n';
import { isPlusAvatar, PlusProvider, usePlus } from './src/plus';
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
import { loadAvatar, loadName, loadRegion, loadTop100, resetAll, saveAvatar, saveName, saveRegion, saveTop100 } from './src/storage';
import { colors } from './src/theme';

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
  const refreshFreeLeft = () => usedToday().then((u) => setFreeLeft(Math.max(0, FREE_PHOTOS_PER_DAY - u)));
  useEffect(() => {
    refreshFreeLeft();
  }, []);
  // Vor dem Fotografieren prüfen, damit niemand umsonst ein Foto macht
  const startPhoto = async (get: () => Promise<Photo | null>) => {
    if (!plus && (await usedToday()) >= FREE_PHOTOS_PER_DAY) return showLimit(t);
    const p = await get();
    if (p) setPhoto(p);
  };
  const [openFind, setOpenFind] = useState<Find | null>(null);
  // Aktuelle Liste auch in Rückrufen, die später fertig werden
  const findsRef = useRef<Find[]>([]);
  findsRef.current = finds;
  const [quiz, setQuiz] = useState<QuizLog>({});
  const [avatar, setAvatar] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  // Schon einmal unter den 100 besten der weltweiten Rangliste gewesen? (Abzeichen bleibt)
  const [top100, setTop100] = useState(false);
  const quizRef = useRef<QuizLog>({});
  quizRef.current = quiz;

  useEffect(() => {
    loadName().then(setName);
    loadRegion().then(setRegion);
    loadFinds().then(setFinds);
    loadQuiz().then(setQuiz);
    loadAvatar().then(setAvatar);
    loadTop100().then(setTop100);
  }, []);

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
    startPhoto(() => takePhoto(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantCamera, fontsLoaded, name, region, photo]);

  // Punkte, Stufe, Serie und Challenges – immer frisch berechnet
  const now = new Date();
  const progress = computeProgress(finds, correctAnswers(quiz), now, { top100 });
  // Profilbild nur, solange das Abzeichen noch verdient ist (z. B. nach Löschen von Funden)
  // Plus-Tiere nur, solange Plus aktiv ist
  const avatarBadge =
    (plus && isPlusAvatar(avatar) ? avatar : null) ??
    progress.badges.find((b) => b.id === avatar && b.earned)?.id ??
    null;
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

  if (showProfile) {
    return (
      <>
        <StatusBar style="light" />
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
            setTop100(false);
            setRegion(null);
            setShowProfile(false);
            setTab('start');
            setName(null);
          }}
        />
      </>
    );
  }

  if (photo) {
    return (
      <>
        <StatusBar style="light" />
        <ResultScreen
          photo={photo}
          onIdentified={async (animal, replaceId) => {
            const quizXp = correctAnswers(quizRef.current);
            // Stand ohne diesen Fund (bei einem zweiten Foto wird der alte Fund ersetzt)
            const others = findsRef.current.filter((f) => f.id !== replaceId);
            const before = computeProgress(others, quizXp, new Date(), { top100 });
            const isNew = !others.some((f) => speciesKey(f.animal) === speciesKey(animal));
            let id = replaceId;
            let next: Find[];
            if (replaceId) {
              next = await updateFind(findsRef.current, replaceId, animal);
            } else {
              const added = await addFind(findsRef.current, photo, animal);
              next = added.finds;
              id = added.id;
            }
            setFinds(next);
            const after = computeProgress(next, quizXp, new Date(), { top100 });
            return { id: id!, reward: computeReward(before, after, isNew) };
          }}
          morePhoto={(kind) => (kind === 'camera' ? takePhoto(t) : pickPhoto())}
          onDetails={(id, animal) => updateFind(findsRef.current, id, animal).then(setFinds)}
          onBack={() => {
            setPhoto(null);
            refreshFreeLeft();
          }}
        />
      </>
    );
  }

  if (openFind) {
    return (
      <>
        <StatusBar style="light" />
        <ResultScreen
          saved={openFind}
          onDetails={(id, animal) => updateFind(findsRef.current, id, animal).then(setFinds)}
          onBack={() => setOpenFind(null)}
        />
      </>
    );
  }

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
            onTakePhoto={() => startPhoto(() => takePhoto(t))}
            onPickPhoto={() => startPhoto(pickPhoto)}
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
            progress={progress}
            quiz={quiz}
            onAnswer={(q, i) => answerQuiz(quizRef.current, q, i).then(setQuiz)}
            avatar={avatarBadge ?? ''}
            name={name}
            species={new Set(finds.map((f) => speciesKey(f.animal))).size}
            invite={invite}
            onTop100={() => {
              if (top100) return;
              setTop100(true);
              saveTop100();
            }}
            onInviteDone={() => setInvite(null)}
          />
        )}
        {tab === 'season' && (
          <SeasonScreen finds={finds} onOpen={setOpenFind} />
        )}
      </View>
      <TabBar active={tab} onSelect={setTab} />
    </>
  );
}
