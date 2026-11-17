import React from 'react';
import { ShieldCheck, Activity, User, RefreshCw } from 'lucide-react';
import { AgentMetricsResponse } from '@dg/shared';

interface Props {
  metrics: AgentMetricsResponse | null;
  agentName?: string;
  onRefresh?: () => void;
}

export const DispatchHeader: React.FC<Props> = ({
  metrics,
  agentName = 'Priya Sharma',
  onRefresh,
}) => {
  return (
    <header className="h-14 bg-slate-900 text-white px-4 flex items-center justify-between border-b border-slate-800 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-white shadow-sm">
            DG
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">DisputeGuard Dispatch</h1>
            <span className="text-[10px] text-slate-400 block -mt-0.5">
              Mission Control · Multilingual Arbitrations
            </span>
          </div>
        </div>

        {/* System status dots */}
        <div className="hidden md:flex items-center gap-3 text-xs bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60 ml-3">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> DB
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Nexconn
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> AI Gateway
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Metric strip */}
        {metrics && (
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-300 border-r border-slate-800 pr-4">
            <span>
              Open: <strong className="text-white font-semibold">{metrics.open}</strong>
            </span>
            <span>
              Frozen: <strong className="text-rose-400 font-semibold">{metrics.frozen}</strong>
            </span>
            <span>
              Auto-resolved (24h):{' '}
              <strong className="text-emerald-400 font-semibold">{metrics.autoResolved24h}</strong>
            </span>
          </div>
        )}

        {/* User / Agent chip */}
        <div className="flex items-center gap-2 text-xs">
          <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-bold">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <span className="font-semibold text-slate-200 block">{agentName}</span>
            <span className="text-[10px] text-slate-400 block -mt-0.5">Senior Arbitrator</span>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Refresh queue and metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
