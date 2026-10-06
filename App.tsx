import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { NunitoSans_500Medium, NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Photo, pickPhoto, takePhoto } from './src/camera';
import { Tab, TabBar } from './src/components/TabBar';
import { addFind, Find, loadFinds, removeFind } from './src/finds';
import { CollectionScreen } from './src/screens/CollectionScreen';
import { ComingSoonScreen } from './src/screens/ComingSoonScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { RegionScreen } from './src/screens/RegionScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { StartScreen } from './src/screens/StartScreen';
import { clearName, loadName, loadRegion, saveName, saveRegion } from './src/storage';
import { colors } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
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

  useEffect(() => {
    loadName().then(setName);
    loadRegion().then(setRegion);
    loadFinds().then(setFinds);
  }, []);

  // Solange Schriften oder Name laden, nur den dunkelgrünen Hintergrund zeigen.
  if (!fontsLoaded || name === undefined || region === undefined) {
    return <View style={{ flex: 1, backgroundColor: colors.skyMid }} />;
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

  if (photo) {
    return (
      <>
        <StatusBar style="light" />
        <ResultScreen
          photo={photo}
          onIdentified={async (animal) => {
            const { finds: next, isNew } = await addFind(findsRef.current, photo, animal);
            setFinds(next);
            return isNew;
          }}
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
            onChangeRegion={() => setAskRegion(true)}
            onChangeName={() => {
              clearName();
              setName(null);
            }}
            onTakePhoto={() => takePhoto().then((p) => p && setPhoto(p))}
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
          <ComingSoonScreen
            title="Challenges"
            text="Tages-Challenges, Serien, Erfahrungspunkte und Abzeichen bauen wir als Nächstes ein."
          />
        )}
        {tab === 'season' && (
          <ComingSoonScreen
            title="Saison"
            text="Hier erfährst du bald, welche Tiere gerade unterwegs sind und wie du ihnen helfen kannst."
          />
        )}
      </View>
      <TabBar active={tab} onSelect={setTab} />
    </>
  );
}
