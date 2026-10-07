import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Lang } from './i18n';
import { seasonId } from './season';
import { Tip, TIP_MONTHS, TIPS } from './tips';
import { weekStart } from './weekly';

// Natur-Tipps: höchstens eine Mitteilung pro Woche (sonntags 10 Uhr), abwechselnd ein Fund-Tipp und
// ein Schutz-Tipp zur Jahreszeit. Alles wird auf dem Handy eingeplant – kein Server, keine Daten nach außen.
// Bei jedem App-Start werden die nächsten 8 Sonntage neu geplant (wer die App lange nicht öffnet,
// bekommt danach also auch keine Tipps mehr).

const KEY = 'findimal-tips'; // '1' = an, '0' = aus, nichts = noch nicht gefragt
const WEEKS = 8;
const DAY = 86400000;
const supported = Platform.OS !== 'web';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function loadTips(): Promise<boolean | null> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === null ? null : v === '1';
  } catch {
    return null;
  }
}

// Fortlaufende Wochennummer (unabhängig von Sommer-/Winterzeit)
function weekNumber(d: Date): number {
  const m = weekStart(d);
  return Math.floor((Date.UTC(m.getFullYear(), m.getMonth(), m.getDate()) / DAY + 3) / 7);
}

function nextWeek(d: Date): Date {
  const n = new Date(d);
  n.setDate(n.getDate() + 7);
  return n;
}

// Sonntag der Woche eines Datums (10 Uhr)
function sundayOf(date: Date): Date {
  const d = weekStart(date);
  d.setDate(d.getDate() + 6);
  d.setHours(10, 0, 0, 0);
  return d;
}

// Tipp für die Woche eines Datums. Wochen wechseln sich ab (Schutz-Tipp, Fund-Tipp). Innerhalb einer
// Jahreszeit kommt jeder Tipp nur einmal dran, der Reihe nach; Monats-Tipps nur in ihrem Monat.
export function tipFor(date: Date, lang: Lang): Tip {
  const target = sundayOf(date);
  const season = seasonId(target);
  // Erster Sonntag der Jahreszeit (1. März, 1. Juni, 1. September, 1. Dezember)
  const m = target.getMonth();
  const first = m <= 1 ? new Date(target.getFullYear() - 1, 11, 1) : new Date(target.getFullYear(), m - ((m + 1) % 3), 1);
  const used = { find: new Set<number>(), protect: new Set<number>() };
  let pick: Tip = TIPS[lang][season].protect[0];
  for (let s = sundayOf(first); s.getTime() <= target.getTime(); s = nextWeek(s)) {
    const n = weekNumber(s);
    const kind = n % 2 ? 'find' : 'protect';
    const list = TIPS[lang][season][kind];
    const months = (k: number) => TIP_MONTHS[`${season}.${kind}.${k}`];
    const fits = (k: number) => months(k)?.includes(s.getMonth() + 1) ?? true;
    let open = list.map((_, k) => k).filter((k) => fits(k) && !used[kind].has(k));
    if (!open.length) {
      used[kind].clear(); // alle schon dran gewesen: von vorn
      open = list.map((_, k) => k).filter(fits);
    }
    // Monats-Tipps zuerst, damit sie nicht verpasst werden
    const i = open.find((k) => months(k)) ?? open[0];
    used[kind].add(i);
    pick = list[i];
  }
  return pick;
}

const content = (tip: Tip) => ({ title: tip.title, body: tip.text, data: { screen: 'season' } });

// Die nächsten Sonntage um 10 Uhr neu einplanen (nur wenn Tipps an sind und erlaubt)
export async function planTips(lang: Lang): Promise<void> {
  if (!supported || !(await loadTips())) return;
  try {
    if (!(await Notifications.getPermissionsAsync()).granted) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    const now = new Date();
    const d = new Date(now);
    d.setHours(10, 0, 0, 0);
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
    if (d <= now) d.setDate(d.getDate() + 7);
    for (let i = 0; i < WEEKS; i++) {
      const when = new Date(d);
      when.setDate(d.getDate() + i * 7);
      await Notifications.scheduleNotificationAsync({
        content: content(tipFor(when, lang)),
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
      });
    }
  } catch {
    // Mitteilungen sind nicht so wichtig, dass die App deswegen stören soll
  }
}

// Einschalten: fragt iOS um Erlaubnis. false = nicht erlaubt (dann in den iPhone-Einstellungen ändern)
export async function enableTips(lang: Lang): Promise<boolean> {
  if (!supported) return false;
  try {
    let perm = await Notifications.getPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) perm = await Notifications.requestPermissionsAsync();
    await AsyncStorage.setItem(KEY, perm.granted ? '1' : '0');
    if (perm.granted) await planTips(lang);
    return perm.granted;
  } catch {
    return false;
  }
}

export async function disableTips(): Promise<void> {
  await AsyncStorage.setItem(KEY, '0').catch(() => {});
  if (supported) await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

// Nur zum Ausprobieren: der Tipp dieser Woche in 10 Sekunden
export async function testTip(lang: Lang): Promise<void> {
  if (!supported) return;
  await Notifications.scheduleNotificationAsync({
    content: content(tipFor(new Date(), lang)),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10 },
  }).catch(() => {});
}

// Tippt man auf eine Mitteilung: Seite öffnen (beim Start der App und während sie läuft)
export function onTipOpened(open: () => void): () => void {
  if (!supported) return () => {};
  const isTip = (r: Notifications.NotificationResponse | null) => r?.notification.request.content.data?.screen === 'season';
  Notifications.getLastNotificationResponseAsync()
    .then((r) => {
      if (isTip(r)) {
        open();
        Notifications.clearLastNotificationResponseAsync?.().catch(() => {});
      }
    })
    .catch(() => {});
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    if (isTip(r)) open();
  });
  return () => sub.remove();
}
