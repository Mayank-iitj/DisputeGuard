import React, { useState } from 'react';
import { Camera, Image as ImageIcon, X, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (files: Array<{ url: string; w?: number; h?: number }>) => void;
  isLoading?: boolean;
}

export const EvidenceModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, isLoading = false }) => {
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([
    '/img/fixture_cup_crack_1.jpg',
    '/img/fixture_cup_crack_2.jpg',
  ]);

  if (!isOpen) return null;

  const handleSimulateAdd = () => {
    setSelectedPhotos((prev) => [...prev, '/img/fixture_cup_crack_pkg.jpg']);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setSelectedPhotos((prev) => [...prev, url]);
    }
  };

  const handleSubmit = () => {
    const files = selectedPhotos.map((url) => ({ url, w: 1280, h: 960 }));
    onSubmit(files);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 antialiased">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 font-semibold text-slate-900 text-xs">
            <Camera className="w-4 h-4 text-slate-600" />
            <span>Guided Evidence Capture</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-700 space-y-1 font-mono text-[11px]">
            <span className="font-semibold block text-slate-900">Required Capture Angles:</span>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600">
              <li>Angle 01: Full product overview in even lighting</li>
              <li>Angle 02: Macro close-up of defect/damage area</li>
              <li>Angle 03: Shipping carton and exterior label</li>
            </ul>
          </div>

          {/* Photo gallery preview */}
          <div>
            <span className="text-xs font-medium text-slate-700 block mb-2 font-mono">
              Captured Photos ({selectedPhotos.length} / 4)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {selectedPhotos.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group aspect-square rounded bg-slate-100 border border-slate-200 overflow-hidden"
                >
                  <img src={url} alt="capture" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setSelectedPhotos((p) => p.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 rounded bg-slate-950/70 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-[10px] font-mono text-white rounded">
                    Shot 0{idx + 1}
                  </span>
                </div>
              ))}

              {selectedPhotos.length < 4 && (
                <label className="aspect-square rounded border-2 border-dashed border-slate-300 hover:border-slate-500 bg-slate-50 hover:bg-slate-100/60 flex flex-col items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer">
                  <Camera className="w-5 h-5 mb-1 text-slate-400" />
                  <span className="text-[11px] font-medium">+ Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={handleSimulateAdd}
              className="text-xs font-mono text-slate-500 hover:text-slate-900 underline cursor-pointer"
            >
              Use demo fixture set
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-1.5 px-3 rounded border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedPhotos.length === 0 || isLoading}
                onClick={handleSubmit}
                className="py-1.5 px-4 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <span>Assessing...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Submit Evidence</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
