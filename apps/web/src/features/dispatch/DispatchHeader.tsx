import React from 'react';
import { User, RefreshCw } from 'lucide-react';
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
    <header className="h-12 bg-slate-900 text-slate-100 px-4 flex items-center justify-between border-b border-slate-800 shrink-0 antialiased">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
            DG
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-xs font-semibold text-white tracking-tight">Dispatch Console</h1>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Arbitration Ops
            </span>
          </div>
        </div>

        {/* Clean System Status Indicators without gratuitous pulse animation */}
        <div className="hidden md:flex items-center gap-3 text-[11px] font-mono text-slate-400 bg-slate-800/50 px-2.5 py-0.5 rounded border border-slate-700/60 ml-2">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> DB
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Nexconn
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Gateway
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Metric strip with tabular numerals */}
        {metrics && (
          <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-slate-400 border-r border-slate-800 pr-4 num-tabular">
            <span>
              Queue: <strong className="text-white font-medium">{metrics.open}</strong>
            </span>
            <span>
              Frozen: <strong className="text-rose-400 font-medium">{metrics.frozen}</strong>
            </span>
            <span>
              Auto (24h):{' '}
              <strong className="text-emerald-400 font-medium">{metrics.autoResolved24h}</strong>
            </span>
          </div>
        )}

        {/* User / Agent chip */}
        <div className="flex items-center gap-2 text-xs">
          <div className="w-6 h-6 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center">
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <span className="font-medium text-slate-200 block text-xs">{agentName}</span>
            <span className="text-[10px] text-slate-400 block font-mono">Arbitrator</span>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Refresh queue and metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </header>
  );
};
