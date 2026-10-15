import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { Translate } from './i18n';

// Findimal Plus. Einen echten Kauf (In-App-Abo) gibt es erst in der fertigen App.
// Bis dahin kann man Plus in der Testversion kostenlos einschalten – nur auf diesem Handy.
// Der Server lässt Plus-Handys dann bis zu 30 Fotos am Tag bestimmen.

const PLUS_KEY = 'findimal-plus-test';

type PlusState = { plus: boolean; setPlus: (on: boolean) => void };

const Ctx = createContext<PlusState>({ plus: false, setPlus: () => {} });

export function PlusProvider({ children }: { children: ReactNode }) {
  const [plus, setPlusState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PLUS_KEY)
      .then((v) => setPlusState(v === '1'))
      .catch(() => {});
  }, []);

  const setPlus = (on: boolean) => {
    setPlusState(on);
    AsyncStorage.setItem(PLUS_KEY, on ? '1' : '0').catch(() => {});
  };

  return <Ctx.Provider value={{ plus, setPlus }}>{children}</Ctx.Provider>;
}

export const usePlus = () => useContext(Ctx);

// Für Stellen ohne React (z. B. beim Senden der Fotos)
export async function hasPlus(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PLUS_KEY)) === '1';
  } catch {
    return false;
  }
}

// "Plus holen": in der Testversion zum Ausprobieren einschalten
export function askForPlus(t: Translate, setPlus: (on: boolean) => void) {
  Alert.alert(t('plus.title'), t('plus.testText'), [
    { text: t('common.cancel'), style: 'cancel' },
    { text: t('plus.try'), onPress: () => setPlus(true) },
  ]);
}

// Exklusive Tier-Profilbilder für Plus-Kunden: Tier und zwei Farben für den Hintergrund
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
  { id: 'p-lion' },
  { id: 'p-tiger' },
  { id: 'p-panda' },
  { id: 'p-otter' },
  { id: 'p-shark' },
];

export const isPlusAvatar = (id: string) => PLUS_AVATARS.some((a) => a.id === id);
