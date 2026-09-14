import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Check, CheckCheck, Flame, Search, Play, Pause, Volume2, Image as ImageIcon } from 'lucide-react';
import { ChatMessage } from '../types/chat';

interface Props {
  message: ChatMessage;
  onInspectCipher: (msg: ChatMessage) => void;
  onBurnExpired: (id: string) => void;
}

export const MessageBubble: React.FC<Props> = ({ message, onInspectCipher, onBurnExpired }) => {
  const isMe = message.sender === 'me';
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // Handle ephemeral burn countdown
  useEffect(() => {
    if (!message.expiresAt) return;

    const updateRemaining = () => {
      const diff = Math.max(0, Math.ceil((message.expiresAt! - Date.now()) / 1000));
      setSecondsRemaining(diff);
      if (diff <= 0) {
        onBurnExpired(message.id);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [message.expiresAt, message.id, onBurnExpired]);

  const timeString = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`group flex flex-col mb-3.5 transition-all ${
        isMe ? 'items-end' : 'items-start'
      } ${message.isBurning ? 'animate-burn' : ''}`}
    >
      {/* Sender Tag */}
      <div className="flex items-center gap-1.5 px-1 mb-1 text-[10px] text-slate-500">
        <span className="font-medium text-slate-400">{message.senderName}</span>
        <span>•</span>
        <span className="flex items-center gap-0.5 text-emerald-400/90 font-mono">
          <Lock className="w-2.5 h-2.5" />
          E2EE
        </span>
        {secondsRemaining !== null && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono text-[9px] animate-pulse">
            <Flame className="w-2.5 h-2.5" />
            {secondsRemaining}s
          </span>
        )}
      </div>

      {/* Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-md transition-all ${
          isMe
            ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 text-slate-100 rounded-tr-sm'
            : 'bg-gradient-to-br from-slate-900 via-[#0f172a] to-slate-900 border border-slate-700/60 text-slate-200 rounded-tl-sm'
        }`}
      >
        {/* Content Types */}
        {message.type === 'voice' ? (
          <div className="flex items-center gap-3 py-1 pr-2">
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center hover:scale-105 transition shrink-0"
            >
              {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 translate-x-0.5" />}
            </button>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-0.5 h-6">
                {[4, 12, 8, 16, 20, 10, 14, 18, 6, 15, 22, 9, 12, 18, 8, 14, 10].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${isPlayingAudio ? (h * (i % 2 === 0 ? 1.2 : 0.8)) : h}px` }}
                    className={`w-1 rounded-full transition-all duration-200 ${
                      isPlayingAudio ? 'bg-emerald-400' : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0:08 (Verschlüsseltes Audio)</span>
                <Volume2 className="w-3 h-3 text-emerald-400" />
              </div>
            </div>
          </div>
        ) : message.type === 'image' ? (
          <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden bg-black/50 border border-slate-700/50 aspect-video flex items-center justify-center">
              <div className="text-center p-4 space-y-1">
                <ImageIcon className="w-8 h-8 text-cyan-400 mx-auto opacity-80" />
                <span className="text-[11px] text-slate-300 font-mono block">AES-256 Bildanhang</span>
                <span className="text-[9px] text-slate-500 font-mono">Sha256 Payload geschützt</span>
              </div>
            </div>
            {message.plaintext && <p className="text-xs text-slate-200 px-0.5">{message.plaintext}</p>}
          </div>
        ) : (
          <p className="text-xs sm:text-sm font-sans leading-relaxed break-words whitespace-pre-wrap select-text">
            {message.plaintext}
          </p>
        )}

        {/* Message Meta & Action Bar */}
        <div className="flex items-center justify-between gap-3 mt-2 pt-1.5 border-t border-white/5 text-[10px] text-slate-400 font-mono">
          <button
            onClick={() => onInspectCipher(message)}
            className="flex items-center gap-1 text-cyan-400/90 hover:text-cyan-300 transition py-0.5 px-1 rounded hover:bg-cyan-500/10 text-[10px]"
            title="Ciphertext & Hex analysieren"
          >
            <Search className="w-2.5 h-2.5" />
            Cipher-Prüfung
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <span>{timeString}</span>
            {isMe && (
              <span className="text-emerald-400">
                {message.status === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
