import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getChatClient } from '../nexconn/client';
import { ChatMessage } from '../nexconn/port';
import { MessageList } from '../features/chat/MessageList';
import { Composer } from '../features/chat/Composer';
import { EvidenceModal } from '../features/evidence/EvidenceModal';
import { CounterSheet } from '../features/chat/CounterSheet';
import { PersonaBar } from '../components/PersonaBar';
import { soundFx } from '../services/soundFx';
import {
  Package,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';

export const BuyerPortal: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeDispute, setActiveDispute] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connStatus, setConnStatus] = useState<string>('disconnected');

  // Modals
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [reportReason, setReportReason] = useState<string>('damaged');
  const [reportText, setReportText] = useState<string>('コップが割れていました');
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);
  const [showCounterSheet, setShowCounterSheet] = useState<boolean>(false);
  const [selectedOptionForCounter, setSelectedOptionForCounter] = useState<any>(null);

  const chat = getChatClient();

  useEffect(() => {
    // Login as buyer_aiko
    api.loginPersona('buyer_aiko').then((res) => {
      setUser(res.user);
      chat.init(res.nexconn.appKey);
      chat.connect(res.nexconn.token, res.user.id);
      loadOrders(true);
    });

    const unsubConn = chat.onConnection((s) => setConnStatus(s));
    const unsubMsg = chat.onMessage((m) => {
      setMessages((prev) => [...prev, m]);
      // Trigger rich sound feedback
      if (m.kind === 'envelope') {
        if (m.env.kind === 'card.resolution') {
          soundFx.playResolution();
          setActiveDispute((prev: any) => (prev ? { ...prev, status: 'RESOLVED' } : prev));
        } else if (m.env.kind === 'card.alert_notice') {
          soundFx.playFreeze();
          setActiveDispute((prev: any) => (prev ? { ...prev, frozen: true, risk: { ...prev.risk, frozen: true, band: 'high' } } : prev));
        } else {
          soundFx.playCard();
        }
      } else {
        soundFx.playMessage();
      }
    });

    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('disputeguard_realtime_bus');
      bc.onmessage = (event) => {
        if (event.data?.type === 'stage_action' || event.data?.type === 'realtime_event') {
          if (event.data.action === 'select_dispute' && event.data.disputeId) {
            openDispute(event.data.disputeId);
          } else if (event.data.action === 'refresh_dispute') {
            loadOrders(true);
            if (event.data.disputeId) openDispute(event.data.disputeId);
          }
        }
      };
    }

    return () => {
      unsubConn();
      unsubMsg();
      bc?.close();
    };
  }, []);

  const loadOrders = async (autoSelect = false) => {
    try {
      const res = await api.getOrders();
      setOrders(res.items);
      // Auto-open dispute on initial mount if none is active
      if (autoSelect) {
        const disputed = res.items.find((o) => o.disputeId);
        if (disputed && disputed.disputeId) {
          openDispute(disputed.disputeId);
        }
      }
    } catch (e) {
      console.error('Failed to load orders:', e);
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

  const broadcastRealtimeAction = (action: string, disputeId?: string) => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bus = new BroadcastChannel('disputeguard_realtime_bus');
        bus.postMessage({ type: 'realtime_event', action, disputeId });
        bus.close();
      } catch (e) {}
    }
  };

  const handleCreateDispute = async () => {
    if (!selectedOrder) return;
    try {
      const res = await api.createDispute(selectedOrder.id, reportReason as any, reportText);
      setShowReportModal(false);
      setActiveDispute(res);
      chat.joinChannel(res.channelId);
      loadOrders(true);
      broadcastRealtimeAction('refresh_dispute', res.id);
    } catch (e) {
      console.error('Failed to open dispute:', e);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeDispute) return;
    const { uid } = await chat.sendText(activeDispute.channelId, text);
    broadcastRealtimeAction('refresh_dispute', activeDispute.id);
    // Observe call for server risk scoring
    try {
      const obs = await api.observe(activeDispute.id, uid, text);
      if (obs.risk?.frozen) {
        soundFx.playFreeze();
        setActiveDispute((prev: any) => ({
          ...prev,
          frozen: true,
          risk: { ...prev.risk, frozen: true, band: 'high' },
        }));
        broadcastRealtimeAction('refresh_dispute', activeDispute.id);
      }
    } catch (e) {
      console.warn('Observe call failed:', e);
    }
  };

  const handleAcceptProposal = async (optionId: string) => {
    if (!activeDispute || !activeDispute.proposal) return;
    if (isResolved || activeDispute.status === 'RESOLVED') return;
    try {
      await api.respondProposal(activeDispute.id, activeDispute.proposal.id, 'accept', optionId);
      // Refresh dispute
      const updated = await api.getDispute(activeDispute.id);
      setActiveDispute(updated);
      broadcastRealtimeAction('refresh_dispute', activeDispute.id);
    } catch (e: any) {
      if (e?.code === 'ALREADY_RESOLVED' || e?.message?.includes('resolved')) {
        const updated = await api.getDispute(activeDispute.id);
        setActiveDispute(updated);
        return;
      }
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
      broadcastRealtimeAction('refresh_dispute', activeDispute.id);
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
      broadcastRealtimeAction('refresh_dispute', activeDispute.id);
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
      broadcastRealtimeAction('refresh_dispute', activeDispute.id);
    } catch (e) {
      console.error('Error uploading evidence:', e);
    }
  };

  const isResolved = activeDispute?.status === 'RESOLVED' || activeDispute?.status === 'CLOSED';
  const isFrozen = activeDispute?.frozen || activeDispute?.risk?.frozen;

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans">
      <PersonaBar />
      {/* Top Bar */}
      <header className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 antialiased">
        <div className="flex items-center gap-2">
          {activeDispute ? (
            <button
              onClick={() => setActiveDispute(null)}
              className="p-1 rounded text-slate-500 hover:text-slate-900 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <Package className="w-4 h-4 text-slate-600" />
          )}
          <div>
            <h1 className="text-xs font-semibold text-slate-900 leading-tight">
              {activeDispute ? activeDispute.orderTitle : 'Purchases'}
            </h1>
            <span className="text-[10px] text-slate-400 font-mono block">
              Aiko Tanaka · 日本語 (ja)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {activeDispute && (
            <div
              className={`flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                isFrozen
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isFrozen ? <Lock className="w-3 h-3 text-rose-600" /> : <ShieldCheck className="w-3 h-3 text-emerald-600" />}
              <span>{isFrozen ? 'Escrow: FROZEN' : 'Escrow: HELD'}</span>
            </div>
          )}

          {/* Connection status indicator */}
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              connStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
            title={`Nexconn status: ${connStatus}`}
          />
        </div>
      </header>

      {/* Main content: Either Orders list or Dispute Chat */}
      {!activeDispute ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Recent Purchases
            </span>
            <span className="text-xs text-slate-400">Buyer Protection Active</span>
          </div>

          {orders.map((ord) => {
            const isDelivered = ord.status === 'delivered';
            const isDisputed = ord.status === 'disputed' || ord.disputeId;

            return (
              <div
                key={ord.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    <Package className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{ord.title}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>Order {ord.id}</span>
                      <span>·</span>
                      <span className="font-semibold text-slate-800">
                        ${(ord.amount.value / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  {isDisputed ? (
                    <button
                      onClick={() => openDispute(ord.disputeId)}
                      className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                      <span>View Dispute</span>
                    </button>
                  ) : isDelivered ? (
                    <button
                      onClick={() => {
                        setSelectedOrder(ord);
                        setShowReportModal(true);
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Report a Problem</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 capitalize">{ord.status}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <MessageList
            messages={messages}
            currentUserId={user?.id || 'u_buyer_aiko'}
            isBuyer={true}
            userLang="ja"
            counterpartName="Marco (Seller)"
            disputeId={activeDispute.id}
            isFrozen={isFrozen}
            isResolved={isResolved}
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
            userLang="ja"
          />
        </div>
      )}

      {/* 2-Step Report a Problem Modal */}
      {showReportModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className="font-bold text-slate-800 text-sm">Report a Problem</span>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Opening dispute for <strong>{selectedOrder.title}</strong> (${(selectedOrder.amount.value / 100).toFixed(2)}).
                Your payment stays protected in escrow while we resolve this.
              </p>

              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">What went wrong?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'damaged', label: 'Damaged item' },
                    { id: 'wrong_item_or_size', label: 'Wrong item or size' },
                    { id: 'not_received', label: 'Not received' },
                    { id: 'not_as_described', label: 'Not as described' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setReportReason(r.id)}
                      className={`p-2.5 rounded-lg border text-left font-semibold transition cursor-pointer ${
                        reportReason === r.id
                          ? 'border-sky-500 bg-sky-50 text-sky-900'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Describe the issue (in your language):
                </label>
                <textarea
                  rows={2}
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDispute}
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Start Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Capture Modal */}
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
