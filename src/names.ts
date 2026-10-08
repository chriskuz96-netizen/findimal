import type { Animal } from './identify';

// Bei Haus- und Nutztieren steht die Rasse groß als Name ("Labrador-Mischling"), sonst der Tiername.
// Ältere Funde hatten "vermutlich …" in der Rasse – das wird hier herausgenommen.
export function displayName(a: Animal): string {
  const r = (a.rasse || '').replace(/^vermutlich\s+/i, '').trim();
  return r ? r.charAt(0).toUpperCase() + r.slice(1) : a.name;
}

// Ist die Rasse nur geschätzt?
export function breedGuessed(a: Animal): boolean {
  return !!a.rasse && (a.rasse_sicher === false || /vermutlich/i.test(a.rasse));
}
