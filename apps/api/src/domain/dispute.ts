import { AppDatabase } from '../db/database';
import { DisputeReason, DisputeStatus } from '@dg/shared';

export class DisputeDomain {
  constructor(private appDb: AppDatabase) {}

  public getDispute(id: string) {
    const row = this.appDb.db
      .prepare('SELECT * FROM disputes WHERE id = ?')
      .get(id) as any;
    return row || null;
  }

  public getDisputeByOrder(orderId: string) {
    const row = this.appDb.db
      .prepare('SELECT * FROM disputes WHERE order_id = ?')
      .get(orderId) as any;
    return row || null;
  }

  public updateStatus(id: string, newStatus: DisputeStatus) {
    const dispute = this.getDispute(id);
    if (!dispute) throw new Error(`Dispute ${id} not found`);

    if (dispute.status === 'RESOLVED' || dispute.status === 'CLOSED') {
      if (newStatus !== 'CLOSED') {
        throw {
          statusCode: 409,
          code: 'ALREADY_RESOLVED',
          message: 'Dispute is already resolved and closed',
        };
      }
    }

    const now = Date.now();
    let escalatedAt = dispute.escalated_at;
    let resolvedAt = dispute.resolved_at;

    if (newStatus === 'ESCALATED' && !escalatedAt) {
      escalatedAt = now;
    }
    if (newStatus === 'RESOLVED' && !resolvedAt) {
      resolvedAt = now;
    }

    this.appDb.db
      .prepare(`
        UPDATE disputes 
        SET status = ?, escalated_at = ?, resolved_at = ?
        WHERE id = ?
      `)
      .run(newStatus, escalatedAt, resolvedAt, id);

    return { ...dispute, status: newStatus, escalated_at: escalatedAt, resolved_at: resolvedAt };
  }
}
