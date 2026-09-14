import React, { useState } from 'react';
import { Shield, Lock, Key, Hash, FileCode, CheckCircle, AlertTriangle, X, Copy, Check } from 'lucide-react';
import { ChatMessage } from '../types/chat';
import { CryptoService } from '../services/cryptoService';

interface Props {
  message: ChatMessage;
  sharedSecret: string;
  onClose: () => void;
}

export const CipherInspectorModal: React.FC<Props> = ({ message, sharedSecret, onClose }) => {
  const [testSecret, setTestSecret] = useState(sharedSecret);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runTestDecryption = async () => {
    setIsDecrypting(true);
    try {
      const res = await CryptoService.decrypt(message.encrypted, testSecret);
      setTestResult(res);
    } catch {
      setTestResult('Fehler bei der Entschlüsselung.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const { encrypted } = message;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-[#0c111c] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#070a10]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2">
                Cipher-Inspector
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  AES-256-GCM
                </span>
              </h3>
              <p className="text-xs text-slate-400">Echtzeit-Kryptographie-Analyse dieser Nachricht</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-mono text-slate-300">
          {/* Plaintext Banner */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-sans">
              <span className="flex items-center gap-1.5 font-medium text-emerald-400 text-xs">
                <CheckCircle className="w-3.5 h-3.5" />
                Entschlüsselter Klartext (Auf deinem Gerät)
              </span>
              <span className="text-[11px] text-slate-500">{new Date(message.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="font-sans text-sm text-slate-100 bg-black/40 p-2.5 rounded-lg border border-slate-800/80">
              {message.plaintext || '[Kein Klartext verfügbar]'}
            </div>
          </div>

          {/* Raw Ciphertext (Base64) */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
                <Lock className="w-3.5 h-3.5" />
                Verschlüsselter Ciphertext (Base64 Payload)
              </span>
              <button
                onClick={() => copyToClipboard(encrypted.ciphertext, 'ciphertext')}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
              >
                {copiedKey === 'ciphertext' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedKey === 'ciphertext' ? 'Kopiert' : 'Kopieren'}
              </button>
            </div>
            <div className="bg-black/60 p-2.5 rounded-lg text-[11px] text-cyan-300 break-all border border-cyan-900/40 select-all max-h-24 overflow-y-auto">
              {encrypted.ciphertext}
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Länge: {encrypted.byteLength} Bytes</span>
              <span>Authentifizierungs-Tag: {encrypted.tagLength}-bit</span>
            </div>
          </div>

          {/* Hex View */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
                <FileCode className="w-3.5 h-3.5" />
                Hexadezimale Rohbytes (Was über das Netz übertragen wird)
              </span>
            </div>
            <div className="bg-black/60 p-2.5 rounded-lg text-[10px] text-indigo-300/90 break-all border border-indigo-950/40 select-all max-h-24 overflow-y-auto leading-relaxed">
              {encrypted.rawHexPreview}
            </div>
          </div>

          {/* Cryptographic Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* IV */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Initialisierungsvektor (IV)
                </span>
                <span className="text-[10px] text-slate-500">96-Bit Unikat</span>
              </div>
              <p className="text-[11px] text-amber-200/90 break-all bg-black/40 p-1.5 rounded border border-slate-800">
                {encrypted.iv}
              </p>
            </div>

            {/* Salt */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Key className="w-3 h-3" /> PBKDF2 Salt
                </span>
                <span className="text-[10px] text-slate-500">128-Bit Entropie</span>
              </div>
              <p className="text-[11px] text-emerald-200/90 break-all bg-black/40 p-1.5 rounded border border-slate-800">
                {encrypted.salt}
              </p>
            </div>
          </div>

          {/* Live Decryption Playground & Proof */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/20 border border-cyan-500/30 space-y-3 font-sans">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-cyan-400" />
                Interaktiver Entschlüsselungs-Beweis
              </h4>
              <span className="text-[11px] text-slate-400">Teste falschen vs. richtigen Schlüssel</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={testSecret}
                onChange={(e) => setTestSecret(e.target.value)}
                placeholder="Schlüssel eingeben..."
                className="flex-1 bg-black/60 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                onClick={runTestDecryption}
                disabled={isDecrypting}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition disabled:opacity-50"
              >
                {isDecrypting ? 'Prüfe...' : 'Entschlüsseln'}
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded-lg text-xs font-mono border ${
                  testResult.includes('FEHLGESCHLAGEN')
                    ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                    : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                }`}
              >
                {testResult}
              </div>
            )}
            <p className="text-[10px] text-slate-400 leading-normal">
              🛡️ Mathematischer Schutz: Ohne den exakten 256-Bit Schlüssel schlägt der Galois/Counter Mode (GCM) Authentifizierungs-Tag fehl. Niemand auf dem Übertragungsweg kann den Inhalt manipulieren oder einsehen.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#070a10] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
