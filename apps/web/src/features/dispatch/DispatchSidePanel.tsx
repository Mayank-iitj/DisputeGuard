import React, { useState } from 'react';
import { AgentBrief } from '@dg/shared';
import {
  FileText,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  X,
} from 'lucide-react';

interface Props {
  dispute: any;
  brief: AgentBrief | null;
  currentUserId: string;
  onTakeover: () => void;
  onResolve: (action: 'refund_full' | 'refund_partial' | 'release_to_seller', note: string) => void;
  onUnfreeze: (reason: string) => void;
}

export const DispatchSidePanel: React.FC<Props> = ({
  dispute,
  brief,
  currentUserId,
  onTakeover,
  onResolve,
  onUnfreeze,
}) => {
  const [confirmModalAction, setConfirmModalAction] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('Evidence verified; resolved per policy v1');
  const [unfreezeReason, setUnfreezeReason] = useState<string>('Quoted threat; customer clarified in context');
  const [showUnfreezeModal, setShowUnfreezeModal] = useState<boolean>(false);

  if (!dispute) return null;

  const isAssignedToMe = dispute.assignedAgentId === currentUserId;
  const isResolved = dispute.status === 'RESOLVED' || dispute.status === 'CLOSED';
  const orderAmount = dispute.orderAmount ? dispute.orderAmount.value : 8400;
  const orderAmountFormatted = `$${(orderAmount / 100).toFixed(2)}`;

  const handleOpenResolve = (action: string) => {
    setConfirmModalAction(action);
    if (action === 'refund_full') {
      setResolutionNote(`Verified severe damage on ${dispute.orderTitle}; full refund approved.`);
    } else if (action === 'refund_partial') {
      setResolutionNote(`Applied 40% partial refund for cosmetic flaw; item retained.`);
    } else {
      setResolutionNote('Claim dismissed; evidence shows item delivered intact.');
    }
  };

  const handleConfirmResolve = () => {
    if (!confirmModalAction) return;
    onResolve(confirmModalAction as any, resolutionNote);
    setConfirmModalAction(null);
  };

  return (
    <div className="w-80 md:w-96 border-l border-slate-200 bg-white flex flex-col h-full overflow-y-auto shrink-0 divide-y divide-slate-100">
      {/* 1. Case Actions Toolbar */}
      <div className="p-4 bg-slate-50 space-y-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
          Arbitrator Controls
        </span>

        {!isAssignedToMe && !isResolved && (
          <button
            onClick={onTakeover}
            className="w-full py-2 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-sm transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Take Over Case</span>
          </button>
        )}

        {isAssignedToMe && !isResolved && (
          <div className="space-y-1.5">
            <button
              onClick={() => handleOpenResolve('refund_full')}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve Full Refund ({orderAmountFormatted}) & Settle</span>
            </button>

            <button
              onClick={() => handleOpenResolve('refund_partial')}
              className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Approve 40% Partial Refund ($33.60)
            </button>

            <button
              onClick={() => handleOpenResolve('release_to_seller')}
              className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs transition cursor-pointer"
            >
              Release Escrow to Seller
            </button>

            {dispute.risk?.frozen && (
              <button
                onClick={() => setShowUnfreezeModal(true)}
                className="w-full py-1.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unfreeze Escrow...</span>
              </button>
            )}
          </div>
        )}

        {isResolved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Case resolved. Immutable audit ledger updated.</span>
          </div>
        )}
      </div>

      {/* 2. AI Case Brief */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-sky-600" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            AI Case Brief
          </span>
        </div>

        {brief ? (
          <div className="space-y-3 text-xs">
            {/* Summary */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
              <span className="font-semibold text-slate-700 block text-[11px]">Executive Summary:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                {brief.summary.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            {/* Claims comparison */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-sky-50/60 p-2 rounded-lg border border-sky-100">
                <span className="font-bold text-sky-900 block mb-0.5">Buyer Claim (ja)</span>
                <span className="text-slate-700">{brief.claims.buyer}</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-800 block mb-0.5">Seller Claim (es)</span>
                <span className="text-slate-700">{brief.claims.seller}</span>
              </div>
            </div>

            {/* Risk reasons (Agent Only!) */}
            <div className="bg-rose-50/70 p-2.5 rounded-lg border border-rose-200 space-y-1">
              <span className="font-bold text-rose-900 block text-[11px] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Risk & Threat Triggers (Agent Confidential):</span>
              </span>
              {brief.riskReasons.map((r, idx) => (
                <div key={idx} className="text-[11px] text-rose-800">
                  <span className="font-semibold capitalize">{r.type}</span> (
                  {Math.round(r.confidence * 100)}% conf): "{r.quote_en}"
                </div>
              ))}
            </div>

            {/* Recommended action computed by policy engine */}
            <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
              <span className="font-bold text-emerald-900 block text-[11px]">
                Recommended Policy Action:
              </span>
              <span className="font-semibold text-emerald-800 capitalize">
                {brief.recommended.action.replace('_', ' ')}: ${(brief.recommended.amount.value / 100).toFixed(2)}
              </span>
              <p className="text-[11px] text-emerald-700 mt-0.5">{brief.recommended.rationale}</p>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic">Generating brief...</div>
        )}
      </div>

      {/* Resolve Confirmation Modal */}
      {confirmModalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-slate-900 text-sm">
                Confirm Dispute Resolution
              </span>
              <button
                onClick={() => setConfirmModalAction(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900">
                <strong className="block mb-1">Financial Impact Warning:</strong>
                <span>
                  Confirming this action will immediately release simulated escrow funds and close the
                  customer channel permanently.
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Required Settlement Note (min 5 characters):
                </label>
                <textarea
                  rows={2}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setConfirmModalAction(null)}
                  className="flex-1 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmResolve}
                  disabled={resolutionNote.trim().length < 5}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Execute Resolution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unfreeze Modal */}
      {showUnfreezeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-slate-900 text-sm">Unfreeze Escrow</span>
              <button
                onClick={() => setShowUnfreezeModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Unfreezing escrow moves the account state from <strong>FROZEN</strong> back to{' '}
                <strong>HELD</strong>. A recorded justification of at least 10 characters is required
                for audit compliance.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Unfreeze Reason:</label>
                <textarea
                  rows={2}
                  value={unfreezeReason}
                  onChange={(e) => setUnfreezeReason(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setShowUnfreezeModal(false)}
                  className="flex-1 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onUnfreeze(unfreezeReason);
                    setShowUnfreezeModal(false);
                  }}
                  disabled={unfreezeReason.trim().length < 10}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Confirm Unfreeze
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
