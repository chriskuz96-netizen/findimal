import AsyncStorage from '@react-native-async-storage/async-storage';

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
