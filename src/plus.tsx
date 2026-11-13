import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

import { PlusPaywall } from './components/PlusPaywall';
import { RC_IOS_KEY } from './config';
import { Translate } from './i18n';

// Explorimal Plus: ein Abo (monatlich oder jährlich) über den App Store, abgewickelt mit RevenueCat.
// Ob jemand Plus hat, entscheidet RevenueCat (Zugang „plus“). Der Server prüft das zusätzlich selbst,
// die App schickt dafür ihre RevenueCat-Kennung mit (rcUserId).
// Im Browser (nur zum Entwickeln) gibt es keinen Kauf, dort lässt sich Plus wie früher testweise einschalten.

export const ENTITLEMENT = 'plus';
const TEST_KEY = 'findimal-plus-test'; // nur Browser
const CACHE_KEY = 'findimal-plus'; // letzter bekannter Stand, damit Plus beim Start sofort da ist

const native = (Platform.OS === 'ios' && !!RC_IOS_KEY) || false;

// RevenueCat erst laden, wenn es gebraucht wird (im Browser und in alten Bauten fehlt das native Modul)
type RC = typeof import('react-native-purchases').default;
let rcPromise: Promise<RC | null> | null = null;
export function revenueCat(): Promise<RC | null> {
  if (!native) return Promise.resolve(null);
  rcPromise ??= (async () => {
    try {
      const Purchases = (await import('react-native-purchases')).default;
      Purchases.configure({ apiKey: RC_IOS_KEY });
      return Purchases;
    } catch {
      return null;
    }
  })();
  return rcPromise;
}

// Stand für Stellen ohne React (z. B. beim Senden der Fotos)
let plusNow = false;
let rcUserId: string | null = null;
export async function hasPlus(): Promise<boolean> {
  if (native) return plusNow;
  try {
    return (await AsyncStorage.getItem(TEST_KEY)) === '1';
  } catch {
    return false;
  }
}
// RevenueCat-Kennung dieses Handys, damit der Server das Abo selbst prüfen kann
export const plusUserId = () => rcUserId;

type CustomerInfoLike = { entitlements: { active: Record<string, unknown> }; originalAppUserId?: string };
export const isActive = (info: CustomerInfoLike | null | undefined) => !!info?.entitlements.active[ENTITLEMENT];

type PlusState = {
  plus: boolean;
  setPlus: (on: boolean) => void; // nur Browser (Test)
  openPaywall: () => void;
  manage: () => void; // Abo in den Apple-Einstellungen verwalten
};

const Ctx = createContext<PlusState>({ plus: false, setPlus: () => {}, openPaywall: () => {}, manage: () => {} });

// Für askForPlus: die Kaufseite von überall öffnen können
let openRef: (() => void) | null = null;

export function PlusProvider({ children }: { children: ReactNode }) {
  const [plus, setPlusState] = useState(false);
  const [paywall, setPaywall] = useState(false);

  const apply = (on: boolean) => {
    plusNow = on;
    setPlusState(on);
    AsyncStorage.setItem(CACHE_KEY, on ? '1' : '0').catch(() => {});
  };

  useEffect(() => {
    if (!native) {
      AsyncStorage.getItem(TEST_KEY)
        .then((v) => setPlusState(v === '1'))
        .catch(() => {});
      return;
    }
    let alive = true;
    let remove: (() => void) | undefined;
    // zuerst der gemerkte Stand, dann der echte von RevenueCat
    AsyncStorage.getItem(CACHE_KEY)
      .then((v) => alive && v === '1' && !plusNow && ((plusNow = true), setPlusState(true)))
      .catch(() => {});
    revenueCat().then(async (rc) => {
      if (!rc || !alive) return;
      const onInfo = (info: CustomerInfoLike) => {
        rcUserId = info.originalAppUserId ?? rcUserId;
        if (alive) apply(isActive(info));
      };
      rc.addCustomerInfoUpdateListener(onInfo);
      remove = () => rc.removeCustomerInfoUpdateListener(onInfo);
      try {
        rcUserId = await rc.getAppUserID();
        onInfo(await rc.getCustomerInfo());
      } catch {
        // offline: gemerkter Stand bleibt
      }
    });
    return () => {
      alive = false;
      remove?.();
    };
  }, []);

  const setPlus = (on: boolean) => {
    if (native) return;
    setPlusState(on);
    AsyncStorage.setItem(TEST_KEY, on ? '1' : '0').catch(() => {});
  };

  const openPaywall = () => setPaywall(true);
  openRef = openPaywall;

  const manage = () => {
    revenueCat().then((rc) => rc?.showManageSubscriptions().catch(() => {}));
  };

  return (
    <Ctx.Provider value={{ plus, setPlus, openPaywall, manage }}>
      {children}
      {native && <PlusPaywall visible={paywall} onClose={() => setPaywall(false)} onActive={() => apply(true)} />}
    </Ctx.Provider>
  );
}

export const usePlus = () => useContext(Ctx);
export const plusPurchasable = native;

// "Plus holen": in der App die Kaufseite, im Browser zum Ausprobieren einschalten
export function askForPlus(t: Translate, setPlus: (on: boolean) => void) {
  if (native) {
    openRef?.();
    return;
  }
  Alert.alert(t('plus.title'), t('plus.testText'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('plus.try'), onPress: () => setPlus(true) },
  ]);
}

// Auswahl für die Plus-Werbung (Profil-Karte und Foto-Grenze)
export const PLUS_SHOWCASE = ['p-fox', 'p-eagle', 'p-shark', 'p-giraffe', 'p-crab'].map((id) => ({ id }));

// Plus-Profilbilder: selbst gezeichnete Tiere (Bilder und Hintergrund in components/PlusAnimal.tsx)
export const PLUS_AVATARS: { id: string }[] = [
  { id: 'p-fox' },
  { id: 'p-owl' },
  { id: 'p-snail' },
  { id: 'p-deer' },
  { id: 'p-bear' },
  { id: 'p-eagle' },
  { id: 'p-turtle' },
  { id: 'p-butterfly' },
  { id: 'p-bee' },
  { id: 'p-ladybug' },
  { id: 'p-hedgehog' },
  { id: 'p-squirrel' },
  { id: 'p-frog' },
  { id: 'p-lizard' },
  { id: 'p-crab' },
  { id: 'p-octopus' },
  { id: 'p-parrot' },
  { id: 'p-flamingo' },
  { id: 'p-penguin' },
  { id: 'p-giraffe' },
  { id: 'p-tiger' },
  { id: 'p-panda' },
  { id: 'p-otter' },
  { id: 'p-shark' },
];

export const isPlusAvatar = (id: string) => PLUS_AVATARS.some((a) => a.id === id);
