// Adresse des Explorimal-Servers (Cloudflare Worker, Code in server/findimal-worker.js).
// Leer = noch kein Server eingerichtet.
export const SERVER_URL = 'https://findimal.findimalapp.workers.dev/';

// RevenueCat (Abo „Explorimal Plus“): öffentlicher Schlüssel der App-Store-App. Er darf in der App stehen,
// damit lassen sich nur Abos anzeigen und kaufen. Der geheime Schlüssel liegt nur beim Server.
export const RC_IOS_KEY = 'appl_IdVDnsqoXFYeRZaWWOGBwPDMkZE';

// Google AdMob (Werbung für Gratis-Nutzer). Die Kennungen sind öffentlich.
// ADS_LIVE = false: nur Googles Test-Anzeigen (zum Entwickeln und für TestFlight). Erst zum Start auf true.
export const ADS_LIVE = false;
export const ADMOB_APP_ID_IOS = 'ca-app-pub-2020103478208185~8370136450';
export const ADMOB_BANNER_IOS = 'ca-app-pub-2020103478208185/1026173915';
export const ADMOB_REWARDED_IOS = 'ca-app-pub-2020103478208185/7272677205';
