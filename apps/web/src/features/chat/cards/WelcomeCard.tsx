import React from 'react';
import { WelcomeCardData } from '@dg/shared';
import { ShieldCheck, Languages, Package } from 'lucide-react';

interface Props {
  data: WelcomeCardData;
}

export const WelcomeCard: React.FC<Props> = ({ data }) => {
  return (
    <div className="my-2.5 mx-auto w-full max-w-lg rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs text-xs antialiased">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 font-medium text-slate-900">
          <Package className="w-4 h-4 text-slate-500" />
          <span>{data.orderTitle}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Escrow: {data.escrowState}</span>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-slate-600 font-mono text-[11px]">
        <div className="flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5 text-slate-400" />
          <span>Translation active:</span>
          <span className="font-semibold text-slate-800 uppercase">
            {data.languages.join(' ↔ ')}
          </span>
        </div>
        <span className="font-semibold text-slate-900 num-tabular">
          ${(data.amount.value / 100).toFixed(2)} {data.amount.currency}
        </span>
      </div>
    </div>
  );
};
