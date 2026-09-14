import React, { useState } from 'react';
import { Flame, AlertOctagon, X, ShieldAlert } from 'lucide-react';

interface Props {
  onConfirmBurn: () => void;
  onClose: () => void;
}

export const BurnConfirmationModal: React.FC<Props> = ({ onConfirmBurn, onClose }) => {
  const [confirmText, setConfirmText] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-[#120a0d] border border-rose-600/40 rounded-2xl shadow-2xl overflow-hidden text-center">
        {/* Top Warning Banner */}
        <div className="p-6 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 animate-pulse">
            <Flame className="w-8 h-8" />
          </div>

          <h3 className="font-bold text-lg text-rose-400 flex items-center justify-center gap-2">
            <AlertOctagon className="w-5 h-5" />
            Notfall-Löschung (Panic Wipe)
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed">
            Möchtest du wirklich alle Chats, Verschlüsselungsschlüssel und Nachrichten unwiderruflich aus dem Gerätespeicher vernichten?
          </p>

          <div className="p-3 bg-black/50 rounded-xl border border-rose-950/80 text-[11px] text-rose-300 font-mono">
            ⚠️ Alle AES-256 Schlüssel werden überschrieben. Wiederherstellung ist unmöglich!
          </div>

          <div className="text-left space-y-1 pt-2">
            <label className="text-[11px] text-slate-400">Tippe "BURN" zur Bestätigung:</label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="BURN"
              className="w-full bg-black/70 border border-rose-800/80 rounded-xl px-3 py-2 text-center text-sm font-mono text-rose-400 placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-rose-950 bg-black/40 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirmBurn}
            disabled={confirmText.trim().toUpperCase() !== 'BURN'}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-950/60 disabled:text-rose-800/50 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/50"
          >
            <ShieldAlert className="w-4 h-4" />
            Alles vernichten
          </button>
        </div>
      </div>
    </div>
  );
};
