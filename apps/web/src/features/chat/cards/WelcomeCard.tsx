import React from 'react';
import { WelcomeCardData } from '@dg/shared';
import { ShieldCheck, Languages, Package } from 'lucide-react';

interface Props {
  data: WelcomeCardData;
}

export const WelcomeCard: React.FC<Props> = ({ data }) => {
  return (
    <div className="my-3 mx-auto w-full max-w-lg rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-sky-50 p-4 shadow-sm text-sm">
      <div className="flex items-center justify-between pb-2 border-b border-sky-100">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <Package className="w-4 h-4 text-sky-600" />
          <span>{data.orderTitle}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Escrow: {data.escrowState}</span>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5 text-slate-500" />
          <span>Live translation on:</span>
          <span className="font-medium text-slate-700 uppercase">
            {data.languages.join(' ↔ ')}
          </span>
        </div>
        <span className="font-semibold text-slate-800">
          ${(data.amount.value / 100).toFixed(2)} {data.amount.currency}
        </span>
      </div>
    </div>
  );
};
