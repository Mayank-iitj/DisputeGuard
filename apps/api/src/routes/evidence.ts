import { FastifyPluginAsync } from 'fastify';
import { getDatabase } from '../db/database';
import { getLlmService } from '../ai/anthropic';
import { OutboxWorker } from '../nexconn/outbox';
import { buildOptions } from '../domain/policy';

export const evidenceRoutes: FastifyPluginAsync = async (fastify) => {
  const appDb = getDatabase();
  const llm = getLlmService();
  const outbox = new OutboxWorker(appDb);

  // POST /disputes/:id/evidence
  fastify.post('/disputes/:id/evidence', { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
    const { id } = req.params;
    const userId = req.user.sub;

    const dispute = appDb.db.prepare('SELECT * FROM disputes WHERE id = ?').get(id) as any;
    if (!dispute) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dispute not found' } });
    }

    const order = appDb.db.prepare('SELECT * FROM orders WHERE id = ?').get(dispute.order_id) as any;

    const now = Date.now();
    const evidenceId = `evd_${now}_${Math.random().toString(36).substring(2, 6)}`;

    // Read files from body or multipart
    let files: Array<{ url: string; w?: number; h?: number }> = [];
    if (req.body && Array.isArray(req.body.files)) {
      files = req.body.files;
    } else {
      // Default fixture photos if none attached
      files = [
        { url: '/img/fixture_cup_crack_1.jpg', w: 1280, h: 960 },
        { url: '/img/fixture_cup_crack_2.jpg', w: 1280, h: 960 },
      ];
    }

    // Run AI vision assessment
    const assessment = await llm.assessEvidence({
      images: files,
      orderTitle: order.title,
      category: order.category,
      claimedReason: dispute.reason,
    });

    const integrity = {
      reusedImage: false,
      exifMismatch: false,
      matchedDisputeIds: [],
    };

    appDb.db.exec('BEGIN IMMEDIATE;');
    try {
      appDb.db.prepare(`
        INSERT INTO evidence (id, dispute_id, uploader_id, status, files, assessment, integrity, created_at)
        VALUES (?, ?, ?, 'done', ?, ?, ?, ?)
      `).run(
        evidenceId,
        id,
        userId,
        JSON.stringify(files),
        JSON.stringify(assessment),
        JSON.stringify(integrity),
        now
      );

      // Generate policy options based on assessment
      const options = buildOptions({
        reason: dispute.reason,
        severity: assessment.severity,
        orderAmountMinor: order.amount_minor,
        category: order.category,
      });

      const proposalId = `prp_${now}`;
      const expiresAt = now + 48 * 3600 * 1000;

      appDb.db.prepare(`
        INSERT INTO proposals (id, dispute_id, round, options, status, policy_version, created_at)
        VALUES (?, ?, 1, ?, 'open', 'v1', ?)
      `).run(proposalId, id, JSON.stringify(options), now);

      appDb.db.prepare(`
        UPDATE disputes 
        SET status = 'PROPOSAL_MADE', negotiation_round = 1 
        WHERE id = ?
      `).run(id);

      appDb.db.exec('COMMIT;');

      // Outbox: Result card
      outbox.queueEnvelope({
        disputeId: id,
        channelId: dispute.channel_id,
        fromUser: 'u_dg_arbitrator',
        envelope: {
          dg: 1,
          id: `env_evres_${now}`,
          kind: 'card.evidence_result',
          disputeId: id,
          ts: now,
          audience: 'all',
          data: {
            evidenceId,
            thumbs: files.map((f) => f.url),
            assessment: {
              damagePresent: assessment.damage_present,
              type: assessment.damage_type,
              severity: assessment.severity,
              location: assessment.damage_location,
              quality: assessment.image_quality_issues,
              confidence: assessment.confidence,
              notesEn: assessment.notes_en,
            },
            label: 'ai_assessed_unverified',
          },
        },
      });

      // Outbox: Proposal card
      outbox.queueEnvelope({
        disputeId: id,
        channelId: dispute.channel_id,
        fromUser: 'u_dg_arbitrator',
        envelope: {
          dg: 1,
          id: `env_prp_${now}`,
          kind: 'card.proposal',
          disputeId: id,
          ts: now + 10,
          audience: 'all',
          data: {
            proposalId,
            round: 1,
            options: options.map((o) => ({
              id: o.id,
              title: o.title,
              summary: o.summary,
              buyerGets: { value: o.buyerGetsMinor, currency: order.currency },
              sellerGets: { value: o.sellerGetsMinor, currency: order.currency },
              returnRequired: o.returnRequired,
              replacement: o.replacement,
              rationale: o.rationale,
            })),
            policyVersion: 'v1',
            expiresAt,
          },
        },
      });
    } catch (e) {
      appDb.db.exec('ROLLBACK;');
      throw e;
    }

    return reply.status(202).send({
      evidenceId,
      status: 'analyzing',
    });
  });

  // GET /evidence/:id
  fastify.get('/evidence/:id', { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
    const { id } = req.params;
    const isAgent = req.user.role === 'agent' || req.user.role === 'supervisor';

    const row = appDb.db.prepare('SELECT * FROM evidence WHERE id = ?').get(id) as any;
    if (!row) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Evidence not found' } });
    }

    const files = JSON.parse(row.files);
    const assessment = row.assessment ? JSON.parse(row.assessment) : null;
    const integrity = row.integrity ? JSON.parse(row.integrity) : null;

    return {
      id: row.id,
      status: row.status,
      files,
      assessment,
      integrity: isAgent ? integrity : undefined,
    };
  });
};
