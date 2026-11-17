import React from 'react';
import { AgentJoinedCardData } from '@dg/shared';
import { UserCheck } from 'lucide-react';

interface Props {
  data: AgentJoinedCardData;
}

export const AgentJoinedCard: React.FC<Props> = ({ data }) => {
  return (
    <div className="my-2 mx-auto w-full max-w-sm rounded-full border border-sky-200 bg-sky-50/80 py-1.5 px-3 flex items-center justify-center gap-2 text-xs text-sky-900 shadow-2xs">
      <UserCheck className="w-3.5 h-3.5 text-sky-600" />
      <span>
        <strong className="font-semibold">{data.agentName}</strong> from DisputeGuard has joined this channel
      </span>
    </div>
  );
};
