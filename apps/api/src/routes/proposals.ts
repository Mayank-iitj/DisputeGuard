import { FastifyPluginAsync } from 'fastify';
import { ProposalRespondRequestSchema } from '@dg/shared';
import { getDatabase } from '../db/database';
import { OutboxWorker } from '../nexconn/outbox';
import { EscrowDomain } from '../domain/escrow';
import { validCounter } from '../domain/policy';

export const proposalRoutes: FastifyPluginAsync = async (fastify) => {
  const appDb = getDatabase();
  const outbox = new OutboxWorker(appDb);
  const escrowDomain = new EscrowDomain(appDb);

  // POST /disputes/:id/proposals/:proposalId/respond
  fastify.post('/disputes/:id/proposals/:proposalId/respond', { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
    const { id, proposalId } = req.params;
    const parsed = ProposalRespondRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_FAILED', message: 'Invalid proposal response', details: parsed.error.issues },
      });
    }

    const dispute = appDb.db.prepare('SELECT * FROM disputes WHERE id = ?').get(id) as any;
    if (!dispute) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dispute not found' } });
    }

    const proposal = appDb.db.prepare('SELECT * FROM proposals WHERE id = ?').get(proposalId) as any;
    if (!proposal) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Proposal not found' } });
    }

    if (dispute.status === 'RESOLVED' || dispute.status === 'CLOSED') {
      // If the proposal is already settled or dispute resolved, return idempotent 200 OK
      if (proposal.status === 'settled' || parsed.data.response === 'accept') {
        return reply.status(200).send({
          proposal: {
            id: proposalId,
            round: proposal.round,
            status: proposal.status || 'settled',
            buyer: proposal.buyer_response ? JSON.parse(proposal.buyer_response) : { response: 'accept' },
            seller: proposal.seller_response ? JSON.parse(proposal.seller_response) : { response: 'accept' },
          },
          dispute: { status: dispute.status },
          message: 'Proposal was already accepted and dispute is resolved.',
        });
      }
      return reply.status(409).send({
        error: { code: 'ALREADY_RESOLVED', message: 'Cannot respond to proposal on a resolved dispute' },
      });
    }

    const order = appDb.db.prepare('SELECT * FROM orders WHERE id = ?').get(dispute.order_id) as any;

    const userId = req.user.sub;
    const isBuyer = userId === order.buyer_id;
    const isSeller = userId === order.seller_id;

    if (!isBuyer && !isSeller) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Only buyer or seller can respond' } });
    }

    const { response, optionId, counterAmount } = parsed.data;
    const options = JSON.parse(proposal.options);
    const chosenOption = options.find((o: any) => o.id === optionId) || options[0];

    // Counter validation
    if (response === 'counter' && counterAmount) {
      const isValid = validCounter(chosenOption.refundMinor, counterAmount.value, order.amount_minor);
      if (!isValid) {
        return reply.status(422).send({
          error: {
            code: 'POLICY_REJECTED',
            message: 'Counter amount lies outside policy bounds (50% to 150% of option refund)',
          },
        });
      }
    }

    const buyerResp = proposal.buyer_response ? JSON.parse(proposal.buyer_response) : null;
    const sellerResp = proposal.seller_response ? JSON.parse(proposal.seller_response) : null;

    const myResp = { response, optionId: chosenOption.id, counterMinor: counterAmount?.value };
    const newBuyerResp = isBuyer ? myResp : buyerResp;
    const newSellerResp = isSeller ? myResp : sellerResp;

    const now = Date.now();
    appDb.db.prepare(`
      UPDATE proposals 
      SET buyer_response = ?, seller_response = ?
      WHERE id = ?
    `).run(
      newBuyerResp ? JSON.stringify(newBuyerResp) : null,
      newSellerResp ? JSON.stringify(newSellerResp) : null,
      proposalId
    );

    // Emit proposal status chip card
    outbox.queueEnvelope({
      disputeId: id,
      channelId: dispute.channel_id,
      fromUser: 'u_dg_arbitrator',
      envelope: {
        dg: 1,
        id: `env_prpstat_${now}`,
        kind: 'card.proposal_status',
        disputeId: id,
        ts: now,
        audience: 'all',
        data: {
          proposalId,
          buyer: newBuyerResp ? newBuyerResp.response : 'pending',
          seller: newSellerResp ? newSellerResp.response : 'pending',
        },
      },
    });

    // Check resolution conditions
    const buyerAccepted = newBuyerResp?.response === 'accept';
    const sellerAccepted = newSellerResp?.response === 'accept';
    const anyDeclined = newBuyerResp?.response === 'decline' || newSellerResp?.response === 'decline';

    if (anyDeclined) {
      // Escalate immediately
      appDb.db.prepare(`UPDATE disputes SET status = 'ESCALATED', escalated_at = ? WHERE id = ?`).run(now, id);
      appDb.db.prepare(`UPDATE proposals SET status = 'declined' WHERE id = ?`).run(proposalId);
    } else if (buyerAccepted && sellerAccepted && newBuyerResp.optionId === newSellerResp.optionId) {
      // Both accepted same option!
      const ceilingMinor = Number(process.env.AUTO_APPROVE_CEILING_MINOR || 5000);
      const refundMinor = chosenOption.refundMinor;

      if (refundMinor <= ceilingMinor) {
        // Auto-settle!
        const toState = refundMinor === order.amount_minor ? 'REFUNDED_FULL' : 'REFUNDED_PARTIAL';

        escrowDomain.transition({
          disputeId: id,
          toState,
          amountMinor: refundMinor,
          actorId: 'system',
          actorRole: 'bot',
          reasonCode: 'auto_settle',
          note: `Auto-settled option ${chosenOption.id} ($${(refundMinor / 100).toFixed(2)})`,
        });

        appDb.db.prepare(`UPDATE disputes SET status = 'RESOLVED', resolved_at = ? WHERE id = ?`).run(now, id);
        appDb.db.prepare(`UPDATE proposals SET status = 'settled' WHERE id = ?`).run(proposalId);

        // Emit resolution card
        outbox.queueEnvelope({
          disputeId: id,
          channelId: dispute.channel_id,
          fromUser: 'u_dg_arbitrator',
          envelope: {
            dg: 1,
            id: `env_res_${now}`,
            kind: 'card.resolution',
            disputeId: id,
            ts: now + 5,
            audience: 'all',
            data: {
              outcome: toState === 'REFUNDED_FULL' ? 'full_refund' : 'partial_refund',
              buyerRefund: { value: refundMinor, currency: order.currency },
              sellerPayout: { value: order.amount_minor - refundMinor, currency: order.currency },
              note: 'Dispute resolved automatically by mutual agreement under policy ceiling.',
              resolvedBy: 'DisputeGuard Policy Engine',
            },
          },
        });
      } else {
        // Above auto-approve ceiling: requires human agent sign-off!
        appDb.db.prepare(`UPDATE disputes SET status = 'PENDING_AGENT_APPROVAL' WHERE id = ?`).run(id);
      }
    }

    const updatedDispute = appDb.db.prepare('SELECT status FROM disputes WHERE id = ?').get(id) as any;

    return {
      proposal: {
        id: proposalId,
        round: proposal.round,
        buyer: newBuyerResp ? newBuyerResp.response : 'pending',
        seller: newSellerResp ? newSellerResp.response : 'pending',
      },
      dispute: {
        status: updatedDispute.status,
      },
    };
  });
};
