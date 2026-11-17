import React from 'react';
import { AgentJoinedCardData } from '@dg/shared';
import { UserCheck } from 'lucide-react';

interface Props {
  data: AgentJoinedCardData;
}

export const AgentJoinedCard: React.FC<Props> = ({ data }) => {
  return (
    <div className="my-2 mx-auto w-full max-w-sm rounded border border-slate-200 bg-slate-50/80 py-1 px-3 flex items-center justify-center gap-2 text-xs text-slate-700">
      <UserCheck className="w-3.5 h-3.5 text-slate-500" />
      <span>
        <strong className="font-semibold text-slate-900">{data.agentName}</strong> from DisputeGuard joined this channel
      </span>
    </div>
  );
};
