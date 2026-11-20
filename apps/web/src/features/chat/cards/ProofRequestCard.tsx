import React from 'react';
import { ProofRequestCardData } from '@dg/shared';
import { Camera, Image as ImageIcon, Clock, CheckCircle2 } from 'lucide-react';

interface Props {
  data: ProofRequestCardData;
  isBuyer: boolean;
  onOpenUpload?: () => void;
}

export const ProofRequestCard: React.FC<Props> = ({ data, isBuyer, onOpenUpload }) => {
  const d = (data || {}) as any;
  const shotList: string[] = Array.isArray(d.shotList)
    ? d.shotList
    : Array.isArray(d.requiredAngles)
    ? d.requiredAngles
    : ['Item overview', 'Damage detail', 'Shipping packaging'];

  return (
    <div className="my-2.5 mx-auto w-full max-w-lg rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs text-xs antialiased">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2 font-medium text-slate-900">
          <Camera className="w-4 h-4 text-slate-600" />
          <span>Proof-First: Photo Evidence Requested</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>24h window</span>
        </div>
      </div>

      <div className="mt-2.5">
        <p className="text-slate-600 mb-2 leading-relaxed">
          {isBuyer
            ? 'To ensure an objective resolution, please provide clear photos matching these 3 angles:'
            : 'Buyer has been requested to submit guided photo evidence:'}
        </p>

        <div className="grid grid-cols-3 gap-2">
          {shotList.map((shot, idx) => (
            <div
              key={idx}
              className="bg-slate-50 border border-slate-200 rounded p-2 flex flex-col items-center text-center text-slate-700"
            >
              <span className="text-[10px] font-mono text-slate-400 font-semibold mb-0.5">
                ANGLE 0{idx + 1}
              </span>
              <span className="font-medium text-[11px] leading-tight capitalize">
                {String(shot).replace(/^[①②③\d\.\s_]+/, '').replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isBuyer ? (
        <div className="mt-3 flex gap-2">
          <button
            onClick={onOpenUpload}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium py-1.5 px-3 rounded text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Take Photos</span>
          </button>
          <button
            onClick={onOpenUpload}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium py-1.5 px-3 rounded text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>Upload Files</span>
          </button>
        </div>
      ) : (
        <div className="mt-2.5 text-slate-600 bg-slate-50 py-1.5 px-2.5 rounded border border-slate-200 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>Awaiting buyer submission. Payment remains protected in escrow.</span>
        </div>
      )}
    </div>
  );
};
