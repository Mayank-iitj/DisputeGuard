import React from 'react';
import { EvidenceResultCardData } from '@dg/shared';
import { Sparkles, Info, AlertTriangle } from 'lucide-react';

interface Props {
  data: EvidenceResultCardData;
}

export const EvidenceResultCard: React.FC<Props> = ({ data }) => {
  const { assessment, thumbs } = data;
  const sev = assessment.severity;

  return (
    <div className="my-3 mx-auto w-full max-w-lg rounded-xl border border-indigo-200 bg-white p-4 shadow-sm text-sm">
      <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Evidence Analysis Result</span>
        </div>
        <div className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
          <Info className="w-3 h-3 text-slate-400" />
          <span>AI-assessed, not verified</span>
        </div>
      </div>

      <div className="mt-3 flex gap-3">
        {/* Thumbnails */}
        <div className="flex gap-1.5 shrink-0">
          {thumbs.map((t, idx) => (
            <div
              key={idx}
              className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center"
            >
              <img
                src={t}
                alt="evidence"
                className="w-full h-full object-cover"
                onError={(e: any) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<span class="text-[10px] text-slate-400">Photo</span>';
                }}
              />
            </div>
          ))}
        </div>

        {/* Assessment details */}
        <div className="flex-1 text-xs space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="font-semibold text-slate-800 capitalize">
              {assessment.type} · {assessment.location}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {Math.round(assessment.confidence * 100)}% confidence
            </span>
          </div>

          {/* Severity bar */}
          <div className="space-y-0.5">
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>Severity Level {sev}/3</span>
              <span className="font-medium">
                {sev === 1 ? 'Cosmetic flaw' : sev === 2 ? 'Partial functional impact' : sev === 3 ? 'Unusable' : 'None'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden flex gap-0.5">
              <div className={`h-full flex-1 ${sev >= 1 ? 'bg-amber-400' : 'bg-slate-200'}`} />
              <div className={`h-full flex-1 ${sev >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />
              <div className={`h-full flex-1 ${sev >= 3 ? 'bg-rose-500' : 'bg-slate-200'}`} />
            </div>
          </div>

          {assessment.notesEn && (
            <p className="text-[11px] text-slate-600 italic bg-slate-50 p-1.5 rounded border border-slate-100">
              "{assessment.notesEn}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
