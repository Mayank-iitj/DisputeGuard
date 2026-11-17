import { FastifyPluginAsync } from 'fastify';
import { getDatabase } from '../db/database';
import { Order } from '@dg/shared';

export const orderRoutes: FastifyPluginAsync = async (fastify) => {
  const appDb = getDatabase();

  // GET /orders
  fastify.get('/orders', { preHandler: [fastify.authenticate] }, async (req: any) => {
    const userId = req.user.sub;
    const role = req.user.role;

    let rows: any[] = [];
    if (role === 'buyer') {
      rows = appDb.db
        .prepare(`
          SELECT o.*, d.id as dispute_id
          FROM orders o
          LEFT JOIN disputes d ON o.id = d.order_id
          WHERE o.buyer_id = ?
          ORDER BY o.delivered_at DESC
        `)
        .all(userId);
    } else if (role === 'seller') {
      rows = appDb.db
        .prepare(`
          SELECT o.*, d.id as dispute_id
          FROM orders o
          LEFT JOIN disputes d ON o.id = d.order_id
          WHERE o.seller_id = ?
          ORDER BY o.delivered_at DESC
        `)
        .all(userId);
    } else {
      // Agents / supervisors see all orders
      rows = appDb.db
        .prepare(`
          SELECT o.*, d.id as dispute_id
          FROM orders o
          LEFT JOIN disputes d ON o.id = d.order_id
          ORDER BY o.delivered_at DESC
        `)
        .all();
    }

    const items: Order[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      image: r.image,
      amount: { value: r.amount_minor, currency: r.currency },
      status: r.status,
      deliveredAt: r.delivered_at,
      buyerId: r.buyer_id,
      sellerId: r.seller_id,
      disputeId: r.dispute_id || null,
      category: r.category || 'general',
    }));

    return { items, nextCursor: null };
  });

  // GET /orders/:orderId
  fastify.get('/orders/:orderId', { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
    const { orderId } = req.params;
    const row = appDb.db
      .prepare(`
        SELECT o.*, d.id as dispute_id, d.status as dispute_status
        FROM orders o
        LEFT JOIN disputes d ON o.id = d.order_id
        WHERE o.id = ?
      `)
      .get(orderId) as any;

    if (!row) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Order not found' } });
    }

    let escrowSummary = null;
    if (row.dispute_id) {
      const esc = appDb.db
        .prepare('SELECT state, amount_minor, currency FROM escrow_accounts WHERE dispute_id = ?')
        .get(row.dispute_id) as any;
      if (esc) {
        escrowSummary = {
          state: esc.state,
          amount: { value: esc.amount_minor, currency: esc.currency },
        };
      }
    }

    return {
      order: {
        id: row.id,
        title: row.title,
        image: row.image,
        amount: { value: row.amount_minor, currency: row.currency },
        status: row.status,
        deliveredAt: row.delivered_at,
        buyerId: row.buyer_id,
        sellerId: row.seller_id,
        disputeId: row.dispute_id || null,
        category: row.category,
      },
      escrow: escrowSummary,
      dispute: row.dispute_id ? { id: row.dispute_id, status: row.dispute_status } : null,
    };
  });
};
