import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { NunitoSans_500Medium, NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { StartScreen } from './src/screens/StartScreen';
import { clearName, loadName, saveName } from './src/storage';
import { colors } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    NunitoSans_500Medium,
    NunitoSans_700Bold,
  });
  // undefined = wird noch geladen, null = noch kein Name gespeichert
  const [name, setName] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    loadName().then(setName);
  }, []);

  // Solange Schriften oder Name laden, nur den dunkelgrünen Hintergrund zeigen.
  if (!fontsLoaded || name === undefined) {
    return <View style={{ flex: 1, backgroundColor: colors.skyMid }} />;
  }

  return (
    <SafeAreaProvider>
      {name ? (
        <>
          <StatusBar style="light" />
          <StartScreen
            name={name}
            onChangeName={() => {
              clearName();
              setName(null);
            }}
          />
        </>
      ) : (
        <>
          <StatusBar style="auto" />
          <OnboardingScreen
            onDone={(newName) => {
              saveName(newName);
              setName(newName);
            }}
          />
        </>
      )}
    </SafeAreaProvider>
  );
}
