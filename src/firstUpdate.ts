import * as Updates from 'expo-updates';

// Beim allerersten Start (noch kein Entdecker-Name): neuestes Update sofort laden, bevor die Einrichtung kommt.
// Sonst sähe man bei einer frischen Installation erst beim zweiten Start den aktuellen Stand.
// Höchstens ein paar Sekunden – ohne Netz geht es einfach mit dem eingebauten Stand weiter.
const within = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);

export async function updateBeforeSetup(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return;
  try {
    const check = await within(Updates.checkForUpdateAsync(), 4000);
    if (!check?.isAvailable) return;
    const got = await within(Updates.fetchUpdateAsync(), 8000);
    if (got?.isNew) await Updates.reloadAsync();
  } catch {
    // egal: dann eben beim nächsten Start
  }
}
