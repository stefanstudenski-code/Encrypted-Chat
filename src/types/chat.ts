export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string;         // Base64 (12 bytes for AES-GCM)
  salt: string;       // Base64 (16 bytes for PBKDF2)
  algorithm: string;  // e.g. "AES-256-GCM"
  tagLength: number;  // 128 bit authentication tag
  rawHexPreview: string; // Hex representation of raw ciphertext
  byteLength: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  sender: 'me' | 'partner' | 'system';
  senderName: string;
  plaintext?: string;
  encrypted: EncryptedPayload;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  type: 'text' | 'voice' | 'image' | 'system';
  mediaUrl?: string; // encrypted data URI or waveform
  duration?: number; // for audio
  ttlSeconds?: number; // 0 = off, > 0 = disappearing
  expiresAt?: number; // timestamp when it burns
  isBurning?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  statusText: string;
  avatar: string;
  sharedSecret: string; // Key phrase or derived key
  salt: string;
  safetyNumber: string; // 60-digit fingerprint formatted in 12 blocks of 5 digits
  isVerified: boolean;
  disappearingTimeSeconds: number; // 0 = disabled, 10, 30, 60, 300, etc.
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: number;
  fingerprintHash: string;
}

export type EphemeralOption = {
  label: string;
  seconds: number;
};

export const EPHEMERAL_OPTIONS: EphemeralOption[] = [
  { label: 'Aus', seconds: 0 },
  { label: '10 Sek.', seconds: 10 },
  { label: '30 Sek.', seconds: 30 },
  { label: '1 Min.', seconds: 60 },
  { label: '5 Min.', seconds: 300 },
  { label: '1 Stunde', seconds: 3600 },
  { label: '24 Stunden', seconds: 86400 },
];
