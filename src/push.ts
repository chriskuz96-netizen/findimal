import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { loadMe, registerPushToken } from './board';
import { Lang } from './i18n';

// Push-Mitteilung bei Freundschaftsanfragen: Die App meldet dem Server die Mitteilungs-Kennung dieses
// Handys (Expo-Push-Token) zusammen mit dem eigenen Freundescode. Schickt jemand eine Anfrage, sendet der
// Server darüber eine Mitteilung. Nur wenn Mitteilungen erlaubt sind und man in der Rangliste dabei ist –
// es wird nie extra um Erlaubnis gefragt (das passiert nur bei den Natur-Tipps).
// Ältere Bauten ohne Push-Berechtigung von Apple bekommen keine Kennung – dann passiert einfach nichts.

const SENT_KEY = 'findimal-push-sent'; // zuletzt gemeldet: "<Code>|<Kennung>|<Sprache>"
const PROJECT_ID = 'd01f3c01-05fb-435f-b41f-842cf6583f72';
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

let running: Promise<void> | null = null;
export function syncPush(lang: Lang): Promise<void> {
  if (!supported) return Promise.resolve();
  running ??= syncNow(lang).finally(() => (running = null));
  return running;
}

async function syncNow(lang: Lang): Promise<void> {
  try {
    const me = await loadMe();
    if (!me || !(await Notifications.getPermissionsAsync()).granted) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID });
    if (!token) return;
    const key = `${me.id}|${token}|${lang}`;
    if ((await AsyncStorage.getItem(SENT_KEY)) === key) return;
    if (await registerPushToken(me, token, lang)) await AsyncStorage.setItem(SENT_KEY, key);
  } catch {
    // keine Kennung (z. B. älterer Bau, Simulator, offline): beim nächsten Start nochmal
  }
}

// Tippt man auf die Mitteilung einer Freundschaftsanfrage: Rangliste öffnen (beim Start und während die App läuft)
export function onFriendRequestOpened(open: () => void): () => void {
  if (!supported) return () => {};
  const isRequest = (r: Notifications.NotificationResponse | null) => r?.notification.request.content.data?.type === 'friend_request';
  Notifications.getLastNotificationResponseAsync()
    .then((r) => {
      if (isRequest(r)) {
        open();
        Notifications.clearLastNotificationResponseAsync?.().catch(() => {});
      }
    })
    .catch(() => {});
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    if (isRequest(r)) open();
  });
  return () => sub.remove();
}
