import React, { useState } from 'react';
import { Settings, Timer, Key, Shield, RefreshCw, Trash2, X, Check, Copy } from 'lucide-react';
import { ChatRoom, EPHEMERAL_OPTIONS } from '../types/chat';
import { CryptoService } from '../services/cryptoService';

interface Props {
  room: ChatRoom;
  onUpdateRoom: (updated: ChatRoom) => void;
  onClearMessages: () => void;
  onClose: () => void;
}

export const RoomSettingsModal: React.FC<Props> = ({
  room,
  onUpdateRoom,
  onClearMessages,
  onClose,
}) => {
  const [disappearingTime, setDisappearingTime] = useState(room.disappearingTimeSeconds);
  const [secret, setSecret] = useState(room.sharedSecret);
  const [roomName, setRoomName] = useState(room.name);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerateNewSecret = () => {
    const newSec = CryptoService.generateRandomPassphrase();
    setSecret(newSec);
  };

  const handleSave = async () => {
    let newSalt = room.salt;
    let safetyNumber = room.safetyNumber;
    let fingerprintHash = room.fingerprintHash;

    if (secret !== room.sharedSecret) {
      newSalt = CryptoService.generateSalt();
      const safetyData = await CryptoService.generateSafetyNumber(secret, newSalt);
      safetyNumber = safetyData.safetyNumber;
      fingerprintHash = safetyData.hashHex;
    }

    const updated: ChatRoom = {
      ...room,
      name: roomName,
      sharedSecret: secret,
      salt: newSalt,
      safetyNumber,
      fingerprintHash,
      disappearingTimeSeconds: disappearingTime,
      statusText: disappearingTime > 0 ? `Selbstzerstörung: ${EPHEMERAL_OPTIONS.find(o => o.seconds === disappearingTime)?.label}` : 'AES-GCM 256-Bit E2EE',
    };

    onUpdateRoom(updated);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-[#0c111c] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#070a10]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-200">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">Chat-Sicherheit & Einstellungen</h3>
              <p className="text-xs text-slate-400">Verschlüsselungsparameter konfigurieren</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-300">
          {/* Room Name */}
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium">Chat-Name / Kontakt</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500 text-sm"
            />
          </div>

          {/* Ephemeral Disappearing Messages */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200 font-medium">
                <Timer className="w-4 h-4 text-amber-400" />
                <span>Selbstzerstörende Nachrichten</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {EPHEMERAL_OPTIONS.find((o) => o.seconds === disappearingTime)?.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Nachrichten verbrennen und löschen sich nach Ablauf des Timers automatisch unwiderruflich aus dem Speicher.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 pt-1">
              {EPHEMERAL_OPTIONS.map((opt) => (
                <button
                  key={opt.seconds}
                  type="button"
                  onClick={() => setDisappearingTime(opt.seconds)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition border ${
                    disappearingTime === opt.seconds
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-sm'
                      : 'bg-black/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Shared Secret Key Management */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-200 font-medium">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>Gemeinsamer AES-GCM Schlüssel</span>
              </div>
              <button
                onClick={handleGenerateNewSecret}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-sans"
              >
                <RefreshCw className="w-3 h-3" /> Neu generieren
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Der geheime Schlüssel zur Ableitung des 256-Bit Schlüssels. Muss beiden Seiten bekannt sein.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="flex-1 bg-black/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(secret);
                  setCopiedSecret(true);
                  setTimeout(() => setCopiedSecret(false), 2000);
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Kopieren"
              >
                {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Danger Zone: Clear messages */}
          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-semibold text-rose-400 text-xs">Chatverlauf leeren</span>
              <p className="text-[11px] text-slate-400">Löscht alle gespeicherten Nachrichten dieses Chats.</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Möchtest du wirklich alle Nachrichten dieses Chats sicher löschen?')) {
                  onClearMessages();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Leeren
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#070a10] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium shadow-md transition"
          >
            {isSaved ? <Check className="w-4 h-4 text-white" /> : <Shield className="w-4 h-4" />}
            {isSaved ? 'Gespeichert' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
};
