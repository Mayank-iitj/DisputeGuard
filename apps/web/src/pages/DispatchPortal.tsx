import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getChatClient } from '../nexconn/client';
import { ChatMessage } from '../nexconn/port';
import { DispatchHeader } from '../features/dispatch/DispatchHeader';
import { DispatchQueue } from '../features/dispatch/DispatchQueue';
import { DispatchTranscript } from '../features/dispatch/DispatchTranscript';
import { DispatchSidePanel } from '../features/dispatch/DispatchSidePanel';
import { AgentBrief, AgentMetricsResponse, QueueItem } from '@dg/shared';

export const DispatchPortal: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<AgentMetricsResponse | null>(null);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [activeDispute, setActiveDispute] = useState<any>(null);
  const [brief, setBrief] = useState<AgentBrief | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const chat = getChatClient();

  useEffect(() => {
    // Login as agent_priya
    api.loginPersona('agent_priya').then((res) => {
      setUser(res.user);
      chat.init(res.nexconn.appKey);
      chat.connect(res.nexconn.token, res.user.id);
      refreshData();
    });

    const unsubMsg = chat.onMessage((m) => {
      setMessages((prev) => [...prev, m]);
      // If ops queue delta event received, refresh queue!
      if (m.kind === 'envelope' && m.env.kind === 'evt.queue_delta') {
        refreshQueue();
      }
    });

    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('disputeguard_realtime_bus');
      bc.onmessage = (event) => {
        if (event.data?.type === 'stage_action') {
          if (event.data.action === 'select_dispatch' && event.data.disputeId) {
            handleSelectDispute(event.data.disputeId);
            refreshQueue();
          } else if (event.data.action === 'refresh_dispute') {
            refreshData();
            if (event.data.disputeId) {
              handleSelectDispute(event.data.disputeId);
            }
          }
        }
      };
    }

    // Polling interval for live queue and metrics
    const timer = setInterval(() => {
      refreshData();
    }, 5000);

    // Keyboard shortcuts (j/k queue navigation, t to takeover)
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setQueueItems((currentItems) => {
          if (currentItems.length === 0) return currentItems;
          const idx = currentItems.findIndex((it) => it.disputeId === selectedDisputeId);
          const nextIdx = idx < currentItems.length - 1 ? idx + 1 : 0;
          handleSelectDispute(currentItems[nextIdx].disputeId);
          return currentItems;
        });
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setQueueItems((currentItems) => {
          if (currentItems.length === 0) return currentItems;
          const idx = currentItems.findIndex((it) => it.disputeId === selectedDisputeId);
          const prevIdx = idx > 0 ? idx - 1 : currentItems.length - 1;
          handleSelectDispute(currentItems[prevIdx].disputeId);
          return currentItems;
        });
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleTakeover();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubMsg();
      bc?.close();
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const refreshData = async () => {
    await Promise.all([refreshQueue(), refreshMetrics()]);
  };

  const refreshQueue = async () => {
    try {
      const q = await api.getQueue();
      setQueueItems(q.items);
      // Auto-select first item if none selected
      if (!selectedDisputeId && q.items.length > 0) {
        handleSelectDispute(q.items[0].disputeId);
      }
    } catch (e) {
      console.error('Failed to fetch agent queue:', e);
    }
  };

  const refreshMetrics = async () => {
    try {
      const m = await api.getMetrics();
      setMetrics(m);
    } catch (e) {
      console.error('Failed to fetch metrics:', e);
    }
  };

  const handleSelectDispute = async (id: string) => {
    setSelectedDisputeId(id);
    try {
      const [disputeData, briefData] = await Promise.all([
        api.getDispute(id),
        api.getBrief(id).catch(() => null),
      ]);
      setActiveDispute(disputeData);
      setBrief(briefData);
      chat.joinChannel(disputeData.channelId);
    } catch (e) {
      console.error('Failed to load dispute for agent:', e);
    }
  };

  const handleTakeover = async () => {
    if (!selectedDisputeId) return;
    try {
      await api.takeover(selectedDisputeId, true);
      await handleSelectDispute(selectedDisputeId);
      refreshQueue();
    } catch (e) {
      console.error('Takeover failed:', e);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeDispute) return;
    await chat.sendText(activeDispute.channelId, text);
  };

  const handleResolve = async (
    action: 'refund_full' | 'refund_partial' | 'release_to_seller',
    note: string
  ) => {
    if (!selectedDisputeId) return;
    try {
      await api.resolveDispute(selectedDisputeId, action, note);
      await handleSelectDispute(selectedDisputeId);
      refreshData();
    } catch (e) {
      console.error('Resolve failed:', e);
    }
  };

  const handleUnfreeze = async (reason: string) => {
    if (!selectedDisputeId) return;
    try {
      await api.unfreeze(selectedDisputeId, reason);
      await handleSelectDispute(selectedDisputeId);
      refreshData();
    } catch (e) {
      console.error('Unfreeze failed:', e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 font-sans">
      <DispatchHeader
        metrics={metrics}
        agentName={user?.name || 'Priya Sharma'}
        onRefresh={refreshData}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Queue */}
        <DispatchQueue
          items={queueItems}
          selectedDisputeId={selectedDisputeId}
          onSelect={handleSelectDispute}
        />

        {/* Center: Case Transcript & Copilot */}
        <DispatchTranscript
          dispute={activeDispute}
          messages={messages}
          onSendMessage={handleSendMessage}
        />

        {/* Right: AI Brief, Policy Options, & Action Controls */}
        <DispatchSidePanel
          dispute={activeDispute}
          brief={brief}
          currentUserId={user?.id || 'u_agent_priya'}
          onTakeover={handleTakeover}
          onResolve={handleResolve}
          onUnfreeze={handleUnfreeze}
        />
      </div>
    </div>
  );
};
