import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

// Grober Naturraum für die Natur-Tipps, damit sie zum Wohnort passen:
// - central: Mittel- und Nordeuropa (Frost und Schnee im Winter)
// - med: Mittelmeerraum (milde Winter, andere Wintergäste)
// - other: außerhalb Europas (dort passen unsere Tiere und Jahreszeiten nicht – keine Tipps)
// Gespeichert wird nur diese Zone, nie der Standort.

export type Zone = 'central' | 'med' | 'other';

const KEY = 'findimal-zone';

const MED = ['ES', 'PT', 'IT', 'GR', 'MT', 'CY', 'AD', 'SM', 'VA', 'MC'];
const CENTRAL = [
  'DE', 'AT', 'CH', 'LI', 'LU', 'BE', 'NL', 'FR', 'GB', 'IE', 'IS', 'DK', 'NO', 'SE', 'FI', 'EE', 'LV', 'LT',
  'PL', 'CZ', 'SK', 'HU', 'SI', 'HR', 'BA', 'RS', 'ME', 'MK', 'AL', 'BG', 'RO', 'MD', 'UA', 'BY', 'XK',
];

// Zone aus Ländercode (z. B. "DE"), genauer mit Breiten-/Längengrad, wenn bekannt
export function zoneOf(country: string | null | undefined, lat?: number, lon?: number): Zone {
  const cc = (country || '').toUpperCase();
  if (MED.includes(cc)) {
    // Norditalien hat Winter wie Mitteleuropa
    if (cc === 'IT' && lat !== undefined && lat >= 44) return 'central';
    return 'med';
  }
  if (CENTRAL.includes(cc)) {
    // Südfrankreich am Mittelmeer
    if (cc === 'FR' && lat !== undefined && lon !== undefined && lat < 44 && lon > 2.5) return 'med';
    return 'central';
  }
  return 'other';
}

// Land aus den iPhone-Einstellungen (z. B. "de-DE" -> "DE"), falls der Standort nicht bekannt ist
function deviceCountry(): string | null {
  try {
    const parts = Intl.DateTimeFormat().resolvedOptions().locale.split('-');
    return parts.find((p) => /^[A-Z]{2}$/.test(p)) ?? null;
  } catch {
    return null;
  }
}

// Land (z. B. "TH") für die Saison-Seite – nur der Ländercode, kein Ort
const COUNTRY_KEY = 'findimal-country';
export async function saveCountry(cc: string): Promise<void> {
  if (/^[A-Z]{2}$/.test(cc)) await AsyncStorage.setItem(COUNTRY_KEY, cc).catch(() => {});
}
export async function clearCountry(): Promise<void> {
  await AsyncStorage.removeItem(COUNTRY_KEY).catch(() => {});
}
// Gespeichertes Land (vom Standort), sonst aus den iPhone-Einstellungen
export async function loadCountry(): Promise<string | null> {
  try {
    const cc = await AsyncStorage.getItem(COUNTRY_KEY);
    if (cc && /^[A-Z]{2}$/.test(cc)) return cc;
  } catch {
    // weiter mit dem Land des iPhones
  }
  return deviceCountry();
}
// Für Mitteleuropa gibt es fertige Saison-Inhalte; für alle anderen Länder erzeugt sie der Server
export const hasOwnSeason = (cc: string) => CENTRAL.includes(cc.toUpperCase());

export async function saveZone(zone: Zone): Promise<void> {
  await AsyncStorage.setItem(KEY, zone).catch(() => {});
}

// Gespeicherte Zone (vom Standort), sonst aus den iPhone-Einstellungen, sonst Mitteleuropa
export async function loadZone(): Promise<Zone> {
  try {
    const z = await AsyncStorage.getItem(KEY);
    if (z === 'central' || z === 'med' || z === 'other') return z;
  } catch {
    // weiter mit dem Land des iPhones
  }
  const cc = deviceCountry();
  return cc ? zoneOf(cc) : 'central';
}

// Grobe geografische Breite (auf 10° gerundet, z. B. -10 = Nordbrasilien, -30 = Südbrasilien) – damit große
// Länder mit mehreren Klimazonen die passende Saison bekommen. Ein Streifen von gut 1.000 km, kein Ort.
const BAND_KEY = 'findimal-lat-band';
export async function saveBand(lat: number): Promise<void> {
  if (!Number.isFinite(lat)) return;
  const band = Math.max(-60, Math.min(70, Math.round(lat / 10) * 10));
  await AsyncStorage.setItem(BAND_KEY, String(band)).catch(() => {});
}
export async function clearBand(): Promise<void> {
  await AsyncStorage.removeItem(BAND_KEY).catch(() => {});
}
export async function loadBand(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(BAND_KEY);
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

// Saison-Namen nach Monaten statt „Herbst 2026“: in den Tropen und auf der Südhalbkugel passen unsere
// europäischen Jahreszeiten nicht (Nordamerika, Japan usw. behalten die gewohnten Namen)
export function useNeutralSeasons(): boolean {
  const [neutral, setNeutral] = useState(false);
  useEffect(() => {
    Promise.all([loadZone(), loadBand()]).then(([zone, band]) => setNeutral(zone === 'other' && (band === null || band < 25)));
  }, []);
  return neutral;
}
