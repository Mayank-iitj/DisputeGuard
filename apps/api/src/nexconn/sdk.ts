import * as crypto from 'node:crypto';
import { DgEnvelope } from '@dg/shared';
import { ServerChatPort } from './port';
import { getFallbackServer } from './fallback';

export class NexconnServerSdkImpl implements ServerChatPort {
  private appKey: string;
  private appSecret: string;
  private fallback: ServerChatPort;

  constructor() {
    this.appKey = process.env.NEXCONN_APP_KEY || '';
    this.appSecret = process.env.NEXCONN_APP_SECRET || '';
    this.fallback = getFallbackServer();
  }

  private getAuthHeaders() {
    const nonce = Math.floor(Math.random() * 1000000).toString();
    const timestamp = Date.now().toString();
    const signature = crypto
      .createHash('sha1')
      .update(this.appSecret + nonce + timestamp)
      .digest('hex');

    return {
      'App-Key': this.appKey,
      Nonce: nonce,
      Timestamp: timestamp,
      Signature: signature,
      'Content-Type': 'application/json',
    };
  }

  async registerUser(userId: string, name: string, avatarUrl?: string): Promise<{ token: string }> {
    if (!this.appKey || !this.appSecret || process.env.NEXCONN_MODE === 'fallback') {
      return this.fallback.registerUser(userId, name, avatarUrl);
    }

    try {
      // Official Nexconn Server API per https://docs.nexconn.ai/platform-chat-api/user/register
      const baseUrl = process.env.NEXCONN_DATA_CENTER === 'US'
        ? 'https://api.us-light-api.com'
        : 'https://api.sg-light-api.com';

      const res = await fetch(`${baseUrl}/v4/auth/access-token/issue`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ userId, name, avatarUrl }),
      });

      const data = (await res.json()) as any;
      if (data && data.code === 0 && data.result?.accessToken) {
        return { token: data.result.accessToken };
      }
      return this.fallback.registerUser(userId, name, avatarUrl);
    } catch {
      return this.fallback.registerUser(userId, name, avatarUrl);
    }
  }

  async createChannel(channelId: string, memberIds: string[]): Promise<void> {
    await this.fallback.createChannel(channelId, memberIds);
  }

  async addMember(channelId: string, userId: string): Promise<void> {
    await this.fallback.addMember(channelId, userId);
  }

  async sendEnvelope(channelId: string, fromUserId: string, env: DgEnvelope): Promise<{ uid: string }> {
    return this.fallback.sendEnvelope(channelId, fromUserId, env);
  }

  async closeChannel(channelId: string): Promise<void> {
    await this.fallback.closeChannel(channelId);
  }
}

let serverChatSingleton: ServerChatPort | null = null;
export function getServerChatPort(): ServerChatPort {
  if (!serverChatSingleton) {
    if (process.env.NEXCONN_MODE === 'fallback' || !process.env.NEXCONN_APP_KEY) {
      serverChatSingleton = getFallbackServer();
    } else {
      serverChatSingleton = new NexconnServerSdkImpl();
    }
  }
  return serverChatSingleton;
}
