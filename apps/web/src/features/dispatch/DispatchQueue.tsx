import React, { useState } from 'react';
import { QueueItem } from '@dg/shared';
import { ShieldAlert, AlertTriangle, ShieldCheck, Lock, Clock } from 'lucide-react';

interface Props {
  items: QueueItem[];
  selectedDisputeId: string | null;
  onSelect: (disputeId: string) => void;
}

export const DispatchQueue: React.FC<Props> = ({ items, selectedDisputeId, onSelect }) => {
  const [langFilter, setLangFilter] = useState<string>('all');

  const filtered = items.filter((item) => {
    if (langFilter === 'all') return true;
    return item.langs.includes(langFilter);
  });

  return (
    <div className="w-80 md:w-96 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 antialiased">
      {/* Header and filters */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-800 tracking-tight">
            Priority Queue
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            {filtered.length} active
          </span>
        </div>

        {/* Language selector tabs */}
        <div className="flex items-center gap-1 text-[11px]">
          {['all', 'ja', 'es', 'zh'].map((l) => (
            <button
              key={l}
              onClick={() => setLangFilter(l)}
              className={`px-2 py-0.5 rounded text-xs font-medium uppercase transition cursor-pointer ${
                langFilter === l
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Queue items list */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No active disputes matching filter.
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = item.disputeId === selectedDisputeId;
            const waitingMin = Math.max(1, Math.floor(item.waitingMs / 60000));
            const amountStr = `$${(item.amount.value / 100).toFixed(2)}`;

            return (
              <div
                key={item.disputeId}
                onClick={() => onSelect(item.disputeId)}
                className={`p-3.5 transition cursor-pointer relative border-l-2 ${
                  isSelected
                    ? 'bg-slate-50 border-l-slate-900'
                    : 'hover:bg-slate-50/50 border-l-transparent'
                }`}
              >
                {/* Priority and risk band */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.priority}
                    </span>

                    {/* Muted, high-precision Risk Tag */}
                    {item.risk.band === 'high' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <ShieldAlert className="w-3 h-3 text-rose-600" />
                        <span>HIGH</span>
                        {item.risk.frozen && <Lock className="w-2.5 h-2.5 ml-0.5 text-rose-600" />}
                      </span>
                    ) : item.risk.band === 'medium' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>MED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>LOW</span>
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono font-semibold text-slate-900 num-tabular">
                    {amountStr}
                  </span>
                </div>

                {/* Dispute ID & Language tags */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-mono text-[11px] text-slate-600">
                    {item.disputeId}
                  </span>
                  <span className="text-[10px] uppercase font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                    {item.langs.join(' ↔ ')}
                  </span>
                </div>

                {/* Headline */}
                <p className="text-xs text-slate-700 font-normal line-clamp-2 leading-relaxed">
                  {item.headline}
                </p>

                {/* Footer timer & assignment */}
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{waitingMin}m ago</span>
                  </span>
                  <span className="text-slate-500">
                    {item.assignedTo ? 'Assigned' : 'Unassigned'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
