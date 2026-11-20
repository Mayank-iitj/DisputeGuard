import React, { useState } from 'react';
import { ProposalCardData } from '@dg/shared';
import { Scale, Check, RefreshCw, X } from 'lucide-react';

interface Props {
  data: ProposalCardData;
  isBuyer: boolean;
  counterpartName: string;
  myStatus?: 'pending' | 'accepted' | 'declined' | 'countered';
  counterpartStatus?: 'pending' | 'accepted' | 'declined' | 'countered';
  isFrozen?: boolean;
  isResolved?: boolean;
  onAccept?: (optionId: string) => void;
  onCounter?: (optionId: string) => void;
  onDecline?: (optionId: string) => void;
}

export const ProposalCard: React.FC<Props> = ({
  data,
  isBuyer,
  counterpartName,
  myStatus = 'pending',
  counterpartStatus = 'pending',
  isFrozen = false,
  isResolved = false,
  onAccept,
  onCounter,
  onDecline,
}) => {
  const options = Array.isArray(data?.options) ? data.options : [];
  const [selectedOptionId, setSelectedOptionId] = useState<string>(options[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isSettled = isResolved || (data as any)?.status === 'settled';
  const isPending = myStatus === 'pending' && !isSettled;

  return (
    <div className="my-2.5 mx-auto w-full max-w-lg rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs text-xs antialiased">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-medium text-slate-900">
          <Scale className="w-3.5 h-3.5 text-slate-600" />
          <span>Settlement Proposal (Round {data?.round ?? 1} of 2)</span>
        </div>
        <div className="text-[11px] font-mono text-slate-500">
          Policy: {data?.policyVersion || 'v1'}
        </div>
      </div>

      {/* Options list */}
      <div className="mt-2.5 space-y-2">
        {options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          const refundAmount = opt.buyerGets ? ((opt.buyerGets.value || 0) / 100).toFixed(2) : '0.00';

          return (
            <label
              key={opt.id}
              onClick={() => isPending && setSelectedOptionId(opt.id)}
              className={`block p-2.5 rounded border transition cursor-pointer ${
                isSelected
                  ? 'border-slate-900 bg-slate-50/70'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`option_${data.proposalId}`}
                    checked={isSelected}
                    onChange={() => setSelectedOptionId(opt.id)}
                    disabled={!isPending || isFrozen}
                    className="text-slate-900 focus:ring-slate-900 h-3.5 w-3.5"
                  />
                  <span className="font-medium text-slate-900 text-xs">{opt.title}</span>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-900 num-tabular">
                  {opt.replacement
                    ? 'Replacement'
                    : isBuyer
                    ? `Refund: $${refundAmount}`
                    : `Refund: $${refundAmount}`}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 ml-5.5 leading-relaxed">{opt.rationale}</p>
            </label>
          );
        })}
      </div>

      {/* Status indicator */}
      <div className="mt-2.5 py-1.5 px-2.5 bg-slate-50 rounded flex items-center justify-between text-xs text-slate-600 border border-slate-100 font-mono text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">You:</span>
          <span
            className={`capitalize font-semibold ${
              myStatus === 'accepted'
                ? 'text-emerald-700'
                : myStatus === 'declined'
                ? 'text-rose-700'
                : 'text-slate-700'
            }`}
          >
            {myStatus}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">{counterpartName}:</span>
          <span
            className={`capitalize font-semibold ${
              counterpartStatus === 'accepted'
                ? 'text-emerald-700'
                : counterpartStatus === 'declined'
                ? 'text-rose-700'
                : 'text-slate-700'
            }`}
          >
            {counterpartStatus}
          </span>
        </div>
      </div>

      {/* Settled / Finalized Indicator */}
      {isSettled && (
        <div className="mt-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-center justify-between font-mono">
          <div className="flex items-center gap-1.5 font-bold">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Mutual Settlement Finalized — Escrow Released</span>
          </div>
          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold uppercase">
            SETTLED ✓
          </span>
        </div>
      )}

      {/* Buttons */}
      {isPending && !isFrozen && !isSettled && (
        <div className="mt-2.5 flex gap-2">
          <button
            onClick={() => {
              if (isSubmitting) return;
              setIsSubmitting(true);
              onAccept?.(selectedOptionId);
            }}
            disabled={isSubmitting}
            className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-1.5 px-3 rounded text-xs flex items-center justify-center gap-1 transition active:scale-98 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Accepting...' : 'Accept Proposal'}</span>
          </button>
          <button
            onClick={() => onCounter?.(selectedOptionId)}
            disabled={isSubmitting}
            className="flex-1 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 border border-slate-200 font-medium py-1.5 px-3 rounded text-xs flex items-center justify-center gap-1 transition active:scale-98 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Counter Offer</span>
          </button>
          <button
            onClick={() => onDecline?.(selectedOptionId)}
            disabled={isSubmitting}
            className="bg-white hover:bg-rose-50 disabled:opacity-50 text-rose-700 border border-slate-200 font-medium py-1.5 px-2.5 rounded text-xs flex items-center justify-center gap-1 transition active:scale-98 cursor-pointer"
            title="Decline and escalate to arbitrator"
          >
            <X className="w-3.5 h-3.5" />
            <span>Decline</span>
          </button>
        </div>
      )}

      {isFrozen && (
        <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-center gap-2">
          <span className="font-semibold">Notice:</span>
          <span>Proposal interaction paused while under staff review.</span>
        </div>
      )}
    </div>
  );
};
