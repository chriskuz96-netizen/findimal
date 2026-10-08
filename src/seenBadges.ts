import AsyncStorage from '@react-native-async-storage/async-storage';

// Abzeichen, die man schon gesehen hat. Alles andere, was verdient ist, gilt als "neu".
const SEEN_BADGES_KEY = 'findimal-seen-badges';

// null = noch nie gespeichert (dann gelten die bisherigen Abzeichen als gesehen)
export async function loadSeenBadges(): Promise<string[] | null> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_BADGES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

export async function saveSeenBadges(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SEEN_BADGES_KEY, JSON.stringify(ids));
  } catch {
    // nicht schlimm: dann bleibt "neu" eben etwas länger stehen
  }
}
