import { FastifyPluginAsync } from 'fastify';
import {
  CreateDisputeRequestSchema,
  DisputeReason,
  DisputeStatus,
  EscrowState,
  ObserveRequestSchema,
  RiskBand,
} from '@dg/shared';
import { getDatabase } from '../db/database';
import { getServerChatPort } from '../nexconn/sdk';
import { OutboxWorker } from '../nexconn/outbox';
import { EscrowDomain } from '../domain/escrow';
import { calculateDisputeScore } from '../domain/risk';
import { getLlmService } from '../ai/anthropic';
import { buildOptions } from '../domain/policy';

import { getFallbackServer } from '../nexconn/fallback';

export const disputeRoutes: FastifyPluginAsync = async (fastify) => {
  const appDb = getDatabase();
  const outbox = new OutboxWorker(appDb);
  const escrowDomain = new EscrowDomain(appDb);
  const llm = getLlmService();
  const chatPort = getServerChatPort();
  const fallback = getFallbackServer();

  // GET /disputes/:id/messages
  fastify.get('/disputes/:id/messages', { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
    const { id } = req.params;
    const dispute = appDb.db.prepare('SELECT channel_id FROM disputes WHERE id = ?').get(id) as any;
    if (!dispute) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dispute not found' } });
    }
    const msgs = fallback.getChannelMessages(dispute.channel_id);
    return { messages: msgs };
  });

  // POST /disputes
  fastify.post('/disputes', { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
    const parsed = CreateDisputeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_FAILED', message: 'Invalid request', details: parsed.error.issues },
      });
    }

    const userId = req.user.sub;
    const { orderId, reason, text } = parsed.data;

    // Check order
    const order = appDb.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
    if (!order) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    // Role check: only buyer or agent/supervisor can open
    if (order.buyer_id !== userId && req.user.role !== 'agent' && req.user.role !== 'supervisor') {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only buyer can open dispute' } });
    }

    // Check existing
    const existing = appDb.db.prepare('SELECT * FROM disputes WHERE order_id = ?').get(orderId) as any;
    if (existing) {
      const esc = escrowDomain.getAccount(existing.id);
      return reply.status(200).send(formatDisputeSummary(existing, order, esc));
    }

    const disputeId = `dsp_${orderId.replace('ord_', '')}`;
    const channelId = disputeId;
    const now = Date.now();
    const needsProof = ['damaged', 'wrong_item_or_size', 'not_as_described'].includes(reason);
    const initialStatus: DisputeStatus = needsProof ? 'EVIDENCE_REQUESTED' : 'OPEN';

    // Buyer, Seller, Bot
    const buyer = appDb.db.prepare('SELECT * FROM users WHERE id = ?').get(order.buyer_id) as any;
    const seller = appDb.db.prepare('SELECT * FROM users WHERE id = ?').get(order.seller_id) as any;

    appDb.db.exec('BEGIN IMMEDIATE;');
    try {
      appDb.db.prepare(`
        INSERT INTO disputes (id, order_id, channel_id, reason, status, risk_score, risk_band, frozen, policy_version, opened_at)
        VALUES (?, ?, ?, ?, ?, 0.08, 'low', 0, 'v1', ?)
      `).run(disputeId, orderId, channelId, reason, initialStatus, now);

      appDb.db.prepare(`
        INSERT INTO escrow_accounts (dispute_id, state, amount_minor, currency)
        VALUES (?, 'HELD', ?, ?)
      `).run(disputeId, order.amount_minor, order.currency);

      const ledgerId = `led_init_${now}`;
      appDb.db.prepare(`
        INSERT INTO escrow_ledger (id, dispute_id, type, from_state, to_state, amount_minor, actor_id, reason_code, note, created_at)
        VALUES (?, ?, 'hold', 'HELD', 'HELD', ?, ?, 'dispute_opened', 'Escrow held upon dispute open', ?)
      `).run(ledgerId, disputeId, order.amount_minor, userId, now);

      appDb.db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('disputed', orderId);

      appDb.db.exec('COMMIT;');
    } catch (err) {
      appDb.db.exec('ROLLBACK;');
      throw err;
    }

    // Channel creation with Nexconn
    await chatPort.createChannel(channelId, [buyer.id, seller.id, 'u_dg_arbitrator']);

    // Emit Welcome Card
    outbox.queueEnvelope({
      disputeId,
      channelId,
      fromUser: 'u_dg_arbitrator',
      envelope: {
        dg: 1,
        id: `env_wel_${now}`,
        kind: 'card.welcome',
        disputeId,
        ts: now,
        audience: 'all',
        data: {
          orderTitle: order.title,
          amount: { value: order.amount_minor, currency: order.currency },
          escrowState: 'HELD',
          languages: [buyer.lang, seller.lang],
        },
      },
    });

    // If proof required, emit Proof Request Card
    if (needsProof) {
      outbox.queueEnvelope({
        disputeId,
        channelId,
        fromUser: 'u_dg_arbitrator',
        envelope: {
          dg: 1,
          id: `env_prf_${now}`,
          kind: 'card.proof_request',
          disputeId,
          ts: now + 10,
          audience: 'all',
          data: {
            reason,
            shotList: ['① Whole item', '② Close-up of damage', '③ Packaging'],
            maxPhotos: 4,
            expiresAt: now + 24 * 3600 * 1000,
          },
        },
      });
    }

    const created = appDb.db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId) as any;
    const esc = escrowDomain.getAccount(disputeId);
    return reply.status(201).send(formatDisputeSummary(created, order, esc, [buyer, seller]));
  });

  // GET /disputes
  fastify.get('/disputes', { preHandler: [fastify.authenticate] }, async (req: any) => {
    const userId = req.user.sub;
    const role = req.user.role;

    let rows: any[] = [];
    if (role === 'buyer') {
      rows = appDb.db.prepare(`
        SELECT d.*, o.title as order_title, o.amount_minor, o.currency, o.buyer_id, o.seller_id
        FROM disputes d JOIN orders o ON d.order_id = o.id
        WHERE o.buyer_id = ?
        ORDER BY d.opened_at DESC
      `).all(userId);
    } else if (role === 'seller') {
      rows = appDb.db.prepare(`
        SELECT d.*, o.title as order_title, o.amount_minor, o.currency, o.buyer_id, o.seller_id
        FROM disputes d JOIN orders o ON d.order_id = o.id
        WHERE o.seller_id = ?
        ORDER BY d.opened_at DESC
      `).all(userId);
    } else {
      rows = appDb.db.prepare(`
        SELECT d.*, o.title as order_title, o.amount_minor, o.currency, o.buyer_id, o.seller_id
        FROM disputes d JOIN orders o ON d.order_id = o.id
        ORDER BY d.opened_at DESC
      `).all();
    }

    return {
      items: rows.map((r) => ({
        id: r.id,
        orderId: r.order_id,
        channelId: r.channel_id,
        status: r.status,
        reason: r.reason,
        orderTitle: r.order_title,
        amount: { value: r.amount_minor, currency: r.currency },
        frozen: !!r.frozen,
        riskBand: r.risk_band,
        createdAt: r.opened_at,
      })),
    };
  });

  // GET /disputes/:id
  fastify.get('/disputes/:id', { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
    const { id } = req.params;
    const dispute = appDb.db.prepare('SELECT * FROM disputes WHERE id = ?').get(id) as any;
    if (!dispute) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dispute not found' } });
    }

    const order = appDb.db.prepare('SELECT * FROM orders WHERE id = ?').get(dispute.order_id) as any;
    const esc = escrowDomain.getAccount(id);
    const buyer = appDb.db.prepare('SELECT * FROM users WHERE id = ?').get(order.buyer_id) as any;
    const seller = appDb.db.prepare('SELECT * FROM users WHERE id = ?').get(order.seller_id) as any;

    const currentProposal = appDb.db
      .prepare('SELECT * FROM proposals WHERE dispute_id = ? ORDER BY round DESC LIMIT 1')
      .get(id) as any;

    const evidence = appDb.db
      .prepare('SELECT * FROM evidence WHERE dispute_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(id) as any;

    const res = formatDisputeSummary(dispute, order, esc, [buyer, seller]);
    return {
      ...res,
      proposal: currentProposal
        ? {
            id: currentProposal.id,
            round: currentProposal.round,
            options: JSON.parse(currentProposal.options),
            buyer: currentProposal.buyer_response ? JSON.parse(currentProposal.buyer_response) : 'pending',
            seller: currentProposal.seller_response ? JSON.parse(currentProposal.seller_response) : 'pending',
            status: currentProposal.status,
          }
        : null,
      evidence: evidence
        ? {
            id: evidence.id,
            status: evidence.status,
            assessment: evidence.assessment ? JSON.parse(evidence.assessment) : null,
          }
        : null,
    };
  });

  // GET /disputes/:id/timeline
  fastify.get('/disputes/:id/timeline', { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
    const { id } = req.params;
    const isAgent = req.user.role === 'agent' || req.user.role === 'supervisor';

    const ledger = appDb.db
      .prepare('SELECT * FROM escrow_ledger WHERE dispute_id = ? ORDER BY created_at ASC')
      .all(id) as any[];

    const riskEvents = appDb.db
      .prepare('SELECT * FROM risk_events WHERE dispute_id = ? ORDER BY created_at ASC')
      .all(id) as any[];

    const agentActions = appDb.db
      .prepare('SELECT * FROM agent_actions WHERE dispute_id = ? ORDER BY created_at ASC')
      .all(id) as any[];

    const timeline: any[] = [];

    for (const l of ledger) {
      timeline.push({
        type: 'escrow',
        id: l.id,
        state: l.to_state,
        actorId: l.actor_id,
        amount: l.amount_minor,
        reasonCode: l.reason_code,
        ts: l.created_at,
      });
    }

    if (isAgent) {
      for (const r of riskEvents) {
        timeline.push({
          type: 'risk_event',
          id: r.id,
          threatType: r.type,
          confidence: r.confidence,
          firedFreeze: !!r.fired_freeze,
          ts: r.created_at,
        });
      }

      for (const a of agentActions) {
        timeline.push({
          type: 'agent_action',
          id: a.id,
          agentId: a.agent_id,
          action: a.action,
          override: !!a.override,
          ts: a.created_at,
        });
      }
    }

    timeline.sort((a, b) => a.ts - b.ts);
    return { timeline };
  });

  // POST /disputes/:id/observe
  fastify.post('/disputes/:id/observe', { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
    const { id } = req.params;
    const parsed = ObserveRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_FAILED', message: 'Invalid observe request', details: parsed.error.issues },
      });
    }

    const { messageUid, text, ts } = parsed.data;
    const dispute = appDb.db.prepare('SELECT * FROM disputes WHERE id = ?').get(id) as any;
    if (!dispute) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dispute not found' } });
    }

    const senderId = req.user.sub;
    const senderRole = req.user.role;

    // Get recent 4 context messages
    const recent = appDb.db
      .prepare('SELECT sender_id, text FROM observed_messages WHERE dispute_id = ? ORDER BY ts DESC LIMIT 4')
      .all(id) as any[];

    const contextMessages = recent.reverse().map((r) => ({
      role: r.sender_id === dispute.assigned_agent_id ? 'agent' : 'party',
      text: r.text,
    }));

    // Prior sender frustration check for rule 4
    const lastSenderMsg = appDb.db
      .prepare('SELECT analysis FROM observed_messages WHERE dispute_id = ? AND sender_id = ? ORDER BY ts DESC LIMIT 1')
      .get(id, senderId) as any;
    let priorFrustration: number | null = null;
    if (lastSenderMsg && lastSenderMsg.analysis) {
      try {
        const a = JSON.parse(lastSenderMsg.analysis);
        priorFrustration = a.frustration;
      } catch {}
    }

    // Run AI risk analysis & calculate score
    const analysis = await llm.analyzeRisk({ text, contextMessages });
    const scoreResult = calculateDisputeScore(analysis, dispute.risk_score, priorFrustration);

    // Save observed message
    appDb.db.prepare(`
      INSERT OR REPLACE INTO observed_messages (uid, dispute_id, sender_id, text, lang, ts, analysis)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(messageUid, id, senderId, text, analysis.lang, ts || Date.now(), JSON.stringify(analysis));

    // Update dispute risk score and band
    appDb.db.prepare(`
      UPDATE disputes SET risk_score = ?, risk_band = ? WHERE id = ?
    `).run(scoreResult.score, scoreResult.band, id);

    // Escalation Firewall Freeze triggered!
    if (scoreResult.frozen && !dispute.frozen) {
      const now = Date.now();
      appDb.db.prepare(`
        UPDATE disputes 
        SET frozen = 1, status = 'ESCALATED', risk_band = 'high', escalated_at = ?
        WHERE id = ?
      `).run(now, id);

      // Transition Escrow to FROZEN
      escrowDomain.transition({
        disputeId: id,
        toState: 'FROZEN',
        amountMinor: 0,
        actorId: 'system',
        actorRole: 'system',
        reasonCode: 'risk_freeze',
        note: `Escalation firewall triggered: ${scoreResult.triggers.join(', ')}`,
      });

      // Record risk event
      const triggerType = analysis.threat.type !== 'none' ? analysis.threat.type : 'frustration';
      appDb.db.prepare(`
        INSERT INTO risk_events (id, dispute_id, message_uid, type, confidence, score_after, fired_freeze, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `).run(`rsk_${now}`, id, messageUid, triggerType, analysis.threat.confidence || 0.8, scoreResult.score, now);

      // Outbox: Bilingual Escalation Notice (NO risk details exposed to users per PRD!)
      outbox.queueEnvelope({
        disputeId: id,
        channelId: dispute.channel_id,
        fromUser: 'u_dg_arbitrator',
        envelope: {
          dg: 1,
          id: `env_esc_${now}`,
          kind: 'card.escalation_notice',
          disputeId: id,
          ts: now,
          audience: 'all',
          data: {
            caseId: id,
            noticeByLang: {
              ja: '安全のため、担当者が確認します。支払いは保護されています。',
              es: 'Por seguridad, un agente revisará este caso. Su pago sigue protegido.',
              en: 'For security, an agent is reviewing this case. Escrow remains protected.',
            },
          },
        },
      });

      // Outbox: Escrow status card
      const esc = escrowDomain.getAccount(id);
      outbox.queueEnvelope({
        disputeId: id,
        channelId: dispute.channel_id,
        fromUser: 'u_dg_arbitrator',
        envelope: {
          dg: 1,
          id: `env_escstat_${now}`,
          kind: 'card.escrow_status',
          disputeId: id,
          ts: now + 5,
          audience: 'all',
          data: {
            state: 'FROZEN',
            amount: { value: esc?.amountMinor || 0, currency: esc?.currency || 'USD' },
            reasonCode: 'risk_freeze',
          },
        },
      });

      // Outbox: Ops Queue Delta event
      outbox.queueEnvelope({
        disputeId: id,
        channelId: 'ops_dispatch',
        fromUser: 'u_dg_arbitrator',
        envelope: {
          dg: 1,
          id: `env_ops_${now}`,
          kind: 'evt.queue_delta',
          disputeId: id,
          ts: now + 10,
          audience: 'agent',
          data: {
            disputeId: id,
            priority: 85,
            risk: { band: 'high', score: scoreResult.score, frozen: true },
            status: 'ESCALATED',
            lang: [analysis.lang],
            change: 'frozen',
          },
        },
      });
    }

    const isAgent = req.user.role === 'agent' || req.user.role === 'supervisor';
    return {
      detectedLang: analysis.lang,
      risk: {
        band: scoreResult.band,
        score: scoreResult.score,
        frozen: scoreResult.frozen || !!dispute.frozen,
        triggers: isAgent ? scoreResult.triggers : [],
      },
    };
  });
};

function formatDisputeSummary(dispute: any, order: any, esc: any, users?: any[]) {
  return {
    id: dispute.id,
    orderId: dispute.order_id,
    channelId: dispute.channel_id,
    status: dispute.status,
    reason: dispute.reason,
    orderTitle: order?.title,
    orderAmount: order ? { value: order.amount_minor, currency: order.currency } : undefined,
    escrow: {
      state: esc?.state || 'HELD',
      amount: { value: esc?.amountMinor || order?.amount_minor || 0, currency: esc?.currency || order?.currency || 'USD' },
    },
    risk: {
      band: dispute.risk_band,
      score: dispute.risk_score,
      frozen: !!dispute.frozen,
    },
    participants: users
      ? [
          { id: users[0].id, role: users[0].role, lang: users[0].lang, name: users[0].name },
          { id: users[1].id, role: users[1].role, lang: users[1].lang, name: users[1].name },
          { id: 'u_dg_arbitrator', role: 'bot', lang: 'en', name: 'DisputeGuard Bot' },
        ]
      : [],
    assignedAgentId: dispute.assigned_agent_id || null,
    createdAt: dispute.opened_at,
  };
}
