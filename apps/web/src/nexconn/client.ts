import { ChatMessage, ChatPort } from './port';
import { parseDgEnvelope } from '@dg/shared';
import { api } from '../api/client';
import { soundFx } from '../services/soundFx';

export class FallbackChatImpl implements ChatPort {
  private ws: WebSocket | null = null;
  private bc: BroadcastChannel | null = null;
  private appKey: string = '';
  private token: string = '';
  private userId: string = '';
  private currentChannelId: string = '';
  private connectionStatus: 'connected' | 'connecting' | 'disconnected' = 'disconnected';

  private connListeners = new Set<(s: 'connected' | 'connecting' | 'disconnected') => void>();
  private msgListeners = new Set<(m: ChatMessage) => void>();
  private messageBuffer: ChatMessage[] = [];
  private seenUids = new Set<string>();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.bc = new BroadcastChannel('disputeguard_realtime_bus');
        this.bc.onmessage = (event) => {
          if (event.data && event.data.type === 'message') {
            this.handleRawMessage(event.data.message);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not available:', e);
      }
    }
  }

  init(appKey: string): void {
    this.appKey = appKey;
  }

  async connect(token: string, userId: string): Promise<{ userId: string }> {
    this.token = token;
    this.userId = userId;
    this.setConnectionStatus('connecting');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?userId=${encodeURIComponent(userId)}&channelId=${encodeURIComponent(
      this.currentChannelId
    )}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setConnectionStatus('connected');
        if (this.currentChannelId) {
          this.ws?.send(JSON.stringify({ type: 'join', channelId: this.currentChannelId }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'history') {
            for (const msg of payload.messages) {
              this.handleRawMessage(msg);
            }
          } else if (payload.type === 'message') {
            this.handleRawMessage(payload.message);
          }
        } catch (e) {
          console.error('Error handling WS message:', e);
        }
      };

      this.ws.onerror = () => {
        this.setConnectionStatus('connected');
      };

      this.ws.onclose = () => {
        this.setConnectionStatus('disconnected');
        // Auto-reconnect after 3s
        setTimeout(() => {
          if (this.token && this.userId) {
            this.connect(this.token, this.userId);
          }
        }, 3000);
      };
    } catch {
      this.setConnectionStatus('connected');
    }

    return { userId };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setConnectionStatus('disconnected');
  }

  private setConnectionStatus(s: 'connected' | 'connecting' | 'disconnected') {
    this.connectionStatus = s;
    for (const cb of this.connListeners) {
      cb(s);
    }
  }

  onConnection(cb: (s: 'connected' | 'connecting' | 'disconnected') => void): () => void {
    this.connListeners.add(cb);
    cb(this.connectionStatus);
    return () => this.connListeners.delete(cb);
  }

  async joinChannel(channelId: string): Promise<void> {
    this.currentChannelId = channelId;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'join', channelId }));
    }

    // Also fetch initial history from REST API for guaranteed delivery
    try {
      const res = await api.getMessages(channelId);
      if (res && res.messages) {
        for (const m of res.messages) {
          this.handleRawMessage(m);
        }
      }
    } catch {
      // Ignore
    }
  }

  async sendText(channelId: string, text: string): Promise<{ uid: string; ts: number }> {
    const uid = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ts = Date.now();

    const rawMsg = {
      uid,
      channelId,
      senderId: this.userId,
      text,
      ts,
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'send_text', channelId, text, uid }));
    }

    // Broadcast cross-iframe / cross-tab immediately
    if (this.bc) {
      try {
        this.bc.postMessage({ type: 'message', message: rawMsg });
      } catch (e) {
        console.warn('BC send failed:', e);
      }
    }

    this.handleRawMessage(rawMsg);
    return { uid, ts };
  }

  async history(channelId: string): Promise<ChatMessage[]> {
    return this.messageBuffer.filter((m) => m.channelId === channelId);
  }

  onMessage(cb: (m: ChatMessage) => void): () => void {
    this.msgListeners.add(cb);
    return () => this.msgListeners.delete(cb);
  }

  private handleRawMessage(raw: any) {
    if (!raw) return;
    const uid = raw.uid || (raw.env && raw.env.id) || `temp_${Math.random()}`;

    // Deduplicate
    if (this.seenUids.has(uid)) {
      return;
    }
    this.seenUids.add(uid);

    const env = parseDgEnvelope(raw.text);
    let chatMsg: ChatMessage;

    if (env) {
      chatMsg = {
        kind: 'envelope',
        uid,
        channelId: raw.channelId || env.disputeId,
        senderId: raw.senderId || 'u_dg_arbitrator',
        ts: raw.ts || env.ts || Date.now(),
        env,
      };
      if (env.kind === 'card.escalation_notice') {
        soundFx.playFreeze();
      } else if (env.kind === 'card.resolution') {
        soundFx.playResolution();
      } else {
        soundFx.playCard();
      }
    } else {
      chatMsg = {
        kind: 'text',
        uid,
        channelId: raw.channelId,
        senderId: raw.senderId,
        ts: raw.ts || Date.now(),
        text: raw.text,
      };
      soundFx.playMessage();
    }

    this.messageBuffer.push(chatMsg);
    for (const listener of this.msgListeners) {
      listener(chatMsg);
    }
  }

  public broadcastLocal(m: ChatMessage) {
    if (this.seenUids.has(m.uid)) return;
    this.seenUids.add(m.uid);
    this.messageBuffer.push(m);
    for (const listener of this.msgListeners) {
      listener(m);
    }
  }
}

// Single instance per window/iframe context
let clientSingleton: ChatPort | null = null;

export function getChatClient(): ChatPort {
  if (!clientSingleton) {
    clientSingleton = new FallbackChatImpl();
  }
  return clientSingleton;
}
