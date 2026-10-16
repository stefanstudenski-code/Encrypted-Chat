import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyText } from '../lib/clipboard';

interface Props {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = 'Kopieren', className = '' }: Props) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleClick = async () => {
    const ok = await copyText(text);
    setState(ok ? 'ok' : 'fail');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 2000);
  };

  const iconOnly = label === '';
  const text_ = state === 'ok' ? 'Kopiert' : state === 'fail' ? 'Nicht möglich' : label || 'Kopieren';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`btn-secondary ${className}`}
      aria-label={iconOnly ? text_ : undefined}
      title={iconOnly ? text_ : undefined}
    >
      {state === 'ok' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
      {!iconOnly && <span>{text_}</span>}
    </button>
  );
}
