/**
 * Text-Verschlüsselung mit AES-256-GCM, Schlüssel per PBKDF2-SHA256 aus einem Passwort.
 *
 * Ergebnis ist ein einzelner, kopierbarer Text ("Code"), der alles enthält, was der
 * Empfänger außer dem Passwort braucht:
 *
 *   ENC1:<base64url>
 *
 * Binärer Aufbau (Big Endian):
 *   [0]      Format-Version (1)
 *   [1..4]   PBKDF2-Iterationen (uint32)
 *   [5..8]   Länge von Ciphertext + Tag in Bytes (uint32)
 *   [9..24]  Salt (16 Bytes, pro Nachricht zufällig)
 *   [25..36] IV (12 Bytes, pro Nachricht zufällig)
 *   [37..]   Ciphertext inkl. 16-Byte-Authentifizierungs-Tag
 *
 * Die ersten 37 Bytes (Header) gehen als "Additional Authenticated Data" in AES-GCM ein,
 * eine Manipulation am Header fällt also genauso auf wie eine am Ciphertext.
 * Weil die Länge im Header steht, wird ein Code auch dann korrekt gelesen, wenn ein
 * E-Mail-Programm ihn umbricht, ihn mit "> " zitiert oder Text direkt dahinter steht.
 */

export const PREFIX = 'ENC1:';
export const FORMAT_VERSION = 1;
/** OWASP-Empfehlung (2023+) für PBKDF2-HMAC-SHA256 */
export const DEFAULT_ITERATIONS = 600_000;

const SALT_BYTES = 16;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const HEADER_BYTES = 1 + 4 + 4 + SALT_BYTES + IV_BYTES; // 37

// Grenzen beim Einlesen, damit ein präparierter Code das Gerät nicht lahmlegt.
const MIN_ITERATIONS = 100_000;
const MAX_ITERATIONS = 10_000_000;
const MAX_CIPHERTEXT_BYTES = 10 * 1024 * 1024;

export class FormatError extends Error {
  constructor(message = 'Kein gültiger verschlüsselter Text gefunden.') {
    super(message);
    this.name = 'FormatError';
  }
}

export class DecryptError extends Error {
  constructor(
    message = 'Entschlüsseln fehlgeschlagen: Das Passwort ist falsch oder der Text wurde verändert.',
  ) {
    super(message);
    this.name = 'DecryptError';
  }
}

export interface EncryptionDetails {
  algorithm: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  saltHex: string;
  ivHex: string;
  /** Größe von Ciphertext + Tag */
  ciphertextBytes: number;
}

export interface EncryptResult {
  code: string;
  details: EncryptionDetails;
}

export interface DecryptResult {
  plaintext: string;
  details: EncryptionDetails;
}

interface ParsedCode {
  header: Uint8Array<ArrayBuffer>;
  iterations: number;
  salt: Uint8Array<ArrayBuffer>;
  iv: Uint8Array<ArrayBuffer>;
  ciphertext: Uint8Array<ArrayBuffer>;
}

// ---------- Hilfsfunktionen ----------

const BASE64URL_CHAR = /[A-Za-z0-9_-]/;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(text: string): Uint8Array<ArrayBuffer> {
  if (text.length % 4 === 1) throw new FormatError();
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(base64);
  } catch {
    throw new FormatError();
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Anzahl Base64-Zeichen (ohne Padding) für n Bytes */
function base64Length(byteCount: number): number {
  return Math.ceil((byteCount * 4) / 3);
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function normalizePassword(password: string): string {
  // Gleiche Darstellung auf allen Geräten (z. B. "ä" als ein Zeichen statt "a" + Trema)
  return password.normalize('NFC');
}

async function deriveKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(normalizePassword(password)),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function detailsOf(parsed: Omit<ParsedCode, 'header'>): EncryptionDetails {
  return {
    algorithm: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    iterations: parsed.iterations,
    saltHex: toHex(parsed.salt),
    ivHex: toHex(parsed.iv),
    ciphertextBytes: parsed.ciphertext.length,
  };
}

// ---------- Öffentliche API ----------

export async function encryptText(
  plaintext: string,
  password: string,
  iterations: number = DEFAULT_ITERATIONS,
): Promise<EncryptResult> {
  if (!password) throw new Error('Bitte ein Passwort eingeben.');

  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const data = new TextEncoder().encode(plaintext);
  const ciphertextBytes = data.length + TAG_BYTES;

  const header = new Uint8Array(HEADER_BYTES);
  const view = new DataView(header.buffer);
  header[0] = FORMAT_VERSION;
  view.setUint32(1, iterations);
  view.setUint32(5, ciphertextBytes);
  header.set(salt, 9);
  header.set(iv, 9 + SALT_BYTES);

  const key = await deriveKey(password, salt, iterations);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: header, tagLength: TAG_BYTES * 8 },
      key,
      data,
    ),
  );

  const out = new Uint8Array(HEADER_BYTES + ciphertext.length);
  out.set(header, 0);
  out.set(ciphertext, HEADER_BYTES);

  return {
    code: PREFIX + bytesToBase64Url(out),
    details: detailsOf({ iterations, salt, iv, ciphertext }),
  };
}

