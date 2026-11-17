import React, { useState } from 'react';
import { ProposalCardData } from '@dg/shared';
import { Scale, Check, RefreshCw, X, CheckCircle2 } from 'lucide-react';

interface Props {
  data: ProposalCardData;
  isBuyer: boolean;
  counterpartName: string;
  myStatus?: 'pending' | 'accepted' | 'declined' | 'countered';
  counterpartStatus?: 'pending' | 'accepted' | 'declined' | 'countered';
  isFrozen?: boolean;
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
  onAccept,
  onCounter,
  onDecline,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(data.options[0]?.id || '');

  const isPending = myStatus === 'pending';

  return (
    <div className="my-3 mx-auto w-full max-w-lg rounded-xl border border-sky-200 bg-white p-4 shadow-sm text-sm">
      <div className="flex items-center justify-between pb-2 border-b border-sky-100">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <Scale className="w-4 h-4 text-sky-600" />
          <span>Settlement Proposal (Round {data.round} of 2)</span>
        </div>
        <div className="text-[11px] font-medium text-slate-500">
          Policy: {data.policyVersion}
        </div>
      </div>

      {/* Options list */}
      <div className="mt-3 space-y-2">
        {data.options.map((opt) => {
          const isSelected = selectedOptionId === opt.id;
          const refundAmount = (opt.buyerGets.value / 100).toFixed(2);
          const currency = opt.buyerGets.currency;

          return (
            <label
              key={opt.id}
              onClick={() => isPending && setSelectedOptionId(opt.id)}
              className={`block p-3 rounded-lg border transition cursor-pointer ${
                isSelected
                  ? 'border-sky-500 bg-sky-50/70 ring-1 ring-sky-500'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
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
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <span className="font-semibold text-slate-800 text-xs">{opt.title}</span>
                </div>
                <span className="text-xs font-bold text-slate-900">
                  {opt.replacement
                    ? 'Free Replacement'
                    : isBuyer
                    ? `You get: $${refundAmount}`
                    : `You refund: $${refundAmount}`}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 ml-6">{opt.rationale}</p>
            </label>
          );
        })}
      </div>

      {/* Status indicator */}
      <div className="mt-3 py-2 px-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs text-slate-600 border border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">You:</span>
          <span
            className={`capitalize font-semibold ${
              myStatus === 'accepted'
                ? 'text-emerald-600'
                : myStatus === 'declined'
                ? 'text-rose-600'
                : 'text-amber-600'
            }`}
          >
            {myStatus}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{counterpartName}:</span>
          <span
            className={`capitalize font-semibold ${
              counterpartStatus === 'accepted'
                ? 'text-emerald-600'
                : counterpartStatus === 'declined'
                ? 'text-rose-600'
                : 'text-amber-600'
            }`}
          >
            {counterpartStatus}
          </span>
        </div>
      </div>

      {/* Buttons */}
      {isPending && !isFrozen && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onAccept?.(selectedOptionId)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 shadow-sm transition active:scale-98 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept Proposal</span>
          </button>
          <button
            onClick={() => onCounter?.(selectedOptionId)}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 shadow-2xs transition active:scale-98 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Counter Offer</span>
          </button>
          <button
            onClick={() => onDecline?.(selectedOptionId)}
            className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-medium py-2 px-2.5 rounded-lg text-xs flex items-center justify-center gap-1 transition active:scale-98 cursor-pointer"
            title="Decline and escalate to human agent"
          >
            <X className="w-3.5 h-3.5" />
            <span>Decline</span>
          </button>
        </div>
      )}

      {isFrozen && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
          <span className="font-semibold">Notice:</span>
          <span>Proposal interaction paused while under staff review.</span>
        </div>
      )}
    </div>
  );
};
