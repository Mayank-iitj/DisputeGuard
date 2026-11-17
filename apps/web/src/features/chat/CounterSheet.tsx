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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <RefreshCw className="w-4 h-4 text-sky-600" />
            <span>Counter Settlement Offer</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600">
            Counter-offering on <strong className="text-slate-800">{optionTitle}</strong>. In accordance with
            dispute policy v1, counters must fall between 50% and 150% of the baseline option.
          </p>

          <div className="bg-sky-50 p-4 rounded-xl text-center border border-sky-100">
            <span className="text-xs text-sky-700 font-medium block">Proposed Refund Amount</span>
            <span className="text-2xl font-black text-sky-900">${(counterMinor / 100).toFixed(2)}</span>
            <span className="text-[11px] text-sky-600 block mt-1">
              (Order Total: ${(orderTotalMinor / 100).toFixed(2)})
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500 font-medium">
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
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm(counterMinor);
                onClose();
              }}
              className="flex-1 py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
            >
              Submit Counter (${(counterMinor / 100).toFixed(2)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