/**
 * Sucht einen Code im eingefügten Text und zerlegt ihn.
 * Leerzeichen, Zeilenumbrüche und Zitatzeichen (">") innerhalb des Codes werden ignoriert.
 */
export function parseCode(input: string): ParsedCode {
  const start = input.indexOf(PREFIX);
  // Ohne Präfix: den ganzen Text als Code versuchen (z. B. wenn nur der Teil danach kopiert wurde)
  const rest = start >= 0 ? input.slice(start + PREFIX.length) : input;

  // 12 Base64-Zeichen = 9 Bytes = Version + Iterationen + Länge
  const PEEK_CHARS = 12;
  let collected = '';
  let needed = PEEK_CHARS;
  let total: number | null = null;

  for (const ch of rest) {
    if (BASE64URL_CHAR.test(ch)) {
      collected += ch;
    } else if (/\s/.test(ch) || ch === '>') {
      continue;
    } else {
      break;
    }

    if (total === null && collected.length >= needed) {
      const head = base64UrlToBytes(collected.slice(0, PEEK_CHARS));
      if (head[0] !== FORMAT_VERSION) {
        throw new FormatError('Unbekannte Format-Version. Bitte die App aktualisieren.');
      }
      const v = new DataView(head.buffer);
      const ctLen = v.getUint32(5);
      if (ctLen < TAG_BYTES || ctLen > MAX_CIPHERTEXT_BYTES) throw new FormatError();
      total = HEADER_BYTES + ctLen;
      needed = base64Length(total);
    }
    if (total !== null && collected.length >= needed) break;
  }

  if (total === null || collected.length < needed) {
    throw new FormatError(
      start >= 0 && collected.length > 0
        ? 'Der verschlüsselte Text ist unvollständig. Wurde er ganz kopiert?'
        : undefined,
    );
  }

  const bytes = base64UrlToBytes(collected.slice(0, needed));
  if (bytes.length !== total) throw new FormatError();

  const view = new DataView(bytes.buffer);
  const iterations = view.getUint32(1);
  if (iterations < MIN_ITERATIONS || iterations > MAX_ITERATIONS) throw new FormatError();

  return {
    header: bytes.slice(0, HEADER_BYTES),
    iterations,
    salt: bytes.slice(9, 9 + SALT_BYTES),
    iv: bytes.slice(9 + SALT_BYTES, HEADER_BYTES),
    ciphertext: bytes.slice(HEADER_BYTES),
  };
}

/** Prüft ohne Passwort, ob im Text ein Code steckt (für die Anzeige beim Einfügen). */
export function inspectCode(input: string): EncryptionDetails | null {
  try {
    return detailsOf(parseCode(input));
  } catch {
    return null;
  }
}

export async function decryptText(input: string, password: string): Promise<DecryptResult> {
  const parsed = parseCode(input);
  const key = await deriveKey(password, parsed.salt, parsed.iterations);

  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: parsed.iv, additionalData: parsed.header, tagLength: TAG_BYTES * 8 },
      key,
      parsed.ciphertext,
    );
  } catch {
    throw new DecryptError();
  }

  return {
    plaintext: new TextDecoder().decode(plain),
    details: detailsOf(parsed),
  };
}
