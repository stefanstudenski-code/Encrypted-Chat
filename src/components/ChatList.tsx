import React, { useState } from 'react';
import { Shield, Lock, Plus, Flame, Search, ShieldCheck, CheckCheck, Key, Info } from 'lucide-react';
import { ChatRoom } from '../types/chat';

interface Props {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onOpenNewChat: () => void;
  onOpenPanicBurn: () => void;
}

export const ChatList: React.FC<Props> = ({
  rooms,
  activeRoomId,
  onSelectRoom,
  onOpenNewChat,
  onOpenPanicBurn,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = rooms.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#070a10] text-slate-100 select-none">
      {/* Top Header */}
      <div className="px-4 py-3 bg-[#070a10] border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight flex items-center gap-1.5 text-white">
              Encrypted Chat
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                E2EE
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Native Android AES-256 Messenger</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenPanicBurn}
            className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition border border-rose-900/30"
            title="Notfall-Löschung (Panic Wipe)"
          >
            <Flame className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenNewChat}
            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md flex items-center gap-1 text-xs font-medium"
            title="Neuen verschlüsselten Chat starten"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Neuer Chat</span>
          </button>
        </div>
      </div>

      {/* Security Status Banner */}
      <div className="mx-3 mt-3 p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/30 border border-emerald-500/20 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>AES-GCM 256-Bit • PBKDF2 (100k) • Lokale Zero-Knowledge Speicherung</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Chats und Kontakte durchsuchen..."
            className="w-full bg-transparent text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <Lock className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-400">Keine verschlüsselten Chats gefunden.</p>
            <button
              onClick={onOpenNewChat}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
            >
              <Plus className="w-4 h-4" /> Ersten Chat starten
            </button>
          </div>
        ) : (
          filtered.map((room) => {
            const isSelected = room.id === activeRoomId;
            const timeStr = room.lastMessageTime
              ? new Date(room.lastMessageTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition border ${
                  isSelected
                    ? 'bg-slate-800/80 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900/40 border-transparent hover:bg-slate-900 hover:border-slate-800'
                }`}
              >
                {/* Avatar with Verified Shield */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-inner">
                    {room.avatar}
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border border-[#070a10] ${
                      room.isVerified ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-300'
                    }`}
                  >
                    {room.isVerified ? (
                      <ShieldCheck className="w-2.5 h-2.5" />
                    ) : (
                      <Shield className="w-2.5 h-2.5" />
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-sm text-slate-100 truncate flex items-center gap-1.5">
                      {room.name}
                      {room.isVerified && (
                        <span className="text-emerald-400 text-[10px]">✓</span>
                      )}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {timeStr}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <p className="truncate text-slate-400 pr-2 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-emerald-400/80 shrink-0" />
                      <span className="truncate">{room.lastMessage || 'Keine Nachrichten'}</span>
                    </p>
                    {room.disappearingTimeSeconds > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0 font-mono">
                        {room.disappearingTimeSeconds}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 bg-[#05070c] border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span className="flex items-center gap-1">
          <Key className="w-3 h-3 text-cyan-400" />
          Ende-zu-Ende Verschlüsselt
        </span>
        <span className="text-slate-600">v2.4 Native</span>
      </div>
    </div>
  );
};
