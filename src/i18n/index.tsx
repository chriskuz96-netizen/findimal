import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

import { NICKNAMES, StringKey, STRINGS } from './strings';

export type Lang = 'de' | 'en' | 'fr' | 'es';

export const LANGS: { id: Lang; label: string }[] = [
  { id: 'de', label: 'Deutsch' },
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'Français' },
  { id: 'es', label: 'Español' },
];

// Für Datumsangaben
export const LOCALES: Record<Lang, string> = { de: 'de-DE', en: 'en-GB', fr: 'fr-FR', es: 'es-ES' };

// Sprache des iPhones (z. B. "de-DE" -> "de"), sonst Englisch
function deviceLang(): Lang {
  try {
    const code = Intl.DateTimeFormat().resolvedOptions().locale.slice(0, 2).toLowerCase();
    return (['de', 'en', 'fr', 'es'] as const).find((l) => l === code) ?? 'en';
  } catch {
    return 'de';
  }
}

const LANG_KEY = 'findimal-lang';
const nickIndex = Math.floor(Math.random() * 100); // pro App-Start ein Spitzname

export type Translate = (key: StringKey, params?: Record<string, string | number>) => string;

type I18n = { lang: Lang; setLang: (l: Lang) => void; t: Translate; nickname: string; locale: string };

function makeT(lang: Lang): Translate {
  return (key, params) => {
    let s = STRINGS[lang][key] ?? STRINGS.de[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
}

const Ctx = createContext<I18n>({
  lang: 'de',
  setLang: () => {},
  t: makeT('de'),
  nickname: NICKNAMES.de[0],
  locale: LOCALES.de,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(deviceLang);

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY)
      .then((v) => {
        if (v === 'de' || v === 'en' || v === 'fr' || v === 'es') setLangState(v);
      })
      .catch(() => {});
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(LANG_KEY, l).catch(() => {});
  };

  const nicks = NICKNAMES[lang];
  return (
    <Ctx.Provider value={{ lang, setLang, t: makeT(lang), nickname: nicks[nickIndex % nicks.length], locale: LOCALES[lang] }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n(): I18n {
  return useContext(Ctx);
}
