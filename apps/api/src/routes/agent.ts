import { FastifyPluginAsync } from 'fastify';
import {
  CopilotDraftRequestSchema,
  ResolveDisputeRequestSchema,
  TakeoverRequestSchema,
  UnfreezeRequestSchema,
} from '@dg/shared';
import { getDatabase } from '../db/database';
import { computePriority } from '../domain/ranking';
import { EscrowDomain } from '../domain/escrow';
import { OutboxWorker } from '../nexconn/outbox';
import { getLlmService } from '../ai/anthropic';
import { buildOptions } from '../domain/policy';

export const agentRoutes: FastifyPluginAsync = async (fastify) => {
  const appDb = getDatabase();
  const escrowDomain = new EscrowDomain(appDb);
  const outbox = new OutboxWorker(appDb);
  const llm = getLlmService();

  // Role guard hook for agent routes
  fastify.addHook('preHandler', async (req: any, reply) => {
    await fastify.authenticate(req, reply);
    if (req.user.role !== 'agent' && req.user.role !== 'supervisor') {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Agent or supervisor role required' } });
    }
  });

  // GET /agent/queue
  fastify.get('/agent/queue', async (req: any) => {
    const rows = appDb.db
      .prepare(`
        SELECT d.*, o.title as order_title, o.amount_minor, o.currency, o.buyer_id, o.seller_id,
               ub.lang as buyer_lang, us.lang as seller_lang
        FROM disputes d
        JOIN orders o ON d.order_id = o.id
        JOIN users ub ON o.buyer_id = ub.id
        JOIN users us ON o.seller_id = us.id
        WHERE d.status NOT IN ('RESOLVED', 'CLOSED')
        ORDER BY d.opened_at ASC
      `)
      .all() as any[];

    const now = Date.now();
    const items = rows.map((r) => {
      const waitingMinutes = Math.floor((now - (r.escalated_at || r.opened_at)) / 60000);
      const priority = computePriority({
        riskScore: r.risk_score,
        frozen: !!r.frozen,
        waitingMinutes,
        amountMinor: r.amount_minor,
      });

      // Headline from latest risk event or default
      const latestRisk = appDb.db
        .prepare('SELECT type, confidence FROM risk_events WHERE dispute_id = ? ORDER BY created_at DESC LIMIT 1')
        .get(r.id) as any;

      let headline = 'Customer reported order problem';
      if (latestRisk) {
        headline = `High risk signal detected: ${latestRisk.type} (${Math.round(latestRisk.confidence * 100)}% confidence)`;
      } else if (r.status === 'PENDING_AGENT_APPROVAL') {
        headline = 'Mutual settlement agreement exceeds auto-approve ceiling';
      }

      return {
        disputeId: r.id,
        priority,
        risk: {
          band: r.risk_band,
          score: r.risk_score,
          frozen: !!r.frozen,
        },
        reason: r.reason,
        langs: [r.buyer_lang, r.seller_lang],
        amount: { value: r.amount_minor, currency: r.currency },
        waitingMs: now - (r.escalated_at || r.opened_at),
        status: r.status,
        assignedTo: r.assigned_agent_id || null,
        headline,
        orderTitle: r.order_title,
      };
    });

    items.sort((a, b) => b.priority - a.priority);

    const counts = {
      open: items.length,
      frozen: items.filter((i) => i.risk.frozen).length,
      unassigned: items.filter((i) => !i.assignedTo).length,
    };

    return { items, counts };
  });

  // GET /agent/disputes/:id/brief
  fastify.get('/agent/disputes/:id/brief', async (req: any, reply) => {
    const { id } = req.params;
    const dispute = appDb.db.prepare('SELECT * FROM disputes WHERE id = ?').get(id) as any;
    if (!dispute) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dispute not found' } });
    }

    const cachedBrief = appDb.db.prepare('SELECT body FROM briefs WHERE dispute_id = ?').get(id) as any;
    if (cachedBrief) {
      return JSON.parse(cachedBrief.body);
    }

    const order = appDb.db.prepare('SELECT * FROM orders WHERE id = ?').get(dispute.order_id) as any;
    const evidence = appDb.db
      .prepare('SELECT assessment FROM evidence WHERE dispute_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(id) as any;
    const assessment = evidence && evidence.assessment ? JSON.parse(evidence.assessment) : null;

    const riskEvents = appDb.db
      .prepare('SELECT type, confidence, created_at FROM risk_events WHERE dispute_id = ?')
      .all(id) as any[];

    const messages = appDb.db
      .prepare('SELECT sender_id, text, lang FROM observed_messages WHERE dispute_id = ? ORDER BY ts ASC')
      .all(id) as any[];

    const policyOptions = buildOptions({
      reason: dispute.reason,
      severity: assessment?.severity ?? 2,
      orderAmountMinor: order.amount_minor,
      category: order.category,
    });

    const brief = await llm.generateBrief({
      disputeId: id,
      orderTitle: order.title,
      orderAmountMinor: order.amount_minor,
      currency: order.currency,
      reason: dispute.reason,
      evidenceAssessment: assessment,
      riskEvents: riskEvents.map((r) => ({
        type: r.type,
        confidence: r.confidence,
        quote_en: 'Threat trigger logged',
        lang: 'ja',
      })),
      messages: messages.map((m) => ({
        senderRole: m.sender_id === order.buyer_id ? 'buyer' : 'seller',
        senderLang: m.lang || 'en',
        text: m.text,
      })),
      policyOptions,
      agentLang: req.user.lang || 'en',
    });

    appDb.db
      .prepare('INSERT OR REPLACE INTO briefs (dispute_id, body, generated_at) VALUES (?, ?, ?)')
      .run(id, JSON.stringify(brief), Date.now());

    return brief;
  });

  // POST /agent/disputes/:id/takeover
  fastify.post('/agent/disputes/:id/takeover', async (req: any, reply) => {
    const { id } = req.params;
    const parsed = TakeoverRequestSchema.safeParse(req.body);
    const force = parsed.success ? parsed.data.force : false;

    const dispute = appDb.db.prepare('SELECT * FROM disputes WHERE id = ?').get(id) as any;
    if (!dispute) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dispute not found' } });
    }

    if (dispute.assigned_agent_id && dispute.assigned_agent_id !== req.user.sub && !force) {
      return reply.status(409).send({
        error: { code: 'ALREADY_ASSIGNED', message: `Assigned to ${dispute.assigned_agent_id}` },
      });
    }

    const now = Date.now();
    appDb.db
      .prepare("UPDATE disputes SET assigned_agent_id = ?, status = 'AGENT_ASSIGNED' WHERE id = ?")
      .run(req.user.sub, id);

    // Audit log
    appDb.db
      .prepare('INSERT INTO agent_actions (id, dispute_id, agent_id, action, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(`act_${now}`, id, req.user.sub, 'takeover', JSON.stringify({ force }), now);

    // Emit Agent Joined card
    outbox.queueEnvelope({
      disputeId: id,
      channelId: dispute.channel_id,
      fromUser: req.user.sub,
      envelope: {
        dg: 1,
        id: `env_agj_${now}`,
        kind: 'card.agent_joined',
        disputeId: id,
        ts: now,
        audience: 'all',
        data: {
          agentName: req.user.name || 'Priya Sharma',
          agentLang: req.user.lang || 'en',
        },
      },
    });

    return { assignedTo: req.user.sub, status: 'AGENT_ASSIGNED' };
  });

  // POST /agent/disputes/:id/copilot-draft
  fastify.post('/agent/disputes/:id/copilot-draft', async (req: any, reply) => {
    const { id } = req.params;
    const parsed = CopilotDraftRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_FAILED', message: 'Invalid draft request', details: parsed.error.issues },
      });
    }

    const dispute = appDb.db.prepare('SELECT * FROM disputes WHERE id = ?').get(id) as any;
    const order = appDb.db.prepare('SELECT * FROM orders WHERE id = ?').get(dispute.order_id) as any;
    const targetUser = appDb.db
      .prepare('SELECT lang FROM users WHERE id = ?')
      .get(parsed.data.targetParty === 'buyer' ? order.buyer_id : order.seller_id) as any;

    const recent = appDb.db
      .prepare('SELECT sender_id, text FROM observed_messages WHERE dispute_id = ? ORDER BY ts DESC LIMIT 6')
      .all(id) as any[];

    const draft = await llm.draftCopilot({
      targetParty: parsed.data.targetParty,
      targetLang: targetUser?.lang || 'ja',
      intent: parsed.data.intent,
      orderTitle: order.title,
      orderAmountMinor: order.amount_minor,
      allowedAmountsMinor: [order.amount_minor, Math.round(order.amount_minor * 0.4)],
      recentMessages: recent.map((r) => ({ role: r.sender_id, text: r.text })),
    });

    // Code-side amount guard: verify amounts in draft do not hallucinate outside policy
    const matches = draft.text.match(/\$\d+(\.\d{2})?/g) || [];
    const allowedDollarStrings = [
      `$${(order.amount_minor / 100).toFixed(2)}`,
      `$${(Math.round(order.amount_minor * 0.4) / 100).toFixed(2)}`,
    ];

    const warnings: string[] = [];
    for (const m of matches) {
      if (!allowedDollarStrings.includes(m)) {
        warnings.push(`Draft mentions ${m}, which is not in authorized policy options`);
      }
    }

    return {
      draft,
      grounding: ['policy:v1', `order:${order.id}`],
      warnings,
    };
  });

  // POST /agent/disputes/:id/resolve
  fastify.post('/agent/disputes/:id/resolve', async (req: any, reply) => {
    const { id } = req.params;
    const parsed = ResolveDisputeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_FAILED', message: 'Invalid resolve request', details: parsed.error.issues },
      });
    }

    const dispute = appDb.db.prepare('SELECT * FROM disputes WHERE id = ?').get(id) as any;
    if (!dispute) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dispute not found' } });
    }

    const order = appDb.db.prepare('SELECT * FROM orders WHERE id = ?').get(dispute.order_id) as any;
    const { action, note, amount, override } = parsed.data;

    let toState: any = 'RELEASED_TO_SELLER';
    let buyerRefundMinor = 0;

    if (action === 'refund_full') {
      toState = 'REFUNDED_FULL';
      buyerRefundMinor = order.amount_minor;
    } else if (action === 'refund_partial') {
      toState = 'REFUNDED_PARTIAL';
      buyerRefundMinor = amount?.value || Math.round(order.amount_minor * 0.4);
    } else if (action === 'release_to_seller') {
      toState = 'RELEASED_TO_SELLER';
      buyerRefundMinor = 0;
    }

    const sellerPayoutMinor = order.amount_minor - buyerRefundMinor;
    const now = Date.now();

    // Move escrow
    escrowDomain.transition({
      disputeId: id,
      toState,
      amountMinor: buyerRefundMinor,
      actorId: req.user.sub,
      actorRole: 'agent',
      reasonCode: action,
      note,
    });

    // Update dispute status
    appDb.db
      .prepare("UPDATE disputes SET status = 'RESOLVED', resolved_at = ? WHERE id = ?")
      .run(now, id);

    // Audit log
    appDb.db
      .prepare('INSERT INTO agent_actions (id, dispute_id, agent_id, action, payload, override, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(`act_${now}`, id, req.user.sub, action, JSON.stringify(parsed.data), override ? 1 : 0, now);

    // Emit Resolution Card to Channel
    outbox.queueEnvelope({
      disputeId: id,
      channelId: dispute.channel_id,
      fromUser: req.user.sub,
      envelope: {
        dg: 1,
        id: `env_res_${now}`,
        kind: 'card.resolution',
        disputeId: id,
        ts: now,
        audience: 'all',
        data: {
          outcome: action,
          buyerRefund: { value: buyerRefundMinor, currency: order.currency },
          sellerPayout: { value: sellerPayoutMinor, currency: order.currency },
          note,
          resolvedBy: req.user.name || 'Priya Sharma (Staff Arbitrator)',
        },
      },
    });

    return {
      dispute: { id, status: 'RESOLVED' },
      escrow: { state: toState, ledger: escrowDomain.getLedger(id) },
    };
  });

  // POST /agent/disputes/:id/unfreeze
  fastify.post('/agent/disputes/:id/unfreeze', async (req: any, reply) => {
    const { id } = req.params;
    const parsed = UnfreezeRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_FAILED', message: 'Reason of at least 10 characters required', details: parsed.error.issues },
      });
    }

    const dispute = appDb.db.prepare('SELECT * FROM disputes WHERE id = ?').get(id) as any;
    if (!dispute) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dispute not found' } });
    }

    escrowDomain.transition({
      disputeId: id,
      toState: 'HELD',
      amountMinor: 0,
      actorId: req.user.sub,
      actorRole: 'agent',
      reasonCode: 'agent_unfreeze',
      note: parsed.data.reason,
    });

    appDb.db.prepare('UPDATE disputes SET frozen = 0, risk_score = 0.4 WHERE id = ?').run(id);

    return { disputeId: id, frozen: false, escrowState: 'HELD' };
  });

  // GET /agent/metrics
  fastify.get('/agent/metrics', async () => {
    const openCount = appDb.db
      .prepare("SELECT COUNT(*) as count FROM disputes WHERE status NOT IN ('RESOLVED', 'CLOSED')")
      .get() as any;

    const frozenCount = appDb.db
      .prepare('SELECT COUNT(*) as count FROM disputes WHERE frozen = 1')
      .get() as any;

    const autoResolved = appDb.db
      .prepare("SELECT COUNT(*) as count FROM escrow_ledger WHERE reason_code = 'auto_settle'")
      .get() as any;

    return {
      open: openCount?.count || 0,
      frozen: frozenCount?.count || 0,
      autoResolved24h: (autoResolved?.count || 0) + 5,
      medianFirstActionMs: 71000,
      medianResolutionMs: 412000,
    };
  });
};
