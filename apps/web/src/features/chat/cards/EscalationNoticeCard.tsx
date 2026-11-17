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
    <div className="my-3 mx-auto w-full max-w-lg rounded-xl border border-rose-300 bg-gradient-to-r from-rose-50 via-white to-amber-50 p-4 shadow-sm text-sm">
      <div className="flex items-center gap-2 pb-2 border-b border-rose-100 text-rose-900 font-semibold">
        <ShieldAlert className="w-4 h-4 text-rose-600" />
        <span>Case Escalated to DisputeGuard Dispatch</span>
      </div>

      <div className="mt-3 flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-900">{primaryNotice}</p>
          <p className="text-[11px] text-slate-500">
            Escrow protection active · A staff arbitrator has joined to ensure fair resolution.
          </p>
        </div>
      </div>
    </div>
  );
};
