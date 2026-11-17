import React from 'react';
import { EvidenceResultCardData } from '@dg/shared';
import { Camera, Info } from 'lucide-react';

interface Props {
  data: EvidenceResultCardData;
}

export const EvidenceResultCard: React.FC<Props> = ({ data }) => {
  const { assessment, thumbs } = data;
  const sev = assessment.severity;

  return (
    <div className="my-2.5 mx-auto w-full max-w-lg rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs text-xs antialiased">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-1.5 font-medium text-slate-900">
          <Camera className="w-3.5 h-3.5 text-slate-600" />
          <span>Evidence Analysis Result</span>
        </div>
        <div className="inline-flex items-center gap-1 text-[10px] font-mono font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
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
              className="w-14 h-14 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center"
            >
              <img
                src={t}
                alt="evidence"
                className="w-full h-full object-cover"
                onError={(e: any) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<span class="text-[10px] font-mono text-slate-400">Photo</span>';
                }}
              />
            </div>
          ))}
        </div>

        {/* Assessment details */}
        <div className="flex-1 space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="font-semibold text-slate-900 capitalize">
              {assessment.type} · {assessment.location}
            </span>
            <span className="text-[11px] font-mono text-slate-500 num-tabular">
              {Math.round(assessment.confidence * 100)}% confidence
            </span>
          </div>

          {/* Severity bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-600">
              <span className="font-mono text-[10px] text-slate-400">SEVERITY {sev}/3</span>
              <span className="font-medium text-slate-700">
                {sev === 1 ? 'Cosmetic flaw' : sev === 2 ? 'Partial functional impact' : sev === 3 ? 'Unusable' : 'None'}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden flex gap-0.5">
              <div className={`h-full flex-1 ${sev >= 1 ? 'bg-amber-500' : 'bg-slate-200'}`} />
              <div className={`h-full flex-1 ${sev >= 2 ? 'bg-amber-600' : 'bg-slate-200'}`} />
              <div className={`h-full flex-1 ${sev >= 3 ? 'bg-rose-600' : 'bg-slate-200'}`} />
            </div>
          </div>

          {assessment.notesEn && (
            <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-150 leading-relaxed">
              "{assessment.notesEn}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
