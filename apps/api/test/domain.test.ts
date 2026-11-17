import { describe, it, expect, beforeEach } from 'vitest';
import { buildOptions, validCounter, POLICY_V1 } from '../src/domain/policy';
import { calculateDisputeScore, threatWeight, lexiconPreCheck } from '../src/domain/risk';
import { computePriority } from '../src/domain/ranking';
import { parseDgEnvelope, serializeDgEnvelope } from '@dg/shared';
import { AppDatabase } from '../src/db/database';
import { EscrowDomain } from '../src/domain/escrow';

describe('Policy Engine', () => {
  it('generates 40% partial refund and replacement for severity 2 damaged cup ($84.00)', () => {
    const options = buildOptions({
      reason: 'damaged',
      severity: 2,
      orderAmountMinor: 8400,
    });

    expect(options).toHaveLength(2);
    const partial = options.find((o) => o.id === 'opt_keep_partial');
    const replace = options.find((o) => o.id === 'opt_replace');

    expect(partial).toBeDefined();
    expect(partial?.refundMinor).toBe(3360); // 40% of 8400 = 3360 ($33.60)
    expect(partial?.returnRequired).toBe(false);

    expect(replace).toBeDefined();
    expect(replace?.refundMinor).toBe(0);
    expect(replace?.replacement).toBe(true);
  });

  it('hides opt_full_keep when order amount exceeds maxOrderMinor ($30.00)', () => {
    const options = buildOptions({
      reason: 'damaged',
      severity: 3,
      orderAmountMinor: 8400, // $84.00 > $30.00 limit
    });

    const fullKeep = options.find((o) => o.id === 'opt_full_keep');
    expect(fullKeep).toBeUndefined();

    const fullReturn = options.find((o) => o.id === 'opt_full_return');
    expect(fullReturn).toBeDefined();
  });

  it('escalates on severity 0 damaged item (returns empty options list)', () => {
    const options = buildOptions({
      reason: 'damaged',
      severity: 0,
      orderAmountMinor: 8400,
    });
    expect(options).toHaveLength(0);
  });

  it('validCounter accepts 50% to 150% of option amount, rejects outside', () => {
    const optionRefund = 3360; // $33.60
    const orderTotal = 8400; // $84.00

    // 50% of 3360 = 1680; 150% = 5040
    expect(validCounter(optionRefund, 1680, orderTotal)).toBe(true);
    expect(validCounter(optionRefund, 3360, orderTotal)).toBe(true);
    expect(validCounter(optionRefund, 5040, orderTotal)).toBe(true);

    // Below 50%
    expect(validCounter(optionRefund, 1000, orderTotal)).toBe(false);
    // Above 150%
    expect(validCounter(optionRefund, 6000, orderTotal)).toBe(false);
  });
});

describe('Escalation Firewall Risk Algorithm', () => {
  it('freezes on un-negated chargeback threat with confidence >= 0.6', () => {
    const result = calculateDisputeScore({
      lang: 'ja',
      frustration: 0.8,
      surface_tone: 'angry',
      politeness_masking: false,
      threat: {
        type: 'chargeback',
        confidence: 0.82,
        negated: false,
        quoted: false,
      },
      scam_signals: [],
      quote_en: 'chargeback threat',
    });

    expect(result.frozen).toBe(true);
    expect(result.band).toBe('high');
    expect(result.triggers).toContain('threat_chargeback');
  });

  it('does NOT freeze when threat is negated (Scenario C)', () => {
    const result = calculateDisputeScore({
      lang: 'en',
      frustration: 0.35,
      surface_tone: 'neutral',
      politeness_masking: false,
      threat: {
        type: 'police',
        confidence: 0.75,
        negated: true, // "I will not call the police"
        quoted: false,
      },
      scam_signals: [],
      quote_en: 'will not call police',
    });

    expect(result.frozen).toBe(false);
    expect(result.band).not.toBe('high');
    expect(result.triggers).toHaveLength(0);
  });

  it('freezes when two consecutive messages from same sender have frustration >= 0.65', () => {
    const result = calculateDisputeScore(
      {
        lang: 'ja',
        frustration: 0.7,
        surface_tone: 'polite',
        politeness_masking: true,
        threat: { type: 'none', confidence: 0, negated: false, quoted: false },
        scam_signals: [],
        quote_en: 'third request',
      },
      0.5,
      0.68 // prior frustration was 0.68 >= 0.65
    );

    expect(result.frozen).toBe(true);
    expect(result.triggers).toContain('sustained_high_frustration');
  });

  it('decays risk score when a calm message arrives', () => {
    const result = calculateDisputeScore(
      {
        lang: 'en',
        frustration: 0.05,
        surface_tone: 'neutral',
        politeness_masking: false,
        threat: { type: 'none', confidence: 0, negated: false, quoted: false },
        scam_signals: [],
        quote_en: '',
      },
      0.5
    );

    // Initial 0.6 * 0.05 * 0.9 + 0.4 * 0.5 = 0.227, decayed by * 0.85 < 0.22
    expect(result.score).toBeLessThan(0.25);
  });

  it('detects multilingual threat keywords in lexicon pre-check', () => {
    expect(lexiconPreCheck('チャージバックを申請します')?.type).toBe('chargeback');
    expect(lexiconPreCheck('voy a llamar a mi abogado')?.type).toBe('legal');
    expect(lexiconPreCheck('I will report to police')?.type).toBe('police');
    expect(lexiconPreCheck('es una estafa total')?.type).toBe('scam_accusation');
  });
});

