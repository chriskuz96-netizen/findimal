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
export const PLUS_AVATARS: { id: string; emoji: string; from: string; to: string }[] = [
  { id: 'p-fox', emoji: '🦊', from: '#FFB36B', to: '#C2541B' },
  { id: 'p-owl', emoji: '🦉', from: '#B79BE0', to: '#4B2E83' },
  { id: 'p-wolf', emoji: '🐺', from: '#A9C4DD', to: '#2F4A68' },
  { id: 'p-deer', emoji: '🦌', from: '#E6C79A', to: '#7A5230' },
  { id: 'p-bear', emoji: '🐻', from: '#D9A77A', to: '#5E3A1F' },
  { id: 'p-eagle', emoji: '🦅', from: '#9FD3F2', to: '#1C5E8C' },
  { id: 'p-turtle', emoji: '🐢', from: '#A8E0B4', to: '#1F6E47' },
  { id: 'p-butterfly', emoji: '🦋', from: '#9FE6F2', to: '#2A6FB8' },
  { id: 'p-bee', emoji: '🐝', from: '#FFE58A', to: '#C98A10' },
  { id: 'p-ladybug', emoji: '🐞', from: '#FFB0A0', to: '#B2281C' },
  { id: 'p-hedgehog', emoji: '🦔', from: '#E2C9A8', to: '#6B4A2B' },
  { id: 'p-squirrel', emoji: '🐿️', from: '#F7B98A', to: '#A0461A' },
  { id: 'p-frog', emoji: '🐸', from: '#C9F08F', to: '#3E8A2A' },
  { id: 'p-lizard', emoji: '🦎', from: '#D4F59A', to: '#4E7A12' },
  { id: 'p-dolphin', emoji: '🐬', from: '#9EE7F5', to: '#106A8A' },
  { id: 'p-octopus', emoji: '🐙', from: '#F7A8C8', to: '#8A1F55' },
  { id: 'p-parrot', emoji: '🦜', from: '#B6F0A0', to: '#C23A1F' },
  { id: 'p-flamingo', emoji: '🦩', from: '#FFC7DA', to: '#D0487A' },
  { id: 'p-penguin', emoji: '🐧', from: '#CFE3F5', to: '#25364F' },
  { id: 'p-lion', emoji: '🦁', from: '#FFD98A', to: '#B86A12' },
  { id: 'p-tiger', emoji: '🐯', from: '#FFC48A', to: '#9A3E0A' },
  { id: 'p-panda', emoji: '🐼', from: '#E8F2E0', to: '#3A5A3A' },
  { id: 'p-otter', emoji: '🦦', from: '#D8BFA6', to: '#5A3D28' },
  { id: 'p-shark', emoji: '🦈', from: '#B5D5EA', to: '#2A4D6E' },
];

export const isPlusAvatar = (id: string) => PLUS_AVATARS.some((a) => a.id === id);
