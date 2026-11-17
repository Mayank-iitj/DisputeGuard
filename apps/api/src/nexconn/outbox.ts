import { AppDatabase } from '../db/database';
import { getServerChatPort } from './sdk';
import { DgEnvelope } from '@dg/shared';

export class OutboxWorker {
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private appDb: AppDatabase) {}

  public start(intervalMs = 500) {
    if (this.timer) return;
    this.timer = setInterval(() => this.flush(), intervalMs);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async flush(): Promise<number> {
    if (this.running) return 0;
    this.running = true;

    let processedCount = 0;
    try {
      const rows = this.appDb.db
        .prepare(`
          SELECT id, dispute_id, channel_id, from_user, envelope, attempts
          FROM outbox
          WHERE sent_at IS NULL AND attempts < 5
          ORDER BY id ASC
          LIMIT 10
        `)
        .all() as any[];

      if (rows.length === 0) {
        this.running = false;
        return 0;
      }

      const chatPort = getServerChatPort();

      for (const row of rows) {
        try {
          const envelope: DgEnvelope = JSON.parse(row.envelope);
          await chatPort.sendEnvelope(row.channel_id, row.from_user, envelope);

          this.appDb.db
            .prepare('UPDATE outbox SET sent_at = ? WHERE id = ?')
            .run(Date.now(), row.id);
          processedCount++;
        } catch (err) {
          console.error(`Failed to flush outbox item ${row.id}:`, err);
          this.appDb.db
            .prepare('UPDATE outbox SET attempts = attempts + 1 WHERE id = ?')
            .run(row.id);
        }
      }
    } catch (e) {
      console.error('Error in outbox worker flush:', e);
    } finally {
      this.running = false;
    }

    return processedCount;
  }

  public queueEnvelope(params: {
    disputeId?: string;
    channelId: string;
    fromUser: string;
    envelope: DgEnvelope;
  }) {
    const { disputeId, channelId, fromUser, envelope } = params;
    this.appDb.db
      .prepare(`
        INSERT INTO outbox (dispute_id, channel_id, from_user, envelope)
        VALUES (?, ?, ?, ?)
      `)
      .run(disputeId || null, channelId, fromUser, JSON.stringify(envelope));

    // Eagerly trigger flush in next microtask
    setImmediate(() => this.flush());
  }
}
