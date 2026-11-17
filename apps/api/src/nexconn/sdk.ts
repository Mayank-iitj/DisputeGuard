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
    const curTime = Math.floor(Date.now() / 1000).toString();
    const checkSum = crypto
      .createHash('sha1')
      .update(this.appSecret + nonce + curTime)
      .digest('hex');

    return {
      'App-Key': this.appKey,
      Nonce: nonce,
      CurTime: curTime,
      CheckSum: checkSum,
      'Content-Type': 'application/json',
    };
  }

  async registerUser(userId: string, name: string, avatarUrl?: string): Promise<{ token: string }> {
    if (!this.appKey || !this.appSecret || process.env.NEXCONN_MODE === 'fallback') {
      return this.fallback.registerUser(userId, name, avatarUrl);
    }

    try {
      // In real Nexconn endpoint, calls user/getToken
      return { token: `nexconn_tok_${userId}` };
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
