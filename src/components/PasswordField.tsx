import { useId, useState } from 'react';
import { Eye, EyeOff, KeyRound, RefreshCw } from 'lucide-react';
import { generatePassword, rateStrength, type Strength } from '../lib/password';
import { CopyButton } from './CopyButton';

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Zeigt "Erzeugen" und die Stärke-Anzeige (nur beim Verschlüsseln sinnvoll) */
  withGenerator?: boolean;
  onEnter?: () => void;
}

const STRENGTH_STYLE: Record<Strength, { width: string; color: string; text: string }> = {
  leer: { width: 'w-0', color: 'bg-slate-700', text: 'text-slate-500' },
  'sehr schwach': { width: 'w-1/5', color: 'bg-rose-500', text: 'text-rose-400' },
  schwach: { width: 'w-2/5', color: 'bg-amber-500', text: 'text-amber-400' },
  mittel: { width: 'w-3/5', color: 'bg-yellow-400', text: 'text-yellow-300' },
  stark: { width: 'w-full', color: 'bg-emerald-500', text: 'text-emerald-400' },
};

export function PasswordField({ value, onChange, withGenerator = false, onEnter }: Props) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const strength = rateStrength(value);
  const style = STRENGTH_STYLE[strength];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="field-label">
          <KeyRound className="h-4 w-4 text-cyan-400" />
          Passwort
        </label>
        {withGenerator && (
          <button
            type="button"
            className="link-button"
            onClick={() => {
              onChange(generatePassword());
              setVisible(true);
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sicheres Passwort erzeugen
          </button>
        )}
      </div>

      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEnter?.();
            }}
            placeholder="Mit dem Empfänger vereinbartes Passwort"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="input pr-11 font-mono"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-200"
            aria-label={visible ? 'Passwort verbergen' : 'Passwort anzeigen'}
            title={visible ? 'Passwort verbergen' : 'Passwort anzeigen'}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {withGenerator && value && <CopyButton text={value} label="" className="px-3" />}
      </div>

      {withGenerator && (
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div className={`h-full ${style.width} ${style.color} transition-all`} />
          </div>
          <p className={`text-xs ${style.text}`}>
            {strength === 'leer'
              ? 'Tipp: Ein erzeugtes Passwort hat rund 100 Bit Zufall.'
              : `Stärke: ${strength}`}
            {(strength === 'sehr schwach' || strength === 'schwach') &&
              ' – leicht zu erraten. Länger machen oder eines erzeugen lassen.'}
          </p>
        </div>
      )}
    </div>
  );
}
