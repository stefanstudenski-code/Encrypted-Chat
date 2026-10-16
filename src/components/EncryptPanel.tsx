import { useState } from 'react';
import { Info, Loader2, Lock, Mail, Share2, TriangleAlert } from 'lucide-react';
import { encryptText, type EncryptResult } from '../lib/crypto';
import { canShare } from '../lib/clipboard';
import { CopyButton } from './CopyButton';
import { DetailsBox } from './DetailsBox';
import { PasswordField } from './PasswordField';

const SHARE_INTRO =
  'Diese Nachricht ist verschlüsselt. Zum Lesen den folgenden Code in der App „Encrypted Chat“ unter „Entschlüsseln“ einfügen und das vereinbarte Passwort eingeben:';

// Viele Mail-Programme kürzen mailto-Links ab etwa 2000 Zeichen
const MAILTO_LIMIT = 1900;

export function EncryptPanel() {
  const [text, setText] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<EncryptResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ein Ergebnis gehört immer genau zu Text + Passwort; bei Änderung verwerfen
  const updateText = (v: string) => {
    setText(v);
    setResult(null);
  };
  const updatePassword = (v: string) => {
    setPassword(v);
    setResult(null);
  };

  const canSubmit = text.length > 0 && password.length > 0 && !busy;

  const handleEncrypt = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await encryptText(text, password));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verschlüsseln fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  const shareBody = result ? `${SHARE_INTRO}\n\n${result.code}\n` : '';
  const mailto = result
    ? `mailto:?subject=${encodeURIComponent('Verschlüsselte Nachricht')}&body=${encodeURIComponent(shareBody)}`
    : '';

  const handleShare = async () => {
    if (!result) return;
    try {
      await navigator.share({ text: shareBody });
    } catch {
      // Abbruch durch den Nutzer – nichts zu tun
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="plaintext" className="field-label">
            Nachricht
          </label>
          <span className="text-xs text-slate-500">{text.length} Zeichen</span>
        </div>
        <textarea
          id="plaintext"
          value={text}
          onChange={(e) => updateText(e.target.value)}
          placeholder="Geheimen Text hier eingeben …"
          rows={6}
          className="input min-h-[8rem] resize-y"
        />
      </div>

      <PasswordField value={password} onChange={updatePassword} withGenerator onEnter={handleEncrypt} />

      <button type="button" onClick={handleEncrypt} disabled={!canSubmit} className="btn-primary w-full">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
        {busy ? 'Verschlüssele …' : 'Verschlüsseln'}
      </button>

      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-300">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {result && (
        <section className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-4" aria-live="polite">
          <h2 className="text-sm font-semibold text-emerald-300">Verschlüsselter Text</h2>
          <p className="max-h-48 overflow-y-auto break-all rounded-xl bg-black/40 p-3 font-mono text-xs leading-relaxed text-cyan-200 select-all">
            {result.code}
          </p>

          <div className="flex flex-wrap gap-2">
            <CopyButton text={result.code} />
            {canShare() && (
              <button type="button" onClick={handleShare} className="btn-secondary">
                <Share2 className="h-4 w-4" />
                Teilen
              </button>
            )}
            {mailto.length <= MAILTO_LIMIT ? (
              <a href={mailto} className="btn-secondary">
                <Mail className="h-4 w-4" />
                Per E-Mail
              </a>
            ) : (
              <span className="self-center text-xs text-slate-500">
                Zu lang für einen E-Mail-Link – bitte kopieren und einfügen.
              </span>
            )}
          </div>

          <p className="flex items-start gap-2 text-xs text-amber-300/90">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            Das Passwort nie zusammen mit dem Code schicken – am besten persönlich oder per Anruf
            vereinbaren.
          </p>

          <DetailsBox details={result.details} />
        </section>
      )}
    </div>
  );
}
