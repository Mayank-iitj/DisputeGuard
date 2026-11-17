export interface PolicyOptionDefinition {
  id: string;
  title: string;
  refundPct: number;
  returnRequired?: boolean;
  replacement?: boolean;
  maxOrderMinor?: number;
}

export interface GeneratedOption {
  id: string;
  title: string;
  summary: string;
  refundMinor: number;
  buyerGetsMinor: number;
  sellerGetsMinor: number;
  returnRequired: boolean;
  replacement?: boolean;
  rationale: string;
}

export interface PolicyContext {
  reason: string;
  severity?: number;
  orderAmountMinor: number;
  category?: string;
}

export const POLICY_V1 = {
  version: 'v1',
  autoApproveCeilingMinor: 5000,
  counterBounds: {
    minPctOfOption: 50,
    maxPctOfOption: 150,
    hardMaxPctOfOrder: 100,
  },
  maxRounds: 2,
  reasons: {
    damaged: {
      severity: {
        0: { options: [] as PolicyOptionDefinition[], escalate: true },
        1: {
          options: [
            { id: 'opt_keep_small', title: 'Keep item, small refund', refundPct: 15, returnRequired: false },
          ],
        },
        2: {
          options: [
            { id: 'opt_keep_partial', title: 'Keep item, partial refund', refundPct: 40, returnRequired: false },
            { id: 'opt_replace', title: 'Replacement sent', refundPct: 0, returnRequired: false, replacement: true },
          ],
        },
        3: {
          options: [
            { id: 'opt_full_return', title: 'Full refund on return', refundPct: 100, returnRequired: true },
            { id: 'opt_full_keep', title: 'Full refund, keep item', refundPct: 100, returnRequired: false, maxOrderMinor: 3000 },
          ],
        },
      },
    },
    wrong_item_or_size: {
      default: {
        options: [
          { id: 'opt_exchange', title: 'Exchange, seller pays shipping', refundPct: 0, returnRequired: true, replacement: true },
          { id: 'opt_refund_return', title: 'Full refund on return', refundPct: 100, returnRequired: true },
          { id: 'opt_keep_discount', title: 'Keep item, 20% refund', refundPct: 20, returnRequired: false },
        ],
      },
    },
    not_received: {
      default: {
        options: [
          { id: 'opt_reship', title: 'Seller reships', refundPct: 0, replacement: true },
          { id: 'opt_refund_full', title: 'Full refund', refundPct: 100 },
        ],
      },
    },
    not_as_described: {
      default: {
        options: [
          { id: 'opt_partial_20', title: 'Keep item, 20% refund', refundPct: 20 },
          { id: 'opt_refund_return', title: 'Full refund on return', refundPct: 100, returnRequired: true },
        ],
      },
    },
  },
};

export function buildOptions(ctx: PolicyContext): GeneratedOption[] {
  let cfg: { options: PolicyOptionDefinition[]; escalate?: boolean } | null = null;

  if (ctx.reason === 'damaged') {
    const sev = (ctx.severity ?? 2) as 0 | 1 | 2 | 3;
    cfg = POLICY_V1.reasons.damaged.severity[sev] ?? POLICY_V1.reasons.damaged.severity[2];
  } else if (ctx.reason === 'wrong_item_or_size') {
    cfg = POLICY_V1.reasons.wrong_item_or_size.default;
  } else if (ctx.reason === 'not_received') {
    cfg = POLICY_V1.reasons.not_received.default;
  } else if (ctx.reason === 'not_as_described') {
    cfg = POLICY_V1.reasons.not_as_described.default;
  }

  if (!cfg || cfg.escalate) {
    return [];
  }

  return cfg.options
    .filter((o) => !o.maxOrderMinor || ctx.orderAmountMinor <= o.maxOrderMinor)
    .map((o) => {
      const refundMinor = Math.round((ctx.orderAmountMinor * o.refundPct) / 100);
      const buyerGetsMinor = refundMinor;
      const sellerGetsMinor = ctx.orderAmountMinor - refundMinor;

      let rationale = '';
      if (ctx.reason === 'damaged') {
        rationale = `Policy v1: severity ${ctx.severity ?? 2} of 3 suggests ${o.refundPct}% refund${o.returnRequired ? ' on return' : ' with item kept'}.`;
      } else {
        rationale = `Policy v1 standard for ${ctx.reason}: ${o.title}.`;
      }

      return {
        id: o.id,
        title: o.title,
        summary: o.replacement
          ? 'Replacement item sent to buyer'
          : o.returnRequired
          ? `Full refund of $${(refundMinor / 100).toFixed(2)} once item is returned`
          : `Partial refund of $${(refundMinor / 100).toFixed(2)} and keep item`,
        refundMinor,
        buyerGetsMinor,
        sellerGetsMinor,
        returnRequired: !!o.returnRequired,
        replacement: !!o.replacement,
        rationale,
      };
    });
}

export function validCounter(optionRefundMinor: number, counterMinor: number, orderAmountMinor: number): boolean {
  if (optionRefundMinor === 0) {
    return counterMinor >= 0 && counterMinor <= orderAmountMinor;
  }
  const lo = (optionRefundMinor * POLICY_V1.counterBounds.minPctOfOption) / 100;
  const hi = Math.min(
    (optionRefundMinor * POLICY_V1.counterBounds.maxPctOfOption) / 100,
    orderAmountMinor
  );
  return counterMinor >= lo && counterMinor <= hi;
}
