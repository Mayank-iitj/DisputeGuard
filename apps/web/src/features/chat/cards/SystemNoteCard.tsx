import React from 'react';
import { SystemNoteCardData } from '@dg/shared';
import { Info } from 'lucide-react';

interface Props {
  data: SystemNoteCardData;
}

export const SystemNoteCard: React.FC<Props> = ({ data }) => {
  return (
    <div className="my-1.5 mx-auto max-w-sm flex items-center justify-center gap-1.5 text-slate-500 text-[11px] italic">
      <Info className="w-3 h-3 text-slate-400" />
      <span>{data.text}</span>
    </div>
  );
};
