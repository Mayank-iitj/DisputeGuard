import React, { useState } from 'react';
import { Camera, Image as ImageIcon, X, Sparkles, CheckCircle2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <Camera className="w-4 h-4 text-amber-600" />
            <span>Guided Evidence Capture</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
            <span className="font-semibold block">Dispute Protocol Check:</span>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800">
              <li>Step 1: Capture the whole item in clear lighting</li>
              <li>Step 2: Capture a close-up macro of the exact crack/damage</li>
              <li>Step 3: Capture the shipping box and transit packaging</li>
            </ul>
          </div>

          {/* Photo gallery preview */}
          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-2">
              Captured Photos ({selectedPhotos.length} / 4)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {selectedPhotos.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group aspect-square rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-2xs"
                >
                  <img src={url} alt="capture" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setSelectedPhotos((p) => p.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/70 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-[10px] text-white rounded">
                    Shot {idx + 1}
                  </span>
                </div>
              ))}

              {selectedPhotos.length < 4 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/50 flex flex-col items-center justify-center text-slate-500 hover:text-amber-700 transition cursor-pointer">
                  <Camera className="w-6 h-6 mb-1 text-slate-400" />
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
              className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Use demo fixture set
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedPhotos.length === 0 || isLoading}
                onClick={handleSubmit}
                className="py-2 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Submit & Run AI Assessment</span>
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
