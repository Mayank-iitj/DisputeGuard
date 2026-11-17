import React from 'react';
import { EscalationNoticeCardData } from '@dg/shared';
import { ShieldAlert, Lock } from 'lucide-react';

interface Props {
  data: EscalationNoticeCardData;
  userLang?: string;
}

export const EscalationNoticeCard: React.FC<Props> = ({ data, userLang = 'en' }) => {
  const notices = data.noticeByLang || {};
  const primaryNotice = notices[userLang] || notices['en'] || notices['ja'] || 'Under Review';

  return (
    <div className="my-2.5 mx-auto w-full max-w-lg rounded-lg border border-rose-200 bg-rose-50/40 p-3.5 shadow-xs text-xs antialiased">
      <div className="flex items-center gap-1.5 pb-2 border-b border-rose-100 text-rose-900 font-medium">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
        <span>Case Escalated to DisputeGuard Dispatch</span>
      </div>

      <div className="mt-2.5 flex items-start gap-2.5">
        <div className="w-6 h-6 rounded bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 mt-0.5">
          <Lock className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-slate-900 leading-tight">{primaryNotice}</p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Escrow protection active · A staff arbitrator has joined to ensure fair resolution.
          </p>
        </div>
      </div>
    </div>
  );
};
