import { useState, type ReactNode } from 'react';
import { Lock, ShieldCheck, Trash2, TriangleAlert, Unlock } from 'lucide-react';
import { EncryptPanel } from './components/EncryptPanel';
import { DecryptPanel } from './components/DecryptPanel';

type Mode = 'encrypt' | 'decrypt';

// Web Crypto gibt es nur in "sicheren" Umgebungen (HTTPS, localhost, App-WebView)
const cryptoAvailable =
  typeof window !== 'undefined' && window.isSecureContext && !!window.crypto?.subtle;

export function App() {
  const [mode, setMode] = useState<Mode>('encrypt');
  // Ein neuer Schlüssel setzt beide Bereiche komplett zurück
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight text-slate-100">Encrypted Chat</h1>
            <p className="text-xs text-slate-400">Text verschlüsseln und sicher verschicken</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setResetKey((k) => k + 1)}
          className="btn-ghost"
          title="Alle Eingaben und Ergebnisse löschen"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Alles löschen</span>
        </button>
      </header>

      {!cryptoAvailable && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-300" role="alert">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Verschlüsselung ist hier nicht verfügbar. Die Seite muss über <b>https://</b> oder{' '}
            <b>localhost</b> geöffnet werden (nicht über eine http://-IP-Adresse im WLAN).
          </span>
        </div>
      )}

      <nav className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-1" role="tablist">
        <TabButton active={mode === 'encrypt'} onClick={() => setMode('encrypt')} icon={<Lock className="h-4 w-4" />}>
          Verschlüsseln
        </TabButton>
        <TabButton active={mode === 'decrypt'} onClick={() => setMode('decrypt')} icon={<Unlock className="h-4 w-4" />}>
          Entschlüsseln
        </TabButton>
      </nav>

      {/* Beide Bereiche bleiben erhalten, damit beim Wechseln nichts verloren geht */}
      <main key={resetKey}>
        <div hidden={mode !== 'encrypt'}>
          <EncryptPanel />
        </div>
        <div hidden={mode !== 'decrypt'}>
          <DecryptPanel />
        </div>
      </main>

      <footer className="mt-auto pt-10 text-center text-xs leading-relaxed text-slate-500">
        AES-256-GCM · PBKDF2-SHA256 · alles passiert nur auf diesem Gerät.
        <br />
        Es wird nichts gespeichert und nichts ins Internet gesendet.
      </footer>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
