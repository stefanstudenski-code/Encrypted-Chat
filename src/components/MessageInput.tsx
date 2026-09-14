import React, { useState, useRef } from 'react';
import { Send, Mic, Image as ImageIcon, Sparkles, StopCircle, Paperclip } from 'lucide-react';

interface Props {
  onSendMessage: (text: string, type?: 'text' | 'voice' | 'image') => void;
  onSimulateIncoming: () => void;
  isEphemeralActive: boolean;
  ttlSeconds: number;
}

export const MessageInput: React.FC<Props> = ({
  onSendMessage,
  onSimulateIncoming,
  isEphemeralActive,
  ttlSeconds,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim(), 'text');
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Finish recording
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      onSendMessage(`Sprachnachricht (${recordSeconds}s)`, 'voice');
      setRecordSeconds(0);
    } else {
      // Start recording
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleSendImage = () => {
    onSendMessage('Verschlüsseltes Sicherheitsdokument.png', 'image');
  };

  return (
    <div className="p-3 bg-[#070a10] border-t border-slate-800/80">
      {/* Quick Helper Bar */}
      <div className="flex items-center justify-between pb-2 px-1 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-emerald-400">AES-256 E2EE aktiv</span>
          {isEphemeralActive && (
            <span className="text-amber-400">({ttlSeconds}s Selbstzerstörung)</span>
          )}
        </div>
        <button
          onClick={onSimulateIncoming}
          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-sans transition py-0.5 px-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20"
          title="Simuliert eine verschlüsselte eingehende Nachricht vom Chat-Partner"
        >
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Antwort simulieren</span>
        </button>
      </div>

      {/* Main Input Row */}
      <div className="flex items-center gap-2">
        {/* Attachment menu */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleSendImage}
            title="Verschlüsseltes Bild / Datei senden"
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition shrink-0"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Input Bar or Voice Recording Bar */}
        {isRecording ? (
          <div className="flex-1 flex items-center justify-between px-4 py-2 bg-rose-950/40 border border-rose-800 rounded-full text-xs animate-pulse">
            <div className="flex items-center gap-2 text-rose-400 font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Verschlüsselte Audioaufnahme: {recordSeconds}s</span>
            </div>
            <button
              onClick={toggleRecording}
              className="text-rose-400 hover:text-rose-300 font-medium font-sans flex items-center gap-1"
            >
              <StopCircle className="w-4 h-4" /> Beenden
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center bg-slate-900 border border-slate-800 focus-within:border-cyan-500/60 rounded-full px-4 py-1.5 transition">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Verschlüsselte Nachricht..."
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        )}

        {/* Voice Note Button */}
        <button
          type="button"
          onClick={toggleRecording}
          title={isRecording ? 'Aufnahme stoppen' : 'Verschlüsselte Sprachnachricht'}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition shrink-0 ${
            isRecording
              ? 'bg-rose-600 text-white animate-pulse'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          title="Verschlüsselt absenden"
          className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-950/40 transition active:scale-95 shrink-0"
        >
          <Send className="w-4 h-4 translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
