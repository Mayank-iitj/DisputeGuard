import React, { useState } from 'react';
import { ChatMessage } from '../../nexconn/port';
import { Sparkles, Send, AlertCircle, Languages, Lock, ShieldCheck } from 'lucide-react';
import { api } from '../../api/client';
import { CopilotDraft } from '@dg/shared';

interface Props {
  dispute: any;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const DispatchTranscript: React.FC<Props> = ({ dispute, messages, onSendMessage }) => {
  const [intent, setIntent] = useState<string>('de_escalate');
  const [targetParty, setTargetParty] = useState<'buyer' | 'seller'>('buyer');
  const [draft, setDraft] = useState<CopilotDraft | null>(null);
  const [draftText, setDraftText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});

  const handleGenerateDraft = async () => {
    if (!dispute) return;
    setIsGenerating(true);
    try {
      const res = await api.copilotDraft(dispute.id, intent, targetParty);
      setDraft(res.draft);
      setDraftText(res.draft.text);
      setWarnings(res.warnings || []);
    } catch (err) {
      console.error('Failed to generate draft:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendDraft = () => {
    if (!draftText.trim()) return;
    onSendMessage(draftText.trim());
    setDraftText('');
    setDraft(null);
  };

  const toggleOriginal = (uid: string) => {
    setShowOriginalMap((prev) => ({ ...prev, [uid]: !prev[uid] }));
  };

  if (!dispute) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Select a dispute from the queue to view case details.
      </div>
    );
  }

  const isFrozen = dispute.risk?.frozen || dispute.frozen;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Case Header */}
      <div className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">{dispute.id}</span>
            <span className="text-xs text-slate-500 font-medium">· {dispute.orderTitle}</span>
          </div>
          <span className="text-[11px] text-slate-500 block -mt-0.5">
            Aiko (ja) ↔ Marco (es) · ${(dispute.orderAmount ? dispute.orderAmount.value / 100 : 84).toFixed(2)} USD
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isFrozen ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>Escrow: FROZEN</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Escrow: HELD</span>
            </span>
          )}
        </div>
      </div>

      {/* Transcript list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider my-2">
          Agent Transcript (Translated to English)
        </div>

        {messages.map((m) => {
          if (m.kind === 'envelope') {
            return (
              <div
                key={m.uid}
                className="my-1.5 p-2 bg-slate-200/50 rounded-lg text-xs text-slate-600 border border-slate-200 text-center font-medium"
              >
                Card Event: <strong className="text-slate-800">{m.env.kind}</strong>
              </div>
            );
          }

          const showOrig = showOriginalMap[m.uid];
          const isAgent = m.senderId === dispute.assignedAgentId || m.senderId.includes('agent');

          return (
            <div
              key={m.uid}
              className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'} max-w-[85%] ${
                isAgent ? 'ml-auto' : 'mr-auto'
              }`}
            >
              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5 px-1">
                <span>{m.senderId}</span>
                <span>·</span>
                <button
                  onClick={() => toggleOriginal(m.uid)}
                  className="text-sky-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Languages className="w-2.5 h-2.5" />
                  <span>{showOrig ? 'Show English' : 'Show Original'}</span>
                </button>
              </div>

              <div
                className={`p-3 rounded-xl text-xs leading-relaxed shadow-2xs ${
                  isAgent
                    ? 'bg-sky-600 text-white rounded-br-xs'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                }`}
              >
                <p>{m.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Copilot Draft docked at bottom */}
      <div className="border-t border-slate-200 bg-white p-3 shrink-0 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-bold text-sky-900">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>AI Copilot Draft</span>
            </span>

            {/* Target party */}
            <select
              value={targetParty}
              onChange={(e: any) => setTargetParty(e.target.value)}
              className="text-[11px] font-semibold bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-slate-700"
            >
              <option value="buyer">To: Buyer (ja)</option>
              <option value="seller">To: Seller (es)</option>
            </select>

            {/* Intent */}
            <select
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              className="text-[11px] font-semibold bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-slate-700"
            >
              <option value="de_escalate">De-escalate</option>
              <option value="apologize_and_offer">Apologize & Offer</option>
              <option value="ask_for_more_photos">Ask For More Photos</option>
              <option value="explain_policy">Explain Policy</option>
              <option value="confirm_resolution">Confirm Resolution</option>
            </select>
          </div>

          <button
            onClick={handleGenerateDraft}
            disabled={isGenerating}
            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold rounded-lg text-xs border border-sky-200 flex items-center gap-1 transition cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-sky-600" />
            <span>{isGenerating ? 'Generating...' : 'Generate AI Draft'}</span>
          </button>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{warnings.join(', ')}</span>
          </div>
        )}

        {/* Editable draft textarea */}
        <textarea
          rows={2}
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          placeholder="Draft message in recipient language..."
          className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
        />

        {/* English preview */}
        {draft && (
          <div className="mt-1 text-[11px] text-slate-500 italic px-1">
            <span className="font-semibold text-slate-600">English preview: </span>
            {draft.english}
          </div>
        )}

        {/* Send button */}
        <div className="mt-2 flex justify-end">
          <button
            disabled={!draftText.trim()}
            onClick={handleSendDraft}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send as Arbitrator</span>
          </button>
        </div>
      </div>
    </div>
  );
};
