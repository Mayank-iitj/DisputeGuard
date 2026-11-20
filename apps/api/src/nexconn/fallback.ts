import { DgEnvelope, serializeDgEnvelope } from '@dg/shared';
import { ServerChatPort } from './port';
import { WebSocket, WebSocketServer } from 'ws';

export interface StoredMessage {
  uid: string;
  channelId: string;
  senderId: string;
  text: string;
  ts: number;
  env?: DgEnvelope;
}

export class FallbackServerImpl implements ServerChatPort {
  private channels = new Map<string, Set<string>>(); // channelId -> Set<userId>
  private messages = new Map<string, StoredMessage[]>(); // channelId -> StoredMessage[]
  private clients = new Map<string, Set<WebSocket>>(); // userId -> Set<WebSocket>
  public wss: WebSocketServer | null = null;

  constructor() {}

  public setWebSocketServer(wss: WebSocketServer) {
    this.wss = wss;
    this.wss.on('connection', (ws: WebSocket, req) => {
      const url = new URL(req.url || '/', 'http://localhost');
      const userId = url.searchParams.get('userId') || 'anonymous';
      const channelId = url.searchParams.get('channelId');

      if (!this.clients.has(userId)) {
        this.clients.set(userId, new Set());
      }
      this.clients.get(userId)!.add(ws);

      // If channel requested, send recent history
      if (channelId && this.messages.has(channelId)) {
        const history = this.messages.get(channelId)!;
        ws.send(JSON.stringify({ type: 'history', channelId, messages: history }));
      }

      ws.on('message', (data: string) => {
        try {
          const payload = JSON.parse(data.toString());
          if (payload.type === 'join') {
            const chanId = payload.channelId;
            const history = this.messages.get(chanId) || [];
            ws.send(JSON.stringify({ type: 'history', channelId: chanId, messages: history }));
          } else if (payload.type === 'send_text') {
            this.broadcastText(payload.channelId, userId, payload.text, payload.uid);
          }
        } catch (e) {
          console.error('Error parsing client WS message:', e);
        }
      });

      ws.on('close', () => {
        this.clients.get(userId)?.delete(ws);
      });
    });
  }

  async registerUser(userId: string, name: string, avatarUrl?: string): Promise<{ token: string }> {
    const token = `dg_token_${userId}_${Date.now()}`;
    return { token };
  }

  async createChannel(channelId: string, memberIds: string[]): Promise<void> {
    if (!this.channels.has(channelId)) {
      this.channels.set(channelId, new Set(memberIds));
      this.messages.set(channelId, []);
    } else {
      for (const m of memberIds) {
        this.channels.get(channelId)!.add(m);
      }
    }
  }

  async addMember(channelId: string, userId: string): Promise<void> {
    if (!this.channels.has(channelId)) {
      this.channels.set(channelId, new Set());
    }
    this.channels.get(channelId)!.add(userId);
  }

  async sendEnvelope(channelId: string, fromUserId: string, env: DgEnvelope): Promise<{ uid: string }> {
    const uid = env.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const msg: StoredMessage = {
      uid,
      channelId,
      senderId: fromUserId,
      text: serializeDgEnvelope(env, 'fallback'),
      ts: env.ts || Date.now(),
      env,
    };

    if (!this.messages.has(channelId)) {
      this.messages.set(channelId, []);
    }
    this.messages.get(channelId)!.push(msg);

    this.broadcastToChannel(channelId, {
      type: 'message',
      message: msg,
    });

    return { uid };
  }

  async closeChannel(channelId: string): Promise<void> {
    this.broadcastToChannel(channelId, {
      type: 'channel_closed',
      channelId,
    });
  }

  public broadcastText(channelId: string, senderId: string, text: string, clientUid?: string): StoredMessage {
    const uid = clientUid || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const msg: StoredMessage = {
      uid,
      channelId,
      senderId,
      text,
      ts: Date.now(),
    };

    if (!this.messages.has(channelId)) {
      this.messages.set(channelId, []);
    }
    this.messages.get(channelId)!.push(msg);

    this.broadcastToChannel(channelId, {
      type: 'message',
      message: msg,
    });

    return msg;
  }

  public getChannelMessages(channelId: string): StoredMessage[] {
    return this.messages.get(channelId) || [];
  }

  public clearAll() {
    this.messages.clear();
    this.channels.clear();
  }

  private broadcastToChannel(channelId: string, payload: any) {
    const jsonStr = JSON.stringify(payload);
    // Broadcast to all connected sockets
    if (this.wss) {
      for (const client of this.wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(jsonStr);
        }
      }
    }
  }
}

let fallbackSingleton: FallbackServerImpl | null = null;
export function getFallbackServer(): FallbackServerImpl {
  if (!fallbackSingleton) {
    fallbackSingleton = new FallbackServerImpl();
  }
  return fallbackSingleton;
}
