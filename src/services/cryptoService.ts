import { EncryptedPayload } from '../types/chat';

// Helpers for buffer conversion
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(' ');
}

export class CryptoService {
  /**
   * Derive a 256-bit AES-GCM key from a shared secret passphrase and salt
   * using PBKDF2 with SHA-256 (100,000 rounds).
   */
  private static async deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt plaintext using AES-256-GCM with a fresh 12-byte IV.
   */
  public static async encrypt(plaintext: string, sharedSecret: string, providedSaltBase64?: string): Promise<EncryptedPayload> {
    try {
      const enc = new TextEncoder();
      const encodedPlaintext = enc.encode(plaintext);

      // 16 bytes salt
      let salt: Uint8Array;
      if (providedSaltBase64) {
        salt = new Uint8Array(base64ToArrayBuffer(providedSaltBase64));
      } else {
        salt = window.crypto.getRandomValues(new Uint8Array(16));
      }

      // 12 bytes IV (96 bits recommended for AES-GCM)
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      const key = await this.deriveKey(sharedSecret, salt);

      const ciphertextBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128,
        },
        key,
        encodedPlaintext
      );

      const ciphertextBase64 = arrayBufferToBase64(ciphertextBuffer);
      const ivBase64 = arrayBufferToBase64(iv.buffer);
      const saltBase64 = arrayBufferToBase64(salt.buffer);
      const hexPreview = arrayBufferToHex(ciphertextBuffer);

      return {
        ciphertext: ciphertextBase64,
        iv: ivBase64,
        salt: saltBase64,
        algorithm: 'AES-256-GCM',
        tagLength: 128,
        rawHexPreview: hexPreview,
        byteLength: ciphertextBuffer.byteLength,
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Fehler bei der AES-256-GCM Verschlüsselung');
    }
  }

  /**
   * Decrypt AES-256-GCM encrypted payload back to plaintext.
   */
  public static async decrypt(payload: EncryptedPayload, sharedSecret: string): Promise<string> {
    try {
      const ciphertextBuffer = base64ToArrayBuffer(payload.ciphertext);
      const ivBuffer = base64ToArrayBuffer(payload.iv);
      const saltBuffer = base64ToArrayBuffer(payload.salt);

      const salt = new Uint8Array(saltBuffer);
      const iv = new Uint8Array(ivBuffer);

      const key = await this.deriveKey(sharedSecret, salt);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: payload.tagLength || 128,
        },
        key,
        ciphertextBuffer
      );

      const dec = new TextDecoder();
      return dec.decode(decryptedBuffer);
    } catch (error) {
      console.warn('Decryption failed with secret:', error);
      return '[⚠️ ENTSCHLÜSSELUNG FEHLGESCHLAGEN - Falscher Schlüssel oder manipulierter Ciphertext]';
    }
  }

  /**
   * Generates a 60-digit safety fingerprint (12 blocks of 5 digits)
   * modeled after Signal / WhatsApp E2EE security verification.
   */
  public static async generateSafetyNumber(sharedSecret: string, saltBase64: string): Promise<{
    safetyNumber: string;
    hashHex: string;
    blocks: string[];
    matrix: boolean[][];
  }> {
    const enc = new TextEncoder();
    const data = enc.encode(`${sharedSecret}::${saltBase64}::e2ee-v1`);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Generate 12 numbers each 5 digits
    const blocks: string[] = [];
    for (let i = 0; i < 12; i++) {
      // Pick 2 bytes
      const b1 = hashArray[(i * 2) % hashArray.length];
      const b2 = hashArray[(i * 2 + 1) % hashArray.length];
      const val = ((b1 << 8) | b2) % 100000;
      blocks.push(val.toString().padStart(5, '0'));
    }

    const safetyNumber = blocks.join(' ');

    // Generate pseudo QR pattern (17x17)
    const size = 17;
    const matrix: boolean[][] = [];
    for (let r = 0; r < size; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < size; c++) {
        // Finder patterns in corners
        const isCorner =
          (r < 5 && c < 5) ||
          (r < 5 && c >= size - 5) ||
          (r >= size - 5 && c < 5);
        if (isCorner) {
          const border =
            r === 0 || r === 4 || c === 0 || c === 4 ||
            r === 0 || r === 4 || c === size - 5 || c === size - 1 ||
            r === size - 5 || r === size - 1 || c === 0 || c === 4;
          const center =
            (r === 2 && c === 2) ||
            (r === 2 && c === size - 3) ||
            (r === size - 3 && c === 2);
          row.push(border || center);
        } else {
          // pseudo-random from hash
          const bitIndex = (r * size + c) % (hashArray.length * 8);
          const byte = hashArray[Math.floor(bitIndex / 8)];
          const bit = (byte >> (bitIndex % 8)) & 1;
          row.push(bit === 1);
        }
      }
      matrix.push(row);
    }

    return {
      safetyNumber,
      hashHex,
      blocks,
      matrix,
    };
  }

  /**
   * Generates a random cryptographic key phrase or passphrase
   */
  public static generateRandomPassphrase(): string {
    const words = [
      'cipher', 'shadow', 'quantum', 'shield', 'emerald', 'stealth', 'falcon',
      'aurora', 'matrix', 'beacon', 'protocol', 'sentinel', 'prism', 'valkyrie',
      'apex', 'vertex', 'orbit', 'hydra', 'nebula', 'titan', 'echo', 'vector'
    ];
    const array = new Uint32Array(4);
    window.crypto.getRandomValues(array);
    const chosen = Array.from(array).map(idx => words[idx % words.length]);
    const num = (array[0] % 900 + 100).toString();
    return `${chosen.join('-')}-${num}`;
  }

  /**
   * Generates a fresh random 16-byte base64 salt
   */
  public static generateSalt(): string {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    return arrayBufferToBase64(salt.buffer);
  }
}
