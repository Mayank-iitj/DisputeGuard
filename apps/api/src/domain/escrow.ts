import { AppDatabase } from '../db/database';
import { EscrowState } from '@dg/shared';

export interface EscrowTransitionParams {
  disputeId: string;
  toState: EscrowState;
  amountMinor: number;
  actorId: string;
  actorRole: 'buyer' | 'seller' | 'agent' | 'supervisor' | 'bot' | 'system';
  reasonCode: string;
  note?: string;
}

export class EscrowDomain {
  constructor(private appDb: AppDatabase) {}

  public getAccount(disputeId: string): { state: EscrowState; amountMinor: number; currency: string } | null {
    const row = this.appDb.db
      .prepare('SELECT state, amount_minor, currency FROM escrow_accounts WHERE dispute_id = ?')
      .get(disputeId) as any;
    if (!row) return null;
    return {
      state: row.state as EscrowState,
      amountMinor: row.amount_minor,
      currency: row.currency,
    };
  }

  public getLedger(disputeId: string) {
    return this.appDb.db
      .prepare('SELECT * FROM escrow_ledger WHERE dispute_id = ? ORDER BY created_at ASC')
      .all(disputeId) as any[];
  }

  public transition(params: EscrowTransitionParams) {
    const { disputeId, toState, amountMinor, actorId, actorRole, reasonCode, note } = params;
    const account = this.getAccount(disputeId);
    if (!account) {
      throw {
        statusCode: 404,
        code: 'NOT_FOUND',
        message: `Escrow account for dispute ${disputeId} not found`,
      };
    }

    const fromState = account.state;
    if (fromState === toState) {
      return account;
    }

    // Guard: Only agent or supervisor can move money out of FROZEN
    if (fromState === 'FROZEN') {
      const isAgent = actorRole === 'agent' || actorRole === 'supervisor';
      if (!isAgent) {
        throw {
          statusCode: 409,
          code: 'INVALID_TRANSITION',
          message: 'Escrow is FROZEN. Only authorized agents can modify frozen escrow.',
          details: { from: fromState, to: toState },
        };
      }
    }

    // Validate legal transition states
    const valid = this.isValidTransition(fromState, toState);
    if (!valid) {
      throw {
        statusCode: 409,
        code: 'INVALID_TRANSITION',
        message: `Invalid escrow transition from ${fromState} to ${toState}`,
        details: { from: fromState, to: toState },
      };
    }

    const now = Date.now();
    const ledgerId = `led_${now}_${Math.random().toString(36).substring(2, 7)}`;

    // Update escrow account and write ledger row in same transaction
    this.appDb.db.exec('BEGIN IMMEDIATE;');
    try {
      this.appDb.db
        .prepare('UPDATE escrow_accounts SET state = ? WHERE dispute_id = ?')
        .run(toState, disputeId);

      this.appDb.db
        .prepare(`
          INSERT INTO escrow_ledger (id, dispute_id, type, from_state, to_state, amount_minor, actor_id, reason_code, note, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(ledgerId, disputeId, toState.toLowerCase(), fromState, toState, amountMinor, actorId, reasonCode, note || null, now);

      // Also map order status
      let orderStatus: string | null = null;
      if (toState === 'REFUNDED_FULL') orderStatus = 'refunded';
      else if (toState === 'REFUNDED_PARTIAL') orderStatus = 'partially_refunded';
      else if (toState === 'RELEASED_TO_SELLER') orderStatus = 'completed';

      if (orderStatus) {
        this.appDb.db
          .prepare('UPDATE orders SET status = ? WHERE id = (SELECT order_id FROM disputes WHERE id = ?)')
          .run(orderStatus, disputeId);
      }

      this.appDb.db.exec('COMMIT;');
    } catch (err) {
      this.appDb.db.exec('ROLLBACK;');
      throw err;
    }

    return {
      state: toState,
      amountMinor: account.amountMinor,
      currency: account.currency,
      ledgerId,
    };
  }

  private isValidTransition(from: EscrowState, to: EscrowState): boolean {
    if (from === 'HELD') {
      return ['FROZEN', 'REFUNDED_FULL', 'REFUNDED_PARTIAL', 'RELEASED_TO_SELLER'].includes(to);
    }
    if (from === 'FROZEN') {
      return ['HELD', 'REFUNDED_FULL', 'REFUNDED_PARTIAL', 'RELEASED_TO_SELLER'].includes(to);
    }
    // Terminal states cannot transition further
    return false;
  }
}
