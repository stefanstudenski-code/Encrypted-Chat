import React, { useState, useEffect } from 'react';
import { ShieldCheck, QrCode, Copy, Check, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { ChatRoom } from '../types/chat';
import { CryptoService } from '../services/cryptoService';

interface Props {
  room: ChatRoom;
  onUpdateVerification: (verified: boolean) => void;
  onClose: () => void;
}

export const SafetyNumberModal: React.FC<Props> = ({ room, onUpdateVerification, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [safetyData, setSafetyData] = useState<{
    safetyNumber: string;
    hashHex: string;
    blocks: string[];
    matrix: boolean[][];
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    CryptoService.generateSafetyNumber(room.sharedSecret, room.salt).then((data) => {
      if (mounted) setSafetyData(data);
    });
    return () => {
      mounted = false;
    };
  }, [room.sharedSecret, room.salt]);

  const handleCopy = () => {
    if (!safetyData) return;
    navigator.clipboard.writeText(safetyData.safetyNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-[#0c111c] border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#070a10]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">Sicherheitsnummer verifizieren</h3>
              <p className="text-xs text-slate-400">{room.name}</p>
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
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-center">
          <p className="text-xs text-slate-400 leading-relaxed">
            Vergleiche diesen 60-stelligen Fingerabdruck mit deinem Chat-Partner (z.B. persönlich oder per Sprachübertragung), um sicherzustellen, dass kein Dritter die Ende-zu-Ende Verschlüsselung abfängt.
          </p>

          {/* QR Code / Matrix */}
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-2xl shadow-lg inline-block border-4 border-emerald-500/30">
              {safetyData ? (
                <div className="grid grid-cols-17 gap-0.5 w-40 h-40">
                  {safetyData.matrix.flat().map((bit, idx) => (
                    <div
                      key={idx}
                      className={`w-full h-full rounded-sm ${bit ? 'bg-slate-950' : 'bg-transparent'}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                </div>
              )}
            </div>
          </div>

          {/* 60-Digit Numbers in 12 Blocks */}
          <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800">
            {safetyData ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 font-mono text-sm tracking-wider text-emerald-400 font-semibold">
                {safetyData.blocks.map((block, i) => (
                  <div key={i} className="py-1 px-1.5 bg-black/40 rounded border border-slate-800 text-center">
                    {block}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-3">Berechne SHA-256 Fingerabdruck...</div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Kopiert' : 'Fingerabdruck kopieren'}
            </button>
          </div>

          {/* Verification Switch */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-left">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <CheckCircle className={`w-4 h-4 ${room.isVerified ? 'text-emerald-400' : 'text-slate-500'}`} />
                Kontakt als verifiziert markieren
              </span>
              <p className="text-[11px] text-slate-400">
                Aktiviert das grüne Schutzschild im Chat.
              </p>
            </div>
            <button
              onClick={() => onUpdateVerification(!room.isVerified)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                room.isVerified ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  room.isVerified ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="text-[11px] text-slate-500 text-left flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg">
            <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Falls sich der Fingerabdruck deines Kontakts in Zukunft ändert, warnt dich die App vor einer potenziellen Schlüssel-Änderung oder einem Man-in-the-Middle Angriff.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#070a10] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};
