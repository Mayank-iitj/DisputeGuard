import type { DgEnvelope } from '@dg/shared';

export type ChatMessage =
  | { kind: 'text'; uid: string; channelId: string; senderId: string; ts: number; text: string }
  | { kind: 'envelope'; uid: string; channelId: string; senderId: string; ts: number; env: DgEnvelope };

export interface ChatPort {
  init(appKey: string): void;
  connect(token: string, userId: string): Promise<{ userId: string }>;
  disconnect(): void;
  onConnection(cb: (s: 'connected' | 'connecting' | 'disconnected') => void): () => void;

  joinChannel(channelId: string): Promise<void>;
  sendText(channelId: string, text: string): Promise<{ uid: string; ts: number }>;
  history(channelId: string, before?: number, limit?: number): Promise<ChatMessage[]>;
  onMessage(cb: (m: ChatMessage) => void): () => void;
}
