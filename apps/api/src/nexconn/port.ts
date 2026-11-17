import { DgEnvelope } from '@dg/shared';

export interface ServerChatPort {
  registerUser(userId: string, name: string, avatarUrl?: string): Promise<{ token: string }>;
  createChannel(channelId: string, memberIds: string[]): Promise<void>;
  addMember(channelId: string, userId: string): Promise<void>;
  sendEnvelope(channelId: string, fromUserId: string, env: DgEnvelope): Promise<{ uid: string }>;
  closeChannel(channelId: string): Promise<void>;
}
