import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../../nexconn/port';
import { CardRenderer } from './cards';
import { Languages, Info } from 'lucide-react';
import { api } from '../../api/client';

interface Props {
  messages: ChatMessage[];
  currentUserId: string;
  isBuyer: boolean;
  userLang: string;
  counterpartName: string;
  disputeId: string;
  isFrozen?: boolean;
  onOpenUpload?: () => void;
  onAcceptProposal?: (optionId: string) => void;
  onCounterProposal?: (optionId: string) => void;
  onDeclineProposal?: (optionId: string) => void;
}

interface TranslationState {
  [msgUid: string]: {
    translation: string;
    sourceLang: string;
    toneNote: string | null;
    showOriginal: boolean;
  };
}

export const MessageList: React.FC<Props> = ({
  messages,
  currentUserId,
  isBuyer,
  userLang,
  counterpartName,
  disputeId,
  isFrozen = false,
  onOpenUpload,
  onAcceptProposal,
  onCounterProposal,
  onDeclineProposal,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [translations, setTranslations] = useState<TranslationState>({});

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, translations]);

  // Auto-translate foreign text messages
  useEffect(() => {
    const textMessages = messages.filter(
      (m) => m.kind === 'text' && m.senderId !== currentUserId && !translations[m.uid]
    );

    if (textMessages.length === 0) return;

    const itemsToFetch = textMessages.map((m) => ({
      messageUid: m.uid,
      text: (m as any).text,
    }));

    api
      .translate(disputeId, userLang, itemsToFetch)
      .then((res) => {
        setTranslations((prev) => {
          const next = { ...prev };
          for (const item of res.items) {
            next[item.messageUid] = {
              translation: item.translation,
              sourceLang: item.sourceLang,
              toneNote: item.toneNote,
              showOriginal: false,
            };
          }
          return next;
        });
      })
      .catch((err) => {
        console.warn('Auto-translate error:', err);
      });
  }, [messages, currentUserId, userLang, disputeId]);

  const toggleShowOriginal = (uid: string) => {
    setTranslations((prev) => {
      if (!prev[uid]) return prev;
      return {
        ...prev,
        [uid]: { ...prev[uid], showOriginal: !prev[uid].showOriginal },
      };
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/60">
      {messages.map((msg) => {
        if (msg.kind === 'envelope') {
          return (
            <div key={msg.uid} className="w-full">
              <CardRenderer
                envelope={msg.env}
                currentUserId={currentUserId}
                isBuyer={isBuyer}
                userLang={userLang}
                counterpartName={counterpartName}
                isFrozen={isFrozen}
                onOpenUpload={onOpenUpload}
                onAcceptProposal={onAcceptProposal}
                onCounterProposal={onCounterProposal}
                onDeclineProposal={onDeclineProposal}
              />
            </div>
          );
        }

        const isMine = msg.senderId === currentUserId;
        const trans = translations[msg.uid];
        const displayText = trans && !trans.showOriginal ? trans.translation : msg.text;
        const isTranslated = trans && trans.translation !== msg.text;

        return (
          <div
            key={msg.uid}
            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%] ${
              isMine ? 'ml-auto' : 'mr-auto'
            }`}
          >
            {/* Sender tag */}
            <span className="text-[10px] text-slate-400 mb-1 px-1">
              {isMine ? 'You' : counterpartName}
            </span>

            {/* Bubble */}
            <div
              className={`rounded-lg px-3 py-2 text-xs leading-relaxed ${
                isMine
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-900 border border-slate-200'
              }`}
            >
              <p>{displayText}</p>
            </div>

            {/* Translation footer and tone note */}
            {!isMine && isTranslated && trans && (
              <div className="mt-1 px-1 flex flex-col gap-0.5 text-[11px] text-slate-500 font-mono">
                <div className="flex items-center gap-1">
                  <Languages className="w-3 h-3 text-slate-400" />
                  <span>Translated from {trans.sourceLang.toUpperCase()} · </span>
                  <button
                    onClick={() => toggleShowOriginal(msg.uid)}
                    className="text-slate-700 hover:text-slate-900 underline cursor-pointer"
                  >
                    {trans.showOriginal ? 'Show translation' : 'Show original'}
                  </button>
                </div>

                {trans.toneNote && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-sans font-medium text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200 mt-0.5">
                    <Info className="w-3 h-3 text-amber-600" />
                    <span>{trans.toneNote}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
