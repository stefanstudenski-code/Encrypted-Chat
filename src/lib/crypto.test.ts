import { describe, expect, it } from 'vitest';
import {
  DecryptError,
  FormatError,
  PREFIX,
  decryptText,
  encryptText,
  inspectCode,
} from './crypto';
import { ALPHABET, generatePassword, rateStrength } from './password';

// Für schnelle Tests die minimal erlaubte Iterationszahl verwenden
const IT = 100_000;

describe('encryptText / decryptText', () => {
  it('verschlüsselt und entschlüsselt Text inklusive Umlauten und Emoji', async () => {
    const text = 'Hallo Welt! Größe: 5 € – 🔒\nZweite Zeile';
    const { code } = await encryptText(text, 'geheim', IT);
    expect(code.startsWith(PREFIX)).toBe(true);
    const { plaintext } = await decryptText(code, 'geheim');
    expect(plaintext).toBe(text);
  });

  it('funktioniert mit leerem Text', async () => {
    const { code } = await encryptText('', 'pw', IT);
    expect((await decryptText(code, 'pw')).plaintext).toBe('');
  });

  it('erzeugt bei gleichem Text und Passwort jedes Mal einen anderen Code', async () => {
    const a = await encryptText('gleich', 'pw', IT);
    const b = await encryptText('gleich', 'pw', IT);
    expect(a.code).not.toBe(b.code);
    expect(a.details.saltHex).not.toBe(b.details.saltHex);
    expect(a.details.ivHex).not.toBe(b.details.ivHex);
  });

  it('meldet ein falsches Passwort', async () => {
    const { code } = await encryptText('geheim', 'richtig', IT);
    await expect(decryptText(code, 'falsch')).rejects.toBeInstanceOf(DecryptError);
  });

  it('erkennt manipulierten Ciphertext', async () => {
    const { code } = await encryptText('Überweise 10 €', 'pw', IT);
    const i = code.length - 5;
    const flipped = code.slice(0, i) + (code[i] === 'A' ? 'B' : 'A') + code.slice(i + 1);
    await expect(decryptText(flipped, 'pw')).rejects.toBeInstanceOf(DecryptError);
  });

  it('erkennt einen manipulierten Header (z. B. andere Iterationszahl)', async () => {
    const { code } = await encryptText('x', 'pw', IT);
    // Zeichen 2-7 kodieren die Iterationen; eine Änderung muss auffallen
    const i = PREFIX.length + 4;
    const flipped = code.slice(0, i) + (code[i] === 'A' ? 'B' : 'A') + code.slice(i + 1);
    await expect(decryptText(flipped, 'pw')).rejects.toThrow();
  });

  it('normalisiert Unicode im Passwort (macOS vs. Android)', async () => {
    const composed = 'Bär'; // ä als ein Zeichen
    const decomposed = 'Bär'; // a + Trema
    const { code } = await encryptText('ok', composed, IT);
    expect((await decryptText(code, decomposed)).plaintext).toBe('ok');
  });
});

describe('Einlesen von kopierten Codes', () => {
  it('findet den Code mitten in einer E-Mail', async () => {
    const { code } = await encryptText('Treffpunkt 18 Uhr', 'pw', IT);
    const mail = `Hallo Anna,\n\nhier die Nachricht:\n\n${code}\n\nViele Grüße\nStefan`;
    expect((await decryptText(mail, 'pw')).plaintext).toBe('Treffpunkt 18 Uhr');
  });

  it('verträgt Zeilenumbrüche und Zitatzeichen im Code', async () => {
    const { code } = await encryptText('Ein etwas längerer Text, damit der Code umbricht.', 'pw', IT);
    const wrapped = code.match(/.{1,30}/g)!.map((l) => `> ${l}`).join('\n');
    const reply = `Am Montag schrieb Stefan:\n${wrapped}\n> \n> Gruß`;
    expect((await decryptText(reply, 'pw')).plaintext).toBe(
      'Ein etwas längerer Text, damit der Code umbricht.',
    );
  });

  it('ignoriert Text, der direkt hinter dem Code steht', async () => {
    const { code } = await encryptText('kurz', 'pw', IT);
    expect((await decryptText(`${code}\nGruss`, 'pw')).plaintext).toBe('kurz');
    expect((await decryptText(`${code}Gruss`, 'pw')).plaintext).toBe('kurz');
  });

  it('akzeptiert den Code auch ohne Präfix', async () => {
    const { code } = await encryptText('ohne', 'pw', IT);
    expect((await decryptText(code.slice(PREFIX.length), 'pw')).plaintext).toBe('ohne');
  });

  it('meldet abgeschnittene Codes als unvollständig', async () => {
    const { code } = await encryptText('abgeschnitten', 'pw', IT);
    await expect(decryptText(code.slice(0, -10), 'pw')).rejects.toThrow(/unvollständig/);
  });

  it('meldet normalen Text als ungültig', async () => {
    await expect(decryptText('Hallo, wie geht es dir?', 'pw')).rejects.toBeInstanceOf(FormatError);
    expect(inspectCode('Hallo')).toBeNull();
  });

  it('liefert Details ohne Passwort', async () => {
    const { code, details } = await encryptText('abc', 'pw', IT);
    expect(inspectCode(code)).toEqual(details);
    expect(details.ciphertextBytes).toBe(3 + 16);
  });
});

describe('Passwörter', () => {
  it('erzeugt 5 Gruppen à 4 Zeichen aus dem sicheren Alphabet', () => {
    expect(ALPHABET.length).toBe(32);
    expect(new Set(ALPHABET).size).toBe(32);
    const pw = generatePassword();
    expect(pw).toMatch(/^[A-Z2-9]{4}(-[A-Z2-9]{4}){4}$/);
    expect(pw).not.toMatch(/[01IO]/);
    expect(rateStrength(pw)).toBe('stark');
  });

  it('bewertet schwache Passwörter als schwach', () => {
    expect(rateStrength('')).toBe('leer');
    expect(rateStrength('1234')).toBe('sehr schwach');
    expect(rateStrength('aaaaaaaaaaaaaaaa')).toBe('sehr schwach');
  });
});
