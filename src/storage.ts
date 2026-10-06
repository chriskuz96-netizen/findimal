import AsyncStorage from '@react-native-async-storage/async-storage';

// Alles, was die App dauerhaft auf dem Handy speichert.
const NAME_KEY = 'findimal-name';

export async function loadName(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(NAME_KEY);
  } catch {
    return null;
  }
}

export async function saveName(name: string): Promise<void> {
  try {
    await AsyncStorage.setItem(NAME_KEY, name);
  } catch {
    // Speichern fehlgeschlagen: Name gilt dann nur bis zum nächsten Start.
  }
}

export async function clearName(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NAME_KEY);
  } catch {
    // ignorieren
  }
}
