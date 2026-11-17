import React, { useState } from 'react';
import { Send, Paperclip, Lock } from 'lucide-react';

interface Props {
  disabled?: boolean;
  disabledReason?: string;
  onSend: (text: string) => void;
  onAttach?: () => void;
  userLang?: string;
}

export const Composer: React.FC<Props> = ({
  disabled = false,
  disabledReason,
  onSend,
  onAttach,
  userLang = 'ja',
}) => {
  const [text, setText] = useState('');

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const quickPhrases: Record<string, string[]> = {
    ja: [
      'コップが割れて届きました',
      '確認していただけますと幸いです。三回目です。',
      '解決されない場合は、カード会社にチャージバックを申請します',
      'I will not call the police, I only want a refund.',
    ],
    es: [
      'Las tazas llegaron en perfecto estado desde mi almacén.',
      'El embalaje era adecuado. No es mi culpa lo que haga la paquetería.',
      'Acepto la propuesta de compensación parcial.',
    ],
    en: [
      'Hello, I am reviewing your order.',
      'We have authorized a full refund to resolve this matter.',
    ],
  };

  const phrases = quickPhrases[userLang] || quickPhrases['en'] || [];

  return (
    <div className="border-t border-slate-200 bg-white p-3 shrink-0">
      {/* Quick test phrases toolbar */}
      {phrases.length > 0 && !disabled && (
        <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] text-slate-600">
          <span className="font-semibold text-slate-400 shrink-0">Demo phrases:</span>
          {phrases.map((phrase, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setText(phrase)}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 whitespace-nowrap border border-slate-200 transition cursor-pointer"
            >
              {phrase}
            </button>
          ))}
        </div>
      )}

      {disabled ? (
        <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-500 flex items-center justify-center gap-2 border border-slate-200">
          <Lock className="w-4 h-4 text-slate-400" />
          <span>{disabledReason || 'Chat composer is disabled for this resolved dispute.'}</span>
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {onAttach && (
            <button
              type="button"
              onClick={onAttach}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Attach photos"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          )}

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your message in your native language..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
          />

          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-lg transition active:scale-95 shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};
