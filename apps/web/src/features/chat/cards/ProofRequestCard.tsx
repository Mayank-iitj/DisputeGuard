import React from 'react';
import { ProofRequestCardData } from '@dg/shared';
import { Camera, Image as ImageIcon, Clock, CheckCircle2 } from 'lucide-react';

interface Props {
  data: ProofRequestCardData;
  isBuyer: boolean;
  onOpenUpload?: () => void;
}

export const ProofRequestCard: React.FC<Props> = ({ data, isBuyer, onOpenUpload }) => {
  return (
    <div className="my-3 mx-auto w-full max-w-lg rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm text-sm">
      <div className="flex items-center justify-between pb-2 border-b border-amber-200">
        <div className="flex items-center gap-2 font-semibold text-amber-900">
          <Camera className="w-4 h-4 text-amber-600" />
          <span>Proof-First: Photo Evidence Requested</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-amber-700">
          <Clock className="w-3.5 h-3.5" />
          <span>24h window</span>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs text-amber-800 mb-2">
          {isBuyer
            ? 'To ensure an objective resolution, please take clear photos matching these 3 angles:'
            : 'Buyer has been requested to submit guided photo evidence:'}
        </p>

        <div className="grid grid-cols-3 gap-2 text-xs">
          {data.shotList.map((shot, idx) => (
            <div
              key={idx}
              className="bg-white/80 border border-amber-200 rounded-lg p-2 flex flex-col items-center text-center text-slate-700 font-medium shadow-2xs"
            >
              <span className="text-amber-700 font-bold mb-1">Step {idx + 1}</span>
              <span>{shot.replace(/^[①②③\d\.\s]+/, '')}</span>
            </div>
          ))}
        </div>
      </div>

      {isBuyer ? (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onOpenUpload}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Take Photos</span>
          </button>
          <button
            onClick={onOpenUpload}
            className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-98 cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload from Gallery</span>
          </button>
        </div>
      ) : (
        <div className="mt-3 text-xs text-amber-800 bg-amber-100/60 py-1.5 px-3 rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Awaiting buyer submission. Payment remains protected in escrow.</span>
        </div>
      )}
    </div>
  );
};
