import { Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { NunitoSans_500Medium, NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StartScreen } from './src/screens/StartScreen';
import { colors } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    NunitoSans_500Medium,
    NunitoSans_700Bold,
  });

  // Solange die Schriften laden, nur den dunkelgrünen Hintergrund zeigen.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.skyMid }} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {/* Der Name kommt später aus der Begrüßungs-Seite (Onboarding). */}
      <StartScreen name={null} />
    </SafeAreaProvider>
  );
}
