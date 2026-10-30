import { markRewardedToday, rewardedToday } from './usage';

// Vollbild-Werbung an natürlichen Pausen (z. B. nach dem Forscher-Quiz, wenn die XP-Animation vorbei ist).
// Kommt mit AdMob – bis dahin passiert hier nichts. Plus-Kunden bekommen nie Werbung (prüft der Aufrufer).
// Wer heute schon ein Belohnungs-Video angesehen hat, bekommt keine.
export async function showInterstitial(): Promise<void> {
  if (await rewardedToday()) return;
  // TODO AdMob: Interstitial laden und zeigen (familiengeeignet, höchstens alle paar Minuten).
}

// Belohnungs-Video (freiwillig, z. B. für den Joker im Quiz oder „Serie retten“). Liefert true, wenn es bis
// zum Ende angesehen wurde. Kommt mit AdMob – bis dahin gibt es die Belohnung in der Testversion gleich.
export async function showRewarded(): Promise<boolean> {
  // TODO AdMob: Rewarded-Anzeige laden und zeigen (familiengeeignet), erst bei „belohnt“ true liefern.
  await markRewardedToday();
  return true;
}
