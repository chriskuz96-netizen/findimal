import { Platform } from 'react-native';

import { ADMOB_BANNER_IOS, ADMOB_REWARDED_IOS, ADS_LIVE } from './config';
import { loadGma } from './gma';
import { markRewardedToday, rewardedToday } from './usage';

// Werbung über Google AdMob: nur nicht personalisiert, familiengeeignet (Altersfreigabe „G“).
// Vor der ersten Anzeige fragt Googles Einwilligungsfenster (UMP) nach, wie es die DSGVO verlangt.
// Plus-Kunden bekommen nie Werbung (prüfen die Aufrufer).
// Solange ADS_LIVE aus ist, laufen nur Googles Test-Anzeigen (dürfen beliebig angetippt werden).
// Im Browser und in Bauten ohne AdMob-Modul passiert nichts (dort gibt es Platzhalter).

type GMA = typeof import('react-native-google-mobile-ads');
let gmaPromise: Promise<GMA | null> | null = null;
let ready = false;

// AdMob laden, Einwilligung einholen und starten (einmal pro App-Start)
export function ads(): Promise<GMA | null> {
  if (Platform.OS !== 'ios') return Promise.resolve(null);
  gmaPromise ??= (async () => {
    try {
      const gma = await loadGma();
      if (!gma) return null;
      try {
        await gma.AdsConsent.gatherConsent(); // zeigt das Fenster nur, wenn nötig (EU) und noch nicht beantwortet
      } catch {
        // Fenster ging nicht (z. B. offline): Google entscheidet dann über canRequestAds
      }
      const info = await gma.AdsConsent.getConsentInfo().catch(() => null);
      if (info && !info.canRequestAds) return gma; // keine Werbung ohne Einwilligung (gma trotzdem für Datenschutz-Knopf)
      await gma.default().setRequestConfiguration({
        maxAdContentRating: gma.MaxAdContentRating.G,
        tagForUnderAgeOfConsent: false,
      });
      await gma.default().initialize();
      ready = true;
      return gma;
    } catch {
      return null;
    }
  })();
  return gmaPromise;
}

export const adsReady = () => ready;
export const requestOptions = { requestNonPersonalizedAdsOnly: true } as const;

export async function bannerId(): Promise<string | null> {
  const gma = await ads();
  if (!gma || !ready) return null;
  return ADS_LIVE && ADMOB_BANNER_IOS ? ADMOB_BANNER_IOS : gma.TestIds.ADAPTIVE_BANNER;
}

// Datenschutz-Einstellungen für Werbung (Pflicht in der EU: Einwilligung jederzeit änderbar)
export async function privacyOptionsNeeded(): Promise<boolean> {
  if (!gmaPromise) return false; // Werbung (noch) nicht gestartet, z. B. bei Plus: nichts zu ändern
  const gma = await gmaPromise;
  if (!gma) return false;
  const info = await gma.AdsConsent.getConsentInfo().catch(() => null);
  return info?.privacyOptionsRequirementStatus === gma.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
}
export async function showAdPrivacy(): Promise<void> {
  const gma = await ads();
  await gma?.AdsConsent.showPrivacyOptionsForm().catch(() => {});
}

// Vollbild-Werbung an natürlichen Pausen. Gibt es (noch) nicht: wir zeigen stattdessen die halbe Werbeseite.
// Wer heute schon ein Belohnungs-Video angesehen hat, bekommt keine.
export async function showInterstitial(): Promise<void> {
  if (await rewardedToday()) return;
}

// Belohnungs-Video (freiwillig: Extra-Foto, Joker im Quiz, Serie retten).
// true nur, wenn Google die Belohnung bestätigt (Video bis zum Ende angesehen).
// 'none': gerade keine Anzeige verfügbar (z. B. offline) – dann gibt es auch keine Belohnung.
export async function showRewarded(): Promise<boolean> {
  const r = await playRewarded();
  if (r === 'earned') await markRewardedToday();
  return r === 'earned';
}

export async function playRewarded(): Promise<'earned' | 'closed' | 'none'> {
  if (Platform.OS === 'web') {
    // Browser (nur zum Entwickeln): Belohnung gleich geben
    await markRewardedToday();
    return 'earned';
  }
  const gma = await ads();
  if (!gma || !ready) return 'none';
  const id = ADS_LIVE && ADMOB_REWARDED_IOS ? ADMOB_REWARDED_IOS : gma.TestIds.REWARDED;
  const ad = gma.RewardedAd.createForAdRequest(id, requestOptions);
  return new Promise((resolve) => {
    let earned = false;
    let done = false;
    const finish = (r: 'earned' | 'closed' | 'none') => {
      if (done) return;
      done = true;
      subs.forEach((u) => u());
      clearTimeout(timer);
      resolve(r);
    };
    const subs = [
      ad.addAdEventListener(gma.RewardedAdEventType.LOADED, () => {
        clearTimeout(timer);
        ad.show().catch(() => finish('none'));
      }),
      ad.addAdEventListener(gma.RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
      ad.addAdEventListener(gma.AdEventType.CLOSED, () => finish(earned ? 'earned' : 'closed')),
      ad.addAdEventListener(gma.AdEventType.ERROR, () => finish(earned ? 'earned' : 'none')),
    ];
    const timer = setTimeout(() => finish('none'), 15000); // Laden dauert zu lange
    ad.load();
  });
}
