import { ChatMessage, ChatPort } from './port';
import { parseDgEnvelope } from '@dg/shared';

export class FallbackChatImpl implements ChatPort {
  private ws: WebSocket | null = null;
  private appKey: string = '';
  private token: string = '';
  private userId: string = '';
  private currentChannelId: string = '';
  private connectionStatus: 'connected' | 'connecting' | 'disconnected' = 'disconnected';

  private connListeners = new Set<(s: 'connected' | 'connecting' | 'disconnected') => void>();
  private msgListeners = new Set<(m: ChatMessage) => void>();
  private messageBuffer: ChatMessage[] = [];

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
        // Fallback to simulated connected state in demo
        this.setConnectionStatus('connected');
      };

      this.ws.onclose = () => {
        this.setConnectionStatus('disconnected');
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
  }

  async sendText(channelId: string, text: string): Promise<{ uid: string; ts: number }> {
    const uid = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ts = Date.now();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'send_text', channelId, text, uid }));
    } else {
      // Local broadcast
      const chatMsg: ChatMessage = {
        kind: 'text',
        uid,
        channelId,
        senderId: this.userId,
        ts,
        text,
      };
      this.broadcastLocal(chatMsg);
    }

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
    const env = parseDgEnvelope(raw.text);
    let chatMsg: ChatMessage;

    if (env) {
      chatMsg = {
        kind: 'envelope',
        uid: raw.uid || env.id,
        channelId: raw.channelId || env.disputeId,
        senderId: raw.senderId || 'u_dg_arbitrator',
        ts: raw.ts || env.ts || Date.now(),
        env,
      };
    } else {
      chatMsg = {
        kind: 'text',
        uid: raw.uid,
        channelId: raw.channelId,
        senderId: raw.senderId,
        ts: raw.ts || Date.now(),
        text: raw.text,
      };
    }

    this.messageBuffer.push(chatMsg);
    for (const listener of this.msgListeners) {
      listener(chatMsg);
    }
  }

  public broadcastLocal(m: ChatMessage) {
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
