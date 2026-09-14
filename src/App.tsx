import React, { useState, useEffect, useRef } from 'react';
import { ChatRoom, ChatMessage } from './types/chat';
import { StorageService } from './services/storageService';
import { CryptoService } from './services/cryptoService';
import { AndroidFrame } from './components/AndroidFrame';
import { ChatList } from './components/ChatList';
import { ChatHeader } from './components/ChatHeader';
import { MessageBubble } from './components/MessageBubble';
import { MessageInput } from './components/MessageInput';
import { CipherInspectorModal } from './components/CipherInspectorModal';
import { SafetyNumberModal } from './components/SafetyNumberModal';
import { RoomSettingsModal } from './components/RoomSettingsModal';
import { NewChatModal } from './components/NewChatModal';
import { BurnConfirmationModal } from './components/BurnConfirmationModal';
import { Shield, Lock, ShieldCheck, KeyRound } from 'lucide-react';

export const App: React.FC = () => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activePerspective, setActivePerspective] = useState<'me' | 'partner'>('me');
  const [isDeviceFrame, setIsDeviceFrame] = useState(true);

  // Modals
  const [inspectingMessage, setInspectingMessage] = useState<ChatMessage | null>(null);
  const [showSafetyNumber, setShowSafetyNumber] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showPanicBurn, setShowPanicBurn] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load rooms on startup
  useEffect(() => {
    StorageService.getRooms().then((loaded) => {
      setRooms(loaded);
      if (loaded.length > 0 && !activeRoomId) {
        setActiveRoomId(loaded[0].id);
      }
    });
  }, []);

  // Load messages whenever activeRoomId changes
  useEffect(() => {
    if (!activeRoomId) return;
    StorageService.getMessages(activeRoomId).then((msgs) => {
      setMessages(msgs);
    });
  }, [activeRoomId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || rooms[0];

  // Send a new encrypted message
  const handleSendMessage = async (text: string, type: 'text' | 'voice' | 'image' = 'text') => {
    if (!activeRoom) return;

    try {
      const encrypted = await CryptoService.encrypt(text, activeRoom.sharedSecret, activeRoom.salt);

      const ttl = activeRoom.disappearingTimeSeconds;
      const expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : undefined;

      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        roomId: activeRoom.id,
        sender: activePerspective,
        senderName: activePerspective === 'me' ? 'Ich' : activeRoom.name.split(' ')[0],
        plaintext: text,
        encrypted,
        timestamp: Date.now(),
        status: 'read',
        type,
        ttlSeconds: ttl > 0 ? ttl : undefined,
        expiresAt,
      };

      StorageService.saveMessage(newMessage);
      setMessages((prev) => [...prev, newMessage]);

      // Update room last message
      const updatedRooms = rooms.map((r) =>
        r.id === activeRoom.id
          ? {
              ...r,
              lastMessage: type === 'voice' ? '🎤 Sprachnachricht' : type === 'image' ? '📷 Bild' : text,
              lastMessageTime: Date.now(),
            }
          : r
      );
      setRooms(updatedRooms);
      StorageService.saveRooms(updatedRooms);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Simulate an incoming encrypted reply from partner
  const handleSimulateIncoming = async () => {
    if (!activeRoom) return;

    const partnerReplies = [
      'AES-256-GCM Signatur verifiziert. Alles ist sicher und verschlüsselt.',
      'Perfekt, mein 60-stelliger Sicherheitsfingerabdruck stimmt exakt überein!',
      'Geheime Schlüsselaktualisierung durchgeführt. Ende-zu-Ende Verbindung steht.',
      'Hier ist meine verschlüsselte Bestätigung. Niemand kann mitlesen.',
      'Sicherheitsaudit erfolgreich: 0 Sicherheitslücken gefunden.',
    ];

    const randomReply = partnerReplies[Math.floor(Math.random() * partnerReplies.length)];

    try {
      const encrypted = await CryptoService.encrypt(randomReply, activeRoom.sharedSecret, activeRoom.salt);
      const ttl = activeRoom.disappearingTimeSeconds;
      const expiresAt = ttl > 0 ? Date.now() + ttl * 1000 : undefined;

      const incomingMsg: ChatMessage = {
        id: `msg-in-${Date.now()}`,
        roomId: activeRoom.id,
        sender: 'partner',
        senderName: activeRoom.name.split(' ')[0],
        plaintext: randomReply,
        encrypted,
        timestamp: Date.now(),
        status: 'read',
        type: 'text',
        ttlSeconds: ttl > 0 ? ttl : undefined,
        expiresAt,
      };

      StorageService.saveMessage(incomingMsg);
      setMessages((prev) => [...prev, incomingMsg]);

      const updatedRooms = rooms.map((r) =>
        r.id === activeRoom.id
          ? {
              ...r,
              lastMessage: randomReply,
              lastMessageTime: Date.now(),
            }
          : r
      );
      setRooms(updatedRooms);
      StorageService.saveRooms(updatedRooms);
    } catch (err) {
      console.error('Error simulating incoming message:', err);
    }
  };

  // Handle burning expired ephemeral message
  const handleBurnExpired = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isBurning: true } : m))
    );
    setTimeout(() => {
      StorageService.deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 1100);
  };

  // Panic wipe everything
  const handlePanicBurn = async () => {
    StorageService.purgeAll();
    setShowPanicBurn(false);
    const initial = await StorageService.getRooms();
    setRooms(initial);
    if (initial.length > 0) {
      setActiveRoomId(initial[0].id);
      const msgs = await StorageService.getMessages(initial[0].id);
      setMessages(msgs);
    }
  };

  // Update room settings
  const handleUpdateRoom = (updated: ChatRoom) => {
    const updatedRooms = rooms.map((r) => (r.id === updated.id ? updated : r));
    setRooms(updatedRooms);
    StorageService.saveRooms(updatedRooms);
  };

  // Clear messages of current room
  const handleClearMessages = () => {
    if (!activeRoom) return;
    setMessages([]);
    const raw = localStorage.getItem('encrypted_chat_messages_v1');
    if (raw) {
      const all: ChatMessage[] = JSON.parse(raw);
      const filtered = all.filter((m) => m.roomId !== activeRoom.id);
      localStorage.setItem('encrypted_chat_messages_v1', JSON.stringify(filtered));
    }
    const updatedRooms = rooms.map((r) =>
      r.id === activeRoom.id ? { ...r, lastMessage: 'Chat geleert' } : r
    );
    setRooms(updatedRooms);
    StorageService.saveRooms(updatedRooms);
  };

  // Add new room
  const handleAddRoom = (newRoom: ChatRoom) => {
    const next = [newRoom, ...rooms];
    setRooms(next);
    StorageService.saveRooms(next);
    setActiveRoomId(newRoom.id);
    setMessages([]);
    setIsMobileListOpen(false);
  };

  return (
    <AndroidFrame
      isDeviceFrame={isDeviceFrame}
      onToggleFrame={() => setIsDeviceFrame(!isDeviceFrame)}
    >
      <div className="flex-1 w-full h-full flex overflow-hidden bg-[#070a10] relative">
        {/* Split View Left: Chat List (Visible always on wider screens, or conditional on mobile) */}
        <div
          className={`${
            isMobileListOpen ? 'flex' : 'hidden md:flex'
          } flex-col w-full md:w-80 lg:w-96 h-full border-r border-slate-800/80 shrink-0 z-20 bg-[#070a10] absolute md:relative inset-0`}
        >
          <ChatList
            rooms={rooms}
            activeRoomId={activeRoomId}
            onSelectRoom={(id) => {
              setActiveRoomId(id);
              setIsMobileListOpen(false);
            }}
            onOpenNewChat={() => setShowNewChat(true)}
            onOpenPanicBurn={() => setShowPanicBurn(true)}
          />
        </div>

        {/* Split View Right: Active Chat Room */}
        <div
          className={`${
            isMobileListOpen ? 'hidden md:flex' : 'flex'
          } flex-1 flex-col h-full bg-[#070a10] overflow-hidden relative`}
        >
          {activeRoom ? (
            <>
              {/* Material 3 Top App Bar */}
              <ChatHeader
                room={activeRoom}
                onBack={() => setIsMobileListOpen(true)}
                onOpenSafetyNumber={() => setShowSafetyNumber(true)}
                onOpenSettings={() => setShowSettings(true)}
                onOpenPanicBurn={() => setShowPanicBurn(true)}
                activePerspective={activePerspective}
                onTogglePerspective={() =>
                  setActivePerspective(activePerspective === 'me' ? 'partner' : 'me')
                }
              />

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gradient-to-b from-[#070a10] via-[#090e18] to-[#070a10]">
                {/* Security Announcement Card */}
                <div className="max-w-xs sm:max-w-sm mx-auto my-3 p-3 rounded-2xl bg-slate-900/80 border border-emerald-500/20 text-center space-y-1.5 shadow-sm">
                  <div className="w-8 h-8 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200">
                    Ende-zu-Ende Verschlüsselt
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Nachrichten und Anrufe in diesem Chat sind mit AES-256-GCM geschützt. Weder Dritte noch Netzbetreiber können sie lesen.
                  </p>
                  <button
                    onClick={() => setShowSafetyNumber(true)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-medium underline block pt-0.5 mx-auto"
                  >
                    Sicherheitsfingerabdruck anzeigen
                  </button>
                </div>

                {/* Messages */}
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500 space-y-2">
                    <p>Noch keine Nachrichten in diesem Raum.</p>
                    <p className="text-[11px] text-slate-600">
                      Tippe unten eine Nachricht ein oder nutze "Antwort simulieren".
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      onInspectCipher={(m) => setInspectingMessage(m)}
                      onBurnExpired={handleBurnExpired}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <MessageInput
                onSendMessage={handleSendMessage}
                onSimulateIncoming={handleSimulateIncoming}
                isEphemeralActive={activeRoom.disappearingTimeSeconds > 0}
                ttlSeconds={activeRoom.disappearingTimeSeconds}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
              Kein Chat ausgewählt
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {inspectingMessage && activeRoom && (
        <CipherInspectorModal
          message={inspectingMessage}
          sharedSecret={activeRoom.sharedSecret}
          onClose={() => setInspectingMessage(null)}
        />
      )}

      {showSafetyNumber && activeRoom && (
        <SafetyNumberModal
          room={activeRoom}
          onUpdateVerification={(verified) =>
            handleUpdateRoom({ ...activeRoom, isVerified: verified })
          }
          onClose={() => setShowSafetyNumber(false)}
        />
      )}

      {showSettings && activeRoom && (
        <RoomSettingsModal
          room={activeRoom}
          onUpdateRoom={handleUpdateRoom}
          onClearMessages={handleClearMessages}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showNewChat && (
        <NewChatModal
          onAddRoom={handleAddRoom}
          onClose={() => setShowNewChat(false)}
        />
      )}

      {showPanicBurn && (
        <BurnConfirmationModal
          onConfirmBurn={handlePanicBurn}
          onClose={() => setShowPanicBurn(false)}
        />
      )}
    </AndroidFrame>
  );
};
