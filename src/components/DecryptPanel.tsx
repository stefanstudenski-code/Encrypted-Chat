import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardPaste, Loader2, TriangleAlert, Unlock } from 'lucide-react';
import { decryptText, inspectCode, type DecryptResult } from '../lib/crypto';
import { canReadClipboard } from '../lib/clipboard';
import { CopyButton } from './CopyButton';
import { DetailsBox } from './DetailsBox';
import { PasswordField } from './PasswordField';

export function DecryptPanel() {
  const [input, setInput] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<DecryptResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detected = useMemo(() => (input.trim() ? inspectCode(input) : null), [input]);

  const updateInput = (v: string) => {
    setInput(v);
    setResult(null);
    setError(null);
  };
  const updatePassword = (v: string) => {
    setPassword(v);
    setResult(null);
    setError(null);
  };

  const handlePaste = async () => {
    try {
      updateInput(await navigator.clipboard.readText());
    } catch {
      setError('Zugriff auf die Zwischenablage nicht erlaubt. Bitte manuell einfügen.');
    }
  };

  const canSubmit = input.trim().length > 0 && password.length > 0 && !busy;

  const handleDecrypt = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await decryptText(input, password));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Entschlüsseln fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="ciphertext" className="field-label">
            Verschlüsselter Text
          </label>
          {canReadClipboard() && (
            <button type="button" onClick={handlePaste} className="link-button">
              <ClipboardPaste className="h-3.5 w-3.5" />
              Einfügen
            </button>
          )}
        </div>
        <textarea
          id="ciphertext"
          value={input}
          onChange={(e) => updateInput(e.target.value)}
          placeholder="ENC1:… hier einfügen (die ganze E-Mail geht auch)"
          rows={5}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="input min-h-[7rem] resize-y font-mono text-xs"
        />
        {input.trim() &&
          (detected ? (
            <p className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Code erkannt ({detected.ciphertextBytes - 16} Bytes Inhalt)
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-amber-400">
              <TriangleAlert className="h-3.5 w-3.5" />
              Noch kein vollständiger Code erkannt
            </p>
          ))}
      </div>

      <PasswordField value={password} onChange={updatePassword} onEnter={handleDecrypt} />

      <button type="button" onClick={handleDecrypt} disabled={!canSubmit} className="btn-primary w-full">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Unlock className="h-5 w-5" />}
        {busy ? 'Entschlüssele …' : 'Entschlüsseln'}
      </button>

      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-300" role="alert">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {result && (
        <section className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-4" aria-live="polite">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Entschlüsselt und unverändert
          </h2>
          <p className="whitespace-pre-wrap break-words rounded-xl bg-black/40 p-3 text-sm leading-relaxed text-slate-100 select-text">
            {result.plaintext}
          </p>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={result.plaintext} />
          </div>
          <DetailsBox details={result.details} />
        </section>
      )}
    </div>
  );
}
