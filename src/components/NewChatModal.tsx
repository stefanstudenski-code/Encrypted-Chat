import React, { useState } from 'react';
import { Plus, Shield, Key, RefreshCw, X, Sparkles } from 'lucide-react';
import { ChatRoom, EPHEMERAL_OPTIONS } from '../types/chat';
import { CryptoService } from '../services/cryptoService';

interface Props {
  onAddRoom: (room: ChatRoom) => void;
  onClose: () => void;
}

const AVATARS = ['🔒', '🛡️', '⚡', '🗝️', '🛰️', '🕵️', '🤖', '🦊', '💎', '🔥'];

export const NewChatModal: React.FC<Props> = ({ onAddRoom, onClose }) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🔒');
  const [secret, setSecret] = useState(CryptoService.generateRandomPassphrase());
  const [disappearingTime, setDisappearingTime] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const handleGenerateSecret = () => {
    setSecret(CryptoService.generateRandomPassphrase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      const salt = CryptoService.generateSalt();
      const safetyData = await CryptoService.generateSafetyNumber(secret, salt);

      const newRoom: ChatRoom = {
        id: `room-${Date.now()}`,
        name: name.trim(),
        avatar,
        statusText: disappearingTime > 0 ? `Selbstzerstörung: ${EPHEMERAL_OPTIONS.find(o => o.seconds === disappearingTime)?.label}` : 'AES-GCM 256-Bit E2EE',
        sharedSecret: secret.trim(),
        salt,
        safetyNumber: safetyData.safetyNumber,
        isVerified: true,
        disappearingTimeSeconds: disappearingTime,
        unreadCount: 0,
        lastMessage: 'Verschlüsselter Kanal initialisiert.',
        lastMessageTime: Date.now(),
        fingerprintHash: safetyData.hashHex,
      };

      onAddRoom(newRoom);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0c111c] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#070a10]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">Neuer verschlüsselter Chat</h3>
              <p className="text-xs text-slate-400">E2EE Kanal mit AES-256-GCM erstellen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-300">
          {/* Avatar Picker */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Avatar Symbol</label>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition border shrink-0 ${
                    avatar === emoji
                      ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Kontakt- / Raum-Name</label>
            <input
              type="text"
              required
              placeholder="z.B. Bob (E2EE), Vertraulich, Projekt Vault..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 text-sm"
            />
          </div>

          {/* Secret Key */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-medium flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-cyan-400" />
                Verschlüsselungs-Schlüssel (Passphrase)
              </label>
              <button
                type="button"
                onClick={handleGenerateSecret}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-sans"
              >
                <RefreshCw className="w-3 h-3" /> Zufällig
              </button>
            </div>
            <input
              type="text"
              required
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full bg-black/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[10px] text-slate-500">
              Aus dieser Phrase wird mittels PBKDF2 (100.000 Runden) der 256-Bit Masterkey berechnet.
            </p>
          </div>

          {/* Ephemeral Timer */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Selbstzerstörung (Disappearing Messages)</label>
            <select
              value={disappearingTime}
              onChange={(e) => setDisappearingTime(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
            >
              {EPHEMERAL_OPTIONS.map((opt) => (
                <option key={opt.seconds} value={opt.seconds}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium shadow-md transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isCreating ? 'Erstelle...' : 'Chat erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
