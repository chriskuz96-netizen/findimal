import AsyncStorage from '@react-native-async-storage/async-storage';

// Gratis-Fotos pro Tag. Der Server zählt verbindlich mit (pro Handy und Tag);
// die App zählt selbst nur mit, um vorher anzuzeigen, wie viele noch übrig sind.
export const FREE_PHOTOS_PER_DAY = 3;

const DEVICE_KEY = 'findimal-device';
const USAGE_KEY = 'findimal-usage';

const today = () => new Date().toISOString().slice(0, 10); // gleicher Tag wie auf dem Server (UTC)

// Zufällige Kennung dieses Handys (für das Tageslimit auf dem Server, sonst nichts)
export async function getDeviceId(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(DEVICE_KEY);
    if (saved) return saved;
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const id = Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    await AsyncStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return '';
  }
}

export async function usedToday(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(USAGE_KEY);
    const u = raw ? (JSON.parse(raw) as { day: string; count: number }) : null;
    return u && u.day === today() ? u.count : 0;
  } catch {
    return 0;
  }
}

export async function setUsedToday(count: number): Promise<void> {
  await AsyncStorage.setItem(USAGE_KEY, JSON.stringify({ day: today(), count })).catch(() => {});
}

// Halbseitige Anzeige: ab dem dritten Foto des Tages, höchstens einmal am Tag
const BIG_AD_KEY = 'findimal-big-ad';
export const BIG_AD_FROM_PHOTO = 3;

export async function bigAdDue(): Promise<boolean> {
  try {
    if ((await usedToday()) < BIG_AD_FROM_PHOTO) return false;
    return (await AsyncStorage.getItem(BIG_AD_KEY)) !== today();
  } catch {
    return false;
  }
}

export async function markBigAdShown(): Promise<void> {
  await AsyncStorage.setItem(BIG_AD_KEY, today()).catch(() => {});
}
