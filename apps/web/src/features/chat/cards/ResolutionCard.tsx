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
    <div className="my-3 mx-auto w-full max-w-lg rounded-lg border border-emerald-200 bg-white p-3.5 shadow-xs text-xs antialiased">
      <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
        <div className="flex items-center gap-1.5 font-medium text-emerald-950">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Dispute Resolved: {isFull ? 'Full Refund' : 'Partial Refund Settlement'}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>Escrow Released</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
          <span className="text-slate-500 block text-[11px] font-mono">Buyer Refunded</span>
          <span className="text-base font-semibold font-mono text-emerald-700 num-tabular">
            {refundFormatted}
          </span>
        </div>
        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
          <span className="text-slate-500 block text-[11px] font-mono">Seller Released</span>
          <span className="text-base font-semibold font-mono text-slate-900 num-tabular">
            {sellerFormatted}
          </span>
        </div>
      </div>

      {data.note && (
        <p className="mt-2.5 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-150 leading-relaxed">
          <span className="font-semibold text-slate-800">Arbitrator Note: </span>
          {data.note}
        </p>
      )}

      <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] font-mono text-slate-400">
        <span>Final settlement written to ledger</span>
        <span className="text-slate-600 font-medium">By {data.resolvedBy}</span>
      </div>
    </div>
  );
};
