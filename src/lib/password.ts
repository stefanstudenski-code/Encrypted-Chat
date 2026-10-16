// 32 gut unterscheidbare Zeichen (ohne 0/O und 1/I). 32 teilt 256 ohne Rest,
// daher ist jedes Zeichen exakt gleich wahrscheinlich (kein Modulo-Bias).
export const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Erzeugt ein zufälliges Passwort wie "K7QM-2XHP-9TRW-CB4N-ZF8E":
 * 20 Zeichen × 5 Bit = 100 Bit Zufall, gut vorlesbar und abtippbar.
 */
export function generatePassword(groups = 5, groupLength = 4): string {
  const chars = ALPHABET;
  const bytes = crypto.getRandomValues(new Uint8Array(groups * groupLength));
  const out: string[] = [];
  for (let g = 0; g < groups; g++) {
    let part = '';
    for (let i = 0; i < groupLength; i++) part += chars[bytes[g * groupLength + i] & 31];
    out.push(part);
  }
  return out.join('-');
}

export type Strength = 'leer' | 'sehr schwach' | 'schwach' | 'mittel' | 'stark';

/** Grobe Schätzung der Passwortstärke in Bit (bewusst vorsichtig). */
export function estimateBits(password: string): number {
  if (!password) return 0;
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 33;
  const unique = new Set(password).size;
  // Wiederholungen ("aaaaaaa") zählen weniger
  const effectiveLength = Math.min(password.length, unique * 2);
  return Math.round(effectiveLength * Math.log2(Math.max(pool, 2)));
}

export function rateStrength(password: string): Strength {
  const bits = estimateBits(password);
  if (bits === 0) return 'leer';
  if (bits < 40) return 'sehr schwach';
  if (bits < 60) return 'schwach';
  if (bits < 80) return 'mittel';
  return 'stark';
}
