import type { EncryptionDetails } from '../lib/crypto';

export function DetailsBox({ details }: { details: EncryptionDetails }) {
  const rows: [string, string][] = [
    ['Verfahren', details.algorithm],
    ['Schlüsselableitung', `${details.kdf}, ${details.iterations.toLocaleString('de-DE')} Runden`],
    ['Salt', details.saltHex],
    ['IV / Nonce', details.ivHex],
    ['Größe', `${details.ciphertextBytes} Bytes (inkl. 16 Byte Prüfsumme)`],
  ];

  return (
    <details className="group rounded-xl border border-slate-800 bg-black/30 text-xs">
      <summary className="cursor-pointer select-none px-3 py-2 text-slate-400 hover:text-slate-200">
        Technische Details
      </summary>
      <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5 px-3 pb-3 font-mono">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-slate-500">{k}</dt>
            <dd className="break-all text-slate-300">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
