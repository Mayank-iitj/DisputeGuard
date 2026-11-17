import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getChatClient } from '../nexconn/client';
import { ChatMessage } from '../nexconn/port';
import { MessageList } from '../features/chat/MessageList';
import { Composer } from '../features/chat/Composer';
import { EvidenceModal } from '../features/evidence/EvidenceModal';
import { CounterSheet } from '../features/chat/CounterSheet';
import {
  Store,
  ShieldCheck,
  ArrowLeft,
  Lock,
} from 'lucide-react';

export const SellerPortal: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeDispute, setActiveDispute] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connStatus, setConnStatus] = useState<string>('disconnected');

  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);
  const [showCounterSheet, setShowCounterSheet] = useState<boolean>(false);
  const [selectedOptionForCounter, setSelectedOptionForCounter] = useState<any>(null);

  const chat = getChatClient();

  useEffect(() => {
    // Login as seller_marco
    api.loginPersona('seller_marco').then((res) => {
      setUser(res.user);
      chat.init(res.nexconn.appKey);
      chat.connect(res.nexconn.token, res.user.id);
      loadOrders();
    });

    const unsubConn = chat.onConnection((s) => setConnStatus(s));
    const unsubMsg = chat.onMessage((m) => {
      setMessages((prev) => [...prev, m]);
      if (m.kind === 'envelope' && m.env.kind === 'card.resolution') {
        setActiveDispute((prev: any) => (prev ? { ...prev, status: 'RESOLVED' } : prev));
      }
    });

    return () => {
      unsubConn();
      unsubMsg();
    };
  }, []);

  const loadOrders = async () => {
    try {
      const res = await api.getOrders();
      setOrders(res.items);
      const disputed = res.items.find((o) => o.disputeId);
      if (disputed && disputed.disputeId) {
        openDispute(disputed.disputeId);
      }
    } catch (e) {
      console.error('Failed to load seller orders:', e);
    }
  };

  const openDispute = async (disputeId: string) => {
    try {
      const data = await api.getDispute(disputeId);
      setActiveDispute(data);
      chat.joinChannel(data.channelId);
    } catch (e) {
      console.error('Failed to fetch dispute:', e);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeDispute) return;
    const { uid } = await chat.sendText(activeDispute.channelId, text);
    try {
      await api.observe(activeDispute.id, uid, text);
    } catch (e) {
      console.warn('Observe failed:', e);
    }
  };

  const handleAcceptProposal = async (optionId: string) => {
    if (!activeDispute || !activeDispute.proposal) return;
    try {
      await api.respondProposal(activeDispute.id, activeDispute.proposal.id, 'accept', optionId);
      const updated = await api.getDispute(activeDispute.id);
      setActiveDispute(updated);
    } catch (e) {
      console.error('Error accepting proposal:', e);
    }
  };

  const handleOpenCounter = (optionId: string) => {
    if (!activeDispute || !activeDispute.proposal) return;
    const opt = activeDispute.proposal.options.find((o: any) => o.id === optionId);
    setSelectedOptionForCounter(opt);
    setShowCounterSheet(true);
  };

  const handleConfirmCounter = async (counterMinor: number) => {
    if (!activeDispute || !activeDispute.proposal || !selectedOptionForCounter) return;
    try {
      await api.respondProposal(
        activeDispute.id,
        activeDispute.proposal.id,
        'counter',
        selectedOptionForCounter.id,
        { value: counterMinor, currency: 'USD' }
      );
      const updated = await api.getDispute(activeDispute.id);
      setActiveDispute(updated);
    } catch (e) {
      console.error('Error submitting counter:', e);
    }
  };

  const handleDeclineProposal = async (optionId: string) => {
    if (!activeDispute || !activeDispute.proposal) return;
    try {
      await api.respondProposal(activeDispute.id, activeDispute.proposal.id, 'decline', optionId);
      const updated = await api.getDispute(activeDispute.id);
      setActiveDispute(updated);
    } catch (e) {
      console.error('Error declining proposal:', e);
    }
  };

  const handleSubmitEvidence = async (files: any[]) => {
    if (!activeDispute) return;
    try {
      await api.submitEvidence(activeDispute.id, files);
      setShowEvidenceModal(false);
      const updated = await api.getDispute(activeDispute.id);
      setActiveDispute(updated);
    } catch (e) {
      console.error('Error uploading counter evidence:', e);
    }
  };

  const isResolved = activeDispute?.status === 'RESOLVED' || activeDispute?.status === 'CLOSED';
  const isFrozen = activeDispute?.frozen || activeDispute?.risk?.frozen;

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans">
      <header className="h-13 bg-white border-b border-slate-200 px-4 flex items-center justify-between shadow-2xs shrink-0">
        <div className="flex items-center gap-2">
          {activeDispute ? (
            <button
              onClick={() => setActiveDispute(null)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <Store className="w-5 h-5 text-indigo-600" />
          )}
          <div>
            <h1 className="text-xs font-bold text-slate-900">
              {activeDispute ? activeDispute.orderTitle : 'Seller Merchant Portal'}
            </h1>
            <span className="text-[10px] text-slate-500 block -mt-0.5">
              Marco Rossi (Español)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeDispute && (
            <div
              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isFrozen
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
            >
              {isFrozen ? <Lock className="w-3 h-3 text-rose-600" /> : <ShieldCheck className="w-3 h-3 text-emerald-600" />}
              <span>{isFrozen ? 'Escrow: FROZEN' : 'Escrow: HELD'}</span>
            </div>
          )}

          <span
            className={`w-2 h-2 rounded-full ${
              connStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
            title={`Nexconn status: ${connStatus}`}
          />
        </div>
      </header>

      {!activeDispute ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Fulfillment Orders
            </span>
          </div>

          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between"
            >
              <div>
                <h3 className="text-xs font-bold text-slate-900">{ord.title}</h3>
                <span className="text-[11px] text-slate-500 block">
                  Order {ord.id} · ${(ord.amount.value / 100).toFixed(2)} USD
                </span>
              </div>

              {ord.disputeId ? (
                <button
                  onClick={() => openDispute(ord.disputeId)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dispute Active</span>
                </button>
              ) : (
                <span className="text-xs text-slate-400 capitalize">{ord.status}</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <MessageList
            messages={messages}
            currentUserId={user?.id || 'u_seller_marco'}
            isBuyer={false}
            userLang="es"
            counterpartName="Aiko (Buyer)"
            disputeId={activeDispute.id}
            isFrozen={isFrozen}
            onOpenUpload={() => setShowEvidenceModal(true)}
            onAcceptProposal={handleAcceptProposal}
            onCounterProposal={handleOpenCounter}
            onDeclineProposal={handleDeclineProposal}
          />

          <Composer
            disabled={isResolved}
            disabledReason="Dispute has been settled. Escrow released."
            onSend={handleSendMessage}
            onAttach={() => setShowEvidenceModal(true)}
            userLang="es"
          />
        </div>
      )}

      {/* Evidence Modal for seller counter-evidence */}
      <EvidenceModal
        isOpen={showEvidenceModal}
        onClose={() => setShowEvidenceModal(false)}
        onSubmit={handleSubmitEvidence}
      />

      {/* Counter Slider Sheet */}
      {selectedOptionForCounter && activeDispute && (
        <CounterSheet
          isOpen={showCounterSheet}
          onClose={() => setShowCounterSheet(false)}
          optionTitle={selectedOptionForCounter.title}
          originalRefundMinor={selectedOptionForCounter.buyerGets.value}
          orderTotalMinor={activeDispute.orderAmount?.value || 8400}
          onConfirm={handleConfirmCounter}
        />
      )}
    </div>
  );
};
