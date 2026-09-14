import { ChatRoom, ChatMessage } from '../types/chat';
import { CryptoService } from './cryptoService';

const ROOMS_KEY = 'encrypted_chat_rooms_v1';
const MESSAGES_KEY = 'encrypted_chat_messages_v1';
const ACTIVE_ROOM_KEY = 'encrypted_chat_active_room_v1';
const PERSPECTIVE_KEY = 'encrypted_chat_perspective_v1';

export class StorageService {
  public static async getInitialRooms(): Promise<ChatRoom> {
    const defaultSecret = 'stevo-e2ee-vault-secret-key-999';
    const defaultSalt = CryptoService.generateSalt();
    const safetyData = await CryptoService.generateSafetyNumber(defaultSecret, defaultSalt);

    const defaultRoom: ChatRoom = {
      id: 'stevo-room-1',
      name: 'Stevo (E2EE AES-256)',
      statusText: 'E2EE Aktiviert • AES-GCM 256-Bit',
      avatar: '🔒',
      sharedSecret: defaultSecret,
      salt: defaultSalt,
      safetyNumber: safetyData.safetyNumber,
      isVerified: true,
      disappearingTimeSeconds: 30, // 30 seconds default ephemeral
      unreadCount: 0,
      lastMessage: 'Willkommen im verschlüsselten Kanal. Alle Daten sind mit AES-256 Ende-zu-Ende geschützt.',
      lastMessageTime: Date.now() - 360000,
      fingerprintHash: safetyData.hashHex,
    };

    return defaultRoom;
  }

  public static async getRooms(): Promise<ChatRoom[]> {
    const raw = localStorage.getItem(ROOMS_KEY);
    if (!raw) {
      const room1 = await this.getInitialRooms();
      
      const secret2 = 'project-alpha-e2ee-confidential-2026';
      const salt2 = CryptoService.generateSalt();
      const safety2 = await CryptoService.generateSafetyNumber(secret2, salt2);
      const room2: ChatRoom = {
        id: 'room-vault-2',
        name: 'Sicherheits-Tresor (Notizen)',
        statusText: 'Lokaler Ende-zu-Ende Notizspeicher',
        avatar: '🛡️',
        sharedSecret: secret2,
        salt: salt2,
        safetyNumber: safety2.safetyNumber,
        isVerified: true,
        disappearingTimeSeconds: 0, // No auto burn
        unreadCount: 0,
        lastMessage: 'Geheime Seed-Phrasen und Passwörter hier sicher aufbewahren.',
        lastMessageTime: Date.now() - 7200000,
        fingerprintHash: safety2.hashHex,
      };

      const rooms = [room1, room2];
      localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
      return rooms;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static saveRooms(rooms: ChatRoom[]): void {
    localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
  }

  public static async getMessages(roomId: string): Promise<ChatMessage[]> {
    const raw = localStorage.getItem(MESSAGES_KEY);
    let allMessages: ChatMessage[] = [];
    if (raw) {
      try {
        allMessages = JSON.parse(raw);
      } catch {
        allMessages = [];
      }
    }

    // Filter out expired ephemeral messages
    const now = Date.now();
    const valid = allMessages.filter(m => !m.expiresAt || m.expiresAt > now);
    if (valid.length !== allMessages.length) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(valid));
    }

    const roomMsgs = valid.filter(m => m.roomId === roomId);

    // If room has no messages yet and it's room1, populate initial sample encrypted messages
    if (roomMsgs.length === 0 && roomId === 'stevo-room-1') {
      const room = (await this.getRooms()).find(r => r.id === roomId);
      if (room) {
        const text1 = 'Hallo Stevo! Unsere Unterhaltung ist nun mit echter AES-256-GCM Verschlüsselung abgesichert. Niemand dazwischen kann mitlesen.';
        const enc1 = await CryptoService.encrypt(text1, room.sharedSecret, room.salt);

        const text2 = 'Perfekt! Ich habe den 60-stelligen Sicherheitsfingerabdruck überprüft. Er stimmt überein.';
        const enc2 = await CryptoService.encrypt(text2, room.sharedSecret, room.salt);

        const text3 = 'Selbstzerstörende Nachrichten sind auf 30 Sekunden eingestellt. Klicke auf eine Nachricht, um den Cipher-Inspector zu öffnen!';
        const enc3 = await CryptoService.encrypt(text3, room.sharedSecret, room.salt);

        const initial: ChatMessage[] = [
          {
            id: 'm-1',
            roomId: roomId,
            sender: 'partner',
            senderName: 'Stevo',
            plaintext: text1,
            encrypted: enc1,
            timestamp: Date.now() - 120000,
            status: 'read',
            type: 'text',
          },
          {
            id: 'm-2',
            roomId: roomId,
            sender: 'me',
            senderName: 'Ich',
            plaintext: text2,
            encrypted: enc2,
            timestamp: Date.now() - 60000,
            status: 'read',
            type: 'text',
          },
          {
            id: 'm-3',
            roomId: roomId,
            sender: 'partner',
            senderName: 'Stevo',
            plaintext: text3,
            encrypted: enc3,
            timestamp: Date.now() - 15000,
            status: 'read',
            type: 'text',
            ttlSeconds: 60,
            expiresAt: Date.now() + 45000, // will burn in 45s
          },
        ];

        valid.push(...initial);
        localStorage.setItem(MESSAGES_KEY, JSON.stringify(valid));
        return initial;
      }
    }

    return roomMsgs;
  }

  public static saveMessage(message: ChatMessage): void {
    const raw = localStorage.getItem(MESSAGES_KEY);
    const messages: ChatMessage[] = raw ? JSON.parse(raw) : [];
    messages.push(message);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }

  public static deleteMessage(messageId: string): void {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return;
    const messages: ChatMessage[] = JSON.parse(raw);
    const updated = messages.filter(m => m.id !== messageId);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
  }

  public static purgeAll(): void {
    localStorage.removeItem(ROOMS_KEY);
    localStorage.removeItem(MESSAGES_KEY);
    localStorage.removeItem(ACTIVE_ROOM_KEY);
  }
}
