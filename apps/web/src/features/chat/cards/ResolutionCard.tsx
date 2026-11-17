import React from 'react';
import { ResolutionCardData } from '@dg/shared';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

interface Props {
  data: ResolutionCardData;
}

export const ResolutionCard: React.FC<Props> = ({ data }) => {
  const isFull = data.outcome === 'refund_full';
  const refundFormatted = `$${(data.buyerRefund.value / 100).toFixed(2)}`;
  const sellerFormatted = `$${(data.sellerPayout.value / 100).toFixed(2)}`;

  return (
    <div className="my-4 mx-auto w-full max-w-lg rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 shadow-sm text-sm">
      <div className="flex items-center justify-between pb-2.5 border-b border-emerald-200">
        <div className="flex items-center gap-2 font-bold text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Dispute Resolved: {isFull ? 'Full Refund' : 'Partial Refund Settlement'}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Escrow Released</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
          <span className="text-slate-500 block text-[11px]">Buyer Refunded</span>
          <span className="text-base font-bold text-emerald-700">{refundFormatted}</span>
        </div>
        <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
          <span className="text-slate-500 block text-[11px]">Seller Released</span>
          <span className="text-base font-bold text-slate-800">{sellerFormatted}</span>
        </div>
      </div>

      {data.note && (
        <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
          <span className="font-semibold text-slate-700">Arbitrator Note: </span>
          {data.note}
        </p>
      )}

      <div className="mt-3 pt-2 border-t border-emerald-100 flex justify-between items-center text-[11px] text-slate-500">
        <span>Channel locked · Final settlement logged to immutable ledger</span>
        <span className="font-medium text-slate-700">Resolved by {data.resolvedBy}</span>
      </div>
    </div>
  );
};
