import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { NunitoSans_500Medium, NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Photo, pickPhoto, takePhoto } from './src/camera';
import { AppLogo } from './src/components/AppLogo';
import { Tab, TabBar } from './src/components/TabBar';
import { addFind, Find, loadFinds, removeFind, speciesKey, updateFind } from './src/finds';
import { LangProvider, useI18n } from './src/i18n';
import { BadgeId, computeProgress, computeReward, dayKey } from './src/progress';
import { answerQuiz, correctAnswers, loadQuiz, QuizLog, questionFor } from './src/quiz';
import { ChallengesScreen } from './src/screens/ChallengesScreen';
import { CollectionScreen } from './src/screens/CollectionScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SeasonScreen } from './src/screens/SeasonScreen';
import { RegionScreen } from './src/screens/RegionScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { StartScreen } from './src/screens/StartScreen';
import { loadAvatar, loadName, loadRegion, resetAll, saveAvatar, saveName, saveRegion } from './src/storage';
import { colors } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <LangProvider>
        <Main />
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
  // undefined = wird noch geladen, null = noch kein Name gespeichert
  const [name, setName] = useState<string | null | undefined>(undefined);
  // undefined = wird geladen, null = noch nicht gefragt, '' = übersprungen
  const [region, setRegion] = useState<string | null | undefined>(undefined);
  const [askRegion, setAskRegion] = useState(false);
  const [finds, setFinds] = useState<Find[]>([]);
  const [tab, setTab] = useState<Tab>('start');
  // Neues Foto (wird bestimmt) oder geöffneter Fund aus der Sammlung
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [openFind, setOpenFind] = useState<Find | null>(null);
  // Aktuelle Liste auch in Rückrufen, die später fertig werden
  const findsRef = useRef<Find[]>([]);
  findsRef.current = finds;
  const [quiz, setQuiz] = useState<QuizLog>({});
  const [avatar, setAvatar] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const quizRef = useRef<QuizLog>({});
  quizRef.current = quiz;

  useEffect(() => {
    loadName().then(setName);
    loadRegion().then(setRegion);
    loadFinds().then(setFinds);
    loadQuiz().then(setQuiz);
    loadAvatar().then(setAvatar);
  }, []);

  // Punkte, Stufe, Serie und Challenges – immer frisch berechnet
  const now = new Date();
  const progress = computeProgress(finds, correctAnswers(quiz), now);
  // Profilbild nur, solange das Abzeichen noch verdient ist (z. B. nach Löschen von Funden)
  const avatarBadge = progress.badges.find((b) => b.id === avatar && b.earned)?.id ?? null;
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
          avatar={avatarBadge as BadgeId | null}
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
            const before = computeProgress(others, quizXp);
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
            const after = computeProgress(next, quizXp);
            return { id: id!, reward: computeReward(before, after, isNew) };
          }}
          morePhoto={(kind) => (kind === 'camera' ? takePhoto(t) : pickPhoto())}
          onBack={() => setPhoto(null)}
        />
      </>
    );
  }

  if (openFind) {
    return (
      <>
        <StatusBar style="light" />
        <ResultScreen saved={openFind} onBack={() => setOpenFind(null)} />
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
            avatar={avatarBadge as BadgeId | null}
            daily={progress.daily}
            onOpenChallenges={() => setTab('challenges')}
            onTakePhoto={() => takePhoto(t).then((p) => p && setPhoto(p))}
            onPickPhoto={() => pickPhoto().then((p) => p && setPhoto(p))}
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
            question={questionFor(now, lang)}
            answer={quiz[dayKey(now)]}
            onAnswer={(i) => answerQuiz(quizRef.current, now, i).then(setQuiz)}
            avatar={avatarBadge ?? ''}
            onSelectAvatar={chooseAvatar}
          />
        )}
        {tab === 'season' && (
          <SeasonScreen finds={finds} />
        )}
      </View>
      <TabBar active={tab} onSelect={setTab} />
    </>
  );
}
