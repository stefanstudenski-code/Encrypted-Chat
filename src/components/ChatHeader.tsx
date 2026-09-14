import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Shield, Key, Timer, MoreVertical, Flame, Settings, UserCheck, Users } from 'lucide-react';
import { ChatRoom, EPHEMERAL_OPTIONS } from '../types/chat';

interface Props {
  room: ChatRoom;
  onBack: () => void;
  onOpenSafetyNumber: () => void;
  onOpenSettings: () => void;
  onOpenPanicBurn: () => void;
  activePerspective: 'me' | 'partner';
  onTogglePerspective: () => void;
}

export const ChatHeader: React.FC<Props> = ({
  room,
  onBack,
  onOpenSafetyNumber,
  onOpenSettings,
  onOpenPanicBurn,
  activePerspective,
  onTogglePerspective,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const timerLabel = EPHEMERAL_OPTIONS.find(
    (o) => o.seconds === room.disappearingTimeSeconds
  )?.label;

  return (
    <header className="px-3 py-2.5 bg-[#070a10] border-b border-slate-800/90 flex items-center justify-between gap-2 select-none relative z-30">
      {/* Left: Back & Room Info */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onBack}
          className="p-2 -ml-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          title="Zurück zu den Chats"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar with Security Badge */}
        <div className="relative shrink-0 cursor-pointer" onClick={onOpenSettings}>
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-lg shadow-inner">
            {room.avatar}
          </div>
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center border border-[#070a10] ${
              room.isVerified ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-300'
            }`}
            title={room.isVerified ? 'Sicherheitsnummer verifiziert' : 'Nicht verifiziert'}
          >
            {room.isVerified ? (
              <ShieldCheck className="w-2.5 h-2.5" />
            ) : (
              <Shield className="w-2.5 h-2.5" />
            )}
          </div>
        </div>

        {/* Title & Status */}
        <div className="min-w-0 cursor-pointer" onClick={onOpenSettings}>
          <h2 className="text-sm font-semibold text-slate-100 truncate flex items-center gap-1.5">
            {room.name}
            {room.isVerified && (
              <span className="text-[10px] text-emerald-400 font-mono font-normal">✓</span>
            )}
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="truncate text-slate-400">
              {room.disappearingTimeSeconds > 0 ? `Timer: ${timerLabel}` : 'AES-256 E2EE'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1">
        {/* Perspective Switch Button (Alice ↔ Partner) */}
        <button
          onClick={onTogglePerspective}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition ${
            activePerspective === 'me'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
              : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20'
          }`}
          title="Wechsle die Perspektive, um zu testen wie beide Parteien verschlüsselt kommunizieren"
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Als:</span>
          <span className="font-semibold">
            {activePerspective === 'me' ? 'Ich' : room.name.split(' ')[0]}
          </span>
        </button>

        {/* Safety Number Modal Button */}
        <button
          onClick={onOpenSafetyNumber}
          className="p-2 rounded-full text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition"
          title="Sicherheitsnummer & Fingerabdruck"
        >
          <ShieldCheck className="w-5 h-5" />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          title="Chat-Einstellungen & Schlüssel"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* More Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#0c111c] border border-slate-700/80 rounded-xl shadow-xl py-1.5 text-xs text-slate-200 z-50 animate-fadeIn">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenSafetyNumber();
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800/80 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Sicherheitsnummer
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenSettings();
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-800/80 flex items-center gap-2"
              >
                <Key className="w-4 h-4 text-cyan-400" />
                AES Schlüssel verwalten
              </button>
              <div className="my-1 border-t border-slate-800" />
              <button
                onClick={() => {
                  setShowMenu(false);
                  onOpenPanicBurn();
                }}
                className="w-full text-left px-3 py-2 hover:bg-rose-950/40 text-rose-400 flex items-center gap-2"
              >
                <Flame className="w-4 h-4 text-rose-500" />
                Notfall-Löschung (Panic)
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
