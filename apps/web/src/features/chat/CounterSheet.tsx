import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  optionTitle: string;
  originalRefundMinor: number;
  orderTotalMinor: number;
  onConfirm: (counterMinor: number) => void;
}

export const CounterSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  optionTitle,
  originalRefundMinor,
  orderTotalMinor,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const minMinor = Math.round((originalRefundMinor * 50) / 100);
  const maxMinor = Math.min(Math.round((originalRefundMinor * 150) / 100), orderTotalMinor);

  const [counterMinor, setCounterMinor] = useState(originalRefundMinor);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-4 antialiased">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 font-semibold text-slate-900 text-xs">
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Counter Settlement Offer</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Counter-offering on <strong className="text-slate-900 font-medium">{optionTitle}</strong>. Under dispute policy v1, counter proposals are strictly bounded between 50% and 150% of baseline.
          </p>

          <div className="bg-slate-50 p-4 rounded text-center border border-slate-200">
            <span className="text-xs font-mono text-slate-500 block mb-1">PROPOSED REFUND AMOUNT</span>
            <span className="text-2xl font-mono font-bold text-slate-900 num-tabular">
              ${(counterMinor / 100).toFixed(2)}
            </span>
            <span className="text-[11px] font-mono text-slate-500 block mt-1 num-tabular">
              Order Total: ${(orderTotalMinor / 100).toFixed(2)} USD
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-slate-500 num-tabular">
              <span>Min: ${(minMinor / 100).toFixed(2)}</span>
              <span>Max: ${(maxMinor / 100).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={minMinor}
              max={maxMinor}
              step={100}
              value={counterMinor}
              onChange={(e) => setCounterMinor(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-slate-900"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-1.5 px-3 rounded border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm(counterMinor);
                onClose();
              }}
              className="flex-1 py-1.5 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium cursor-pointer shadow-xs num-tabular font-mono"
            >
              Submit ${(counterMinor / 100).toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
