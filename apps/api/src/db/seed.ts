import { AppDatabase, getDatabase } from './database';
import { getFallbackServer } from '../nexconn/fallback';

export const SEEDED_PERSONAS = [
  { id: 'u_buyer_aiko', name: 'Aiko Tanaka', role: 'buyer', lang: 'ja', avatar: '/av/aiko.png' },
  { id: 'u_seller_marco', name: 'Marco Rossi', role: 'seller', lang: 'es', avatar: '/av/marco.png' },
  { id: 'u_seller_liwei', name: 'Li Wei', role: 'seller', lang: 'zh', avatar: '/av/liwei.png' },
  { id: 'u_buyer_sofia', name: 'Sofia Morales', role: 'buyer', lang: 'es', avatar: '/av/sofia.png' },
  { id: 'u_agent_priya', name: 'Priya Sharma', role: 'agent', lang: 'en', avatar: '/av/priya.png' },
  { id: 'u_supervisor_dan', name: 'Dan Miller', role: 'supervisor', lang: 'en', avatar: '/av/dan.png' },
  { id: 'u_dg_arbitrator', name: 'DisputeGuard Bot', role: 'bot', lang: 'en', avatar: '/av/bot.png' },
];

export function seedDatabase(appDb?: AppDatabase) {
  const dbInstance = appDb || getDatabase();
  const db = dbInstance.db;
  const fallback = getFallbackServer();

  const now = Date.now();
  const oneHourMs = 60 * 60 * 1000;
  const oneDayMs = 24 * 60 * 60 * 1000;

  // 1. Insert Users
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, name, role, lang, avatar)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const p of SEEDED_PERSONAS) {
    insertUser.run(p.id, p.name, p.role, p.lang, p.avatar);
  }

  // 2. Insert Orders
  const insertOrder = db.prepare(`
    INSERT OR REPLACE INTO orders (id, title, image, amount_minor, currency, status, delivered_at, buyer_id, seller_id, category)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertOrder.run(
    'ord_1042',
    'Ceramic pour-over set',
    '/img/ord_1042.jpg',
    8400,
    'USD',
    'disputed',
    now - 3 * oneDayMs,
    'u_buyer_aiko',
    'u_seller_marco',
    'home'
  );

  insertOrder.run(
    'ord_1044',
    'Silk scarf, size M ordered, L sent',
    '/img/ord_1044.jpg',
    5600,
    'USD',
    'disputed',
    now - 1 * oneDayMs,
    'u_buyer_aiko',
    'u_seller_marco',
    'apparel'
  );

  insertOrder.run(
    'ord_1043',
    'Wireless earbuds',
    '/img/ord_1043.jpg',
    12900,
    'USD',
    'delivered',
    now - 2 * oneDayMs,
    'u_buyer_sofia',
    'u_seller_liwei',
    'electronics'
  );

  insertOrder.run(
    'ord_1045',
    'Olive oil gift set, not received',
    '/img/ord_1045.jpg',
    4200,
    'USD',
    'delivered',
    now - 4 * oneDayMs,
    'u_buyer_sofia',
    'u_seller_marco',
    'food'
  );

  // ========================================================
  // 3. Seed Flagship Dispute 1: dsp_1042 (Ceramic Cup - Damage Proof & Bounded Policy)
  // ========================================================
  const dsp1OpenedAt = now - 2 * oneHourMs;
  db.prepare(`
    INSERT OR REPLACE INTO disputes (
      id, order_id, channel_id, reason, status, risk_score, risk_band, frozen,
      negotiation_round, policy_version, opened_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'dsp_1042',
    'ord_1042',
    'dsp_1042',
    'damaged',
    'PROPOSAL_MADE',
    0.15,
    'low',
    0,
    1,
    'v1',
    dsp1OpenedAt
  );

  // Escrow Account & Ledger
  db.prepare(`
    INSERT OR REPLACE INTO escrow_accounts (dispute_id, state, amount_minor, currency)
    VALUES (?, 'HELD', 8400, 'USD')
  `).run('dsp_1042');

  db.prepare(`
    INSERT OR REPLACE INTO escrow_ledger (id, dispute_id, type, from_state, to_state, amount_minor, actor_id, reason_code, note, created_at)
    VALUES (?, ?, 'hold', 'HELD', 'HELD', 8400, 'u_buyer_aiko', 'dispute_opened', 'Escrow held upon dispute open', ?)
  `).run('led_1042_init', 'dsp_1042', dsp1OpenedAt);

  // 3-Angle Evidence Assessment
  const evidenceFiles = [
    { url: '/img/fixture_cup_crack_1.jpg', w: 1280, h: 960 },
    { url: '/img/fixture_cup_crack_2.jpg', w: 1280, h: 960 },
    { url: '/img/fixture_cup_crack_pkg.jpg', w: 1280, h: 960 },
  ];
  const assessment1 = {
    item_visible: true,
    matches_order_description: 'yes',
    damage_present: true,
    damage_type: 'crack',
    damage_location: 'upper ceramic rim',
    severity: 2,
    image_quality_issues: [],
    needs_retake: false,
    confidence: 0.82,
    notes_en: 'Visible 2cm hairline fracture along the upper ceramic rim. Base intact.',
  };
  const integrity1 = { reusedImage: false, exifMismatch: false, matchedDisputeIds: [] };

  db.prepare(`
    INSERT OR REPLACE INTO evidence (id, dispute_id, uploader_id, status, files, assessment, integrity, created_at)
    VALUES (?, ?, ?, 'done', ?, ?, ?, ?)
  `).run(
    'evd_1042',
    'dsp_1042',
    'u_buyer_aiko',
    JSON.stringify(evidenceFiles),
    JSON.stringify(assessment1),
    JSON.stringify(integrity1),
    dsp1OpenedAt + 15 * 60 * 1000
  );

  // Bounded Proposals (Policy Engine v1)
  const proposalOptions = [
    {
      id: 'opt_keep_partial',
      title: 'Keep item, partial refund',
      summary: 'Keep item with 40% partial refund of $33.60 USD',
      refundMinor: 3360,
      buyerGetsMinor: 3360,
      sellerGetsMinor: 5040,
      returnRequired: false,
      replacement: false,
      rationale: 'Policy v1: severity 2 of 3 suggests 40% refund with item kept.',
    },
    {
      id: 'opt_replace',
      title: 'Free replacement unit sent',
      summary: 'Seller dispatches a brand new replacement unit with expedited tracking',
      refundMinor: 0,
      buyerGetsMinor: 0,
      sellerGetsMinor: 8400,
      returnRequired: false,
      replacement: true,
      rationale: 'Seller ships replacement under buyer protection guarantee.',
    },
  ];

  db.prepare(`
    INSERT OR REPLACE INTO proposals (id, dispute_id, round, options, status, policy_version, created_at)
    VALUES (?, ?, 1, ?, 'open', 'v1', ?)
  `).run('prp_1042', 'dsp_1042', JSON.stringify(proposalOptions), dsp1OpenedAt + 20 * 60 * 1000);

  // ========================================================
  // 4. Seed Flagship Dispute 2: dsp_1044 (Silk Scarf - Escalation Firewall Threat Freeze)
  // ========================================================
  const dsp2OpenedAt = now - 45 * 60 * 1000;
  const dsp2EscalatedAt = now - 15 * 60 * 1000;

  db.prepare(`
    INSERT OR REPLACE INTO disputes (
      id, order_id, channel_id, reason, status, risk_score, risk_band, frozen,
      negotiation_round, policy_version, opened_at, escalated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'dsp_1044',
    'ord_1044',
    'dsp_1044',
    'wrong_item_or_size',
    'ESCALATED',
    0.92,
    'high',
    1,
    0,
    'v1',
    dsp2OpenedAt,
    dsp2EscalatedAt
  );

  // Escrow Account (FROZEN) & Ledger
  db.prepare(`
    INSERT OR REPLACE INTO escrow_accounts (dispute_id, state, amount_minor, currency)
    VALUES (?, 'FROZEN', 5600, 'USD')
  `).run('dsp_1044');

  db.prepare(`
    INSERT OR REPLACE INTO escrow_ledger (id, dispute_id, type, from_state, to_state, amount_minor, actor_id, reason_code, note, created_at)
    VALUES (?, ?, 'hold', 'HELD', 'HELD', 5600, 'u_buyer_aiko', 'dispute_opened', 'Escrow held upon dispute open', ?)
  `).run('led_1044_init', 'dsp_1044', dsp2OpenedAt);

  db.prepare(`
    INSERT OR REPLACE INTO escrow_ledger (id, dispute_id, type, from_state, to_state, amount_minor, actor_id, reason_code, note, created_at)
    VALUES (?, ?, 'freeze', 'HELD', 'FROZEN', 5600, 'u_dg_arbitrator', 'threat_chargeback', 'Escalation firewall triggered: chargeback keyword detected in Japanese buyer message', ?)
  `).run('led_1044_freeze', 'dsp_1044', dsp2EscalatedAt);

  // Threat Risk Events
  db.prepare(`
    INSERT OR REPLACE INTO risk_events (id, dispute_id, message_uid, type, confidence, score_after, fired_freeze, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rev_1044_1',
    'dsp_1044',
    'msg_1044_tatemae',
    'politeness_masking',
    0.74,
    0.52,
    0,
    dsp2OpenedAt + 10 * 60 * 1000
  );

  db.prepare(`
    INSERT OR REPLACE INTO risk_events (id, dispute_id, message_uid, type, confidence, score_after, fired_freeze, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rev_1044_2',
    'dsp_1044',
    'msg_1044_chargeback',
    'chargeback',
    0.92,
    0.92,
    1,
    dsp2EscalatedAt
  );

  // ========================================================
  // 5. Pre-seed Fallback Chat Server Channels & Messages
  // ========================================================
  try {
    fallback.clearAll();

    // --- Channel dsp_1042 ---
    fallback.createChannel('dsp_1042', ['u_buyer_aiko', 'u_seller_marco', 'u_dg_arbitrator']);

    // Card 1: Welcome
    fallback.sendEnvelope('dsp_1042', 'u_dg_arbitrator', {
      dg: 1,
      id: 'env_1042_welcome',
      kind: 'card.welcome',
      disputeId: 'dsp_1042',
      ts: dsp1OpenedAt,
      audience: 'all',
      data: {
        orderTitle: 'Ceramic pour-over set',
        orderAmount: { value: 8400, currency: 'USD' },
        reason: 'damaged',
        ruleSummary: 'DisputeGuard Escrow active. AI proposes, code computes. Bounded auto-settle ceiling $50.00.',
      },
    });

    // Message 1: Aiko (ja)
    fallback.broadcastText(
      'dsp_1042',
      'u_buyer_aiko',
      'お世話になっております。梱包を開封したところ、マグカップのふちに目立つ亀裂が入っておりました。大切な贈り物でしたので、大変困惑しております。早急にご確認いただけますと幸いです。'
    );

    // Card 2: Proof Request
    fallback.sendEnvelope('dsp_1042', 'u_dg_arbitrator', {
      dg: 1,
      id: 'env_1042_proofreq',
      kind: 'card.proof_request',
      disputeId: 'dsp_1042',
      ts: dsp1OpenedAt + 2 * 60 * 1000,
      audience: 'buyer',
      data: {
        instructions: 'Please provide clear photos showing product overview, damage detail, and exterior packaging label.',
        requiredAngles: ['overview', 'macro_crack', 'shipping_carton'],
      },
    });

    // Message 2: Marco (es)
    fallback.broadcastText(
      'dsp_1042',
      'u_seller_marco',
      'Hola Aiko, lamento mucho escuchar eso. Todos nuestros productos se inspeccionan con triple capa de plástico de burbujas antes de salir de Valencia. ¿Podría compartir fotos del paquete exterior y de la rotura?'
    );

    // Card 3: Evidence Result Card
    fallback.sendEnvelope('dsp_1042', 'u_dg_arbitrator', {
      dg: 1,
      id: 'env_1042_evres',
      kind: 'card.evidence_result',
      disputeId: 'dsp_1042',
      ts: dsp1OpenedAt + 15 * 60 * 1000,
      audience: 'all',
      data: {
        severity: 2,
        damageType: 'crack',
        damageLocation: 'upper ceramic rim',
        confidence: 0.82,
        recommendedRefundPct: 40,
        notes: 'Visible 2cm hairline fracture along the upper ceramic rim. Functional impact partial.',
        advisoryDisclosure: 'AI-assessed, not verified',
      },
    });

    // Card 4: Bounded Proposal Card
    fallback.sendEnvelope('dsp_1042', 'u_dg_arbitrator', {
      dg: 1,
      id: 'env_1042_proposal',
      kind: 'card.proposal',
      disputeId: 'dsp_1042',
      ts: dsp1OpenedAt + 20 * 60 * 1000,
      audience: 'all',
      data: {
        proposalId: 'prp_1042',
        round: 1,
        policyVersion: 'v1',
        options: proposalOptions.map((o) => ({
          id: o.id,
          title: o.title,
          rationale: o.rationale,
          replacement: o.replacement,
          buyerGets: { value: o.refundMinor, currency: 'USD' },
          sellerGets: { value: o.sellerGetsMinor, currency: 'USD' },
        })),
      },
    });

    // --- Channel dsp_1044 ---
    fallback.createChannel('dsp_1044', ['u_buyer_aiko', 'u_seller_marco', 'u_dg_arbitrator']);

    // Card 1: Welcome
    fallback.sendEnvelope('dsp_1044', 'u_dg_arbitrator', {
      dg: 1,
      id: 'env_1044_welcome',
      kind: 'card.welcome',
      disputeId: 'dsp_1044',
      ts: dsp2OpenedAt,
      audience: 'all',
      data: {
        orderTitle: 'Silk scarf, size M ordered, L sent',
        orderAmount: { value: 5600, currency: 'USD' },
        reason: 'wrong_item_or_size',
        ruleSummary: 'DisputeGuard Escrow active. Cross-cultural sentiment monitoring enabled.',
      },
    });

    // Message 1: Initial inquiry
    fallback.broadcastText(
      'dsp_1044',
      'u_buyer_aiko',
      '注文票ではMサイズ（55cm）を指定しておりましたが、届いた商品はラベルにLサイズ（70cm）と記載されており、色味も異なります。交換をお願いできますでしょうか。'
    );

    // Message 2: Tatemae Politeness Masking
    fallback.broadcastText(
      'dsp_1044',
      'u_buyer_aiko',
      '度々のご連絡となり大変恐縮でございます。すでに3回ほど同様のお問い合わせを差し上げておりますが、いつ頃具体的な対応をいただけますでしょうか。お忙しい中恐れ入りますが、何卒よろしくお願い申し上げます。'
    );

    // Message 3: Chargeback Threat Trigger
    fallback.broadcastText(
      'dsp_1044',
      'u_buyer_aiko',
      '本日中に明確な解決策をご提示いただけない場合、大変不本意ではございますが、クレジットカード会社を通じてチャージバックの手続きを申請いたします。'
    );

    // Card 2: Neutral Bilingual Escalation Alert Notice
    fallback.sendEnvelope('dsp_1044', 'u_dg_arbitrator', {
      dg: 1,
      id: 'env_1044_escalate',
      kind: 'card.escalation_notice',
      disputeId: 'dsp_1044',
      ts: dsp2EscalatedAt,
      audience: 'all',
      data: {
        reason: 'Dispute escalated to Dispatch Console for priority arbitrator review.',
        contactSupport: true,
      },
    });
  } catch (err) {
    console.warn('Fallback server pre-seeding completed with note:', err);
  }
}

// When run directly from CLI
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  console.log('Seeding DisputeGuard database with realistic active disputes and chat channels...');
  seedDatabase();
  console.log('Database seeded successfully.');
}