describe('Escrow State Machine and Ledger Guards', () => {
  let appDb: AppDatabase;
  let escrow: EscrowDomain;

  beforeEach(() => {
    appDb = new AppDatabase(':memory:');
    escrow = new EscrowDomain(appDb);

    // Seed required users and dispute
    appDb.db.exec(`
      INSERT INTO users (id, name, role, lang) VALUES ('u_b', 'Buyer', 'buyer', 'en');
      INSERT INTO users (id, name, role, lang) VALUES ('u_s', 'Seller', 'seller', 'en');
      INSERT INTO orders (id, title, amount_minor, currency, status, buyer_id, seller_id)
      VALUES ('ord_1', 'Test item', 8400, 'USD', 'delivered', 'u_b', 'u_s');
      INSERT INTO disputes (id, order_id, channel_id, reason, status, policy_version, opened_at)
      VALUES ('dsp_1', 'ord_1', 'dsp_1', 'damaged', 'OPEN', 'v1', 1000);
      INSERT INTO escrow_accounts (dispute_id, state, amount_minor, currency)
      VALUES ('dsp_1', 'HELD', 8400, 'USD');
    `);
  });

  it('allows system/agent to freeze escrow from HELD to FROZEN and writes ledger', () => {
    escrow.transition({
      disputeId: 'dsp_1',
      toState: 'FROZEN',
      amountMinor: 0,
      actorId: 'system',
      actorRole: 'system',
      reasonCode: 'risk_freeze',
    });

    const account = escrow.getAccount('dsp_1');
    expect(account?.state).toBe('FROZEN');

    const ledger = escrow.getLedger('dsp_1');
    expect(ledger).toHaveLength(1);
    expect(ledger[0].from_state).toBe('HELD');
    expect(ledger[0].to_state).toBe('FROZEN');
    expect(ledger[0].reason_code).toBe('risk_freeze');
  });

  it('rejects moving funds out of FROZEN for non-agent role (409)', () => {
    // First freeze
    escrow.transition({
      disputeId: 'dsp_1',
      toState: 'FROZEN',
      amountMinor: 0,
      actorId: 'system',
      actorRole: 'system',
      reasonCode: 'risk_freeze',
    });

    // Attempt refund by buyer
    expect(() => {
      escrow.transition({
        disputeId: 'dsp_1',
        toState: 'REFUNDED_FULL',
        amountMinor: 8400,
        actorId: 'u_b',
        actorRole: 'buyer',
        reasonCode: 'buyer_claim',
      });
    }).toThrow();
  });
});

describe('Envelope Serialization & Parsing', () => {
  it('parses native JSON envelope and DG1: prefixed fallback envelope identically', () => {
    const rawEnv = {
      dg: 1,
      id: 'env_123',
      kind: 'card.welcome',
      disputeId: 'dsp_1',
      ts: 123456789,
      audience: 'all',
      data: { orderTitle: 'Ceramic set' },
    };

    const nativeParsed = parseDgEnvelope(rawEnv);
    expect(nativeParsed?.id).toBe('env_123');
    expect(nativeParsed?.kind).toBe('card.welcome');

    const fallbackString = serializeDgEnvelope(nativeParsed as any, 'fallback');
    expect(fallbackString.startsWith('DG1:')).toBe(true);

    const fallbackParsed = parseDgEnvelope(fallbackString);
    expect(fallbackParsed?.id).toBe('env_123');
    expect(fallbackParsed?.kind).toBe('card.welcome');
  });
});

describe('Queue Ranking Formula', () => {
  it('ranks frozen high-risk case above older medium case', () => {
    const highRiskFrozen = computePriority({
      riskScore: 0.86,
      frozen: true,
      waitingMinutes: 5,
      amountMinor: 8400,
    });

    const mediumOlder = computePriority({
      riskScore: 0.4,
      frozen: false,
      waitingMinutes: 60,
      amountMinor: 5000,
    });

    expect(highRiskFrozen).toBeGreaterThan(mediumOlder);
  });
});
