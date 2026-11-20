import React from 'react';
import { EscrowStatusCardData } from '@dg/shared';
import { Lock, ShieldCheck, RefreshCw } from 'lucide-react';

interface Props {
  data: EscrowStatusCardData;
}

export const EscrowStatusCard: React.FC<Props> = ({ data }) => {
  const isFrozen = data?.state === 'FROZEN';
  const amountStr = `$${(((data?.amount?.value ?? 0) / 100)).toFixed(2)}`;

  return (
    <div className="my-2 mx-auto w-full max-w-sm rounded-lg border border-slate-200 bg-white py-1.5 px-3 flex items-center justify-between text-xs text-slate-700 shadow-2xs">
      <div className="flex items-center gap-1.5">
        {isFrozen ? (
          <Lock className="w-3.5 h-3.5 text-rose-500" />
        ) : (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        )}
        <span className="font-medium">
          Escrow Status: <strong className={isFrozen ? 'text-rose-600' : 'text-emerald-700'}>{data?.state || 'HELD'}</strong>
        </span>
      </div>
      <span className="font-semibold text-slate-800">{amountStr}</span>
    </div>
  );
};
