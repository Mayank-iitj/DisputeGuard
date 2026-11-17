import { FastifyPluginAsync } from 'fastify';
import { DemoSessionRequestSchema, User } from '@dg/shared';
import { getDatabase } from '../db/database';
import { getServerChatPort } from '../nexconn/sdk';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const appDb = getDatabase();

  // POST /auth/demo-session
  fastify.post('/auth/demo-session', async (req, reply) => {
    const parsed = DemoSessionRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_FAILED', message: 'Invalid persona request', details: parsed.error.issues },
      });
    }

    const { persona } = parsed.data;
    let userId = persona;
    if (!userId.startsWith('u_')) {
      userId = `u_${persona}`;
    }

    const user = appDb.db
      .prepare('SELECT id, name, role, lang, avatar FROM users WHERE id = ?')
      .get(userId) as User | undefined;

    if (!user) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: `Persona ${persona} not found` },
      });
    }

    // Register user with Nexconn
    const chatPort = getServerChatPort();
    const nexconnRes = await chatPort.registerUser(user.id, user.name, user.avatar || undefined);

    // Sign JWT
    const token = fastify.jwt.sign({
      sub: user.id,
      role: user.role,
      name: user.name,
      lang: user.lang,
    });

    return {
      jwt: token,
      user,
      nexconn: {
        appKey: process.env.NEXCONN_APP_KEY || 'demo_app_key',
        userId: user.id,
        token: nexconnRes.token,
      },
    };
  });

  // GET /me
  fastify.get('/me', { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
    const userId = req.user.sub;
    const user = appDb.db
      .prepare('SELECT id, name, role, lang, avatar FROM users WHERE id = ?')
      .get(userId) as User | undefined;

    if (!user) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    const countRow = appDb.db
      .prepare(`
        SELECT COUNT(*) as count 
        FROM disputes d
        JOIN orders o ON d.order_id = o.id
        WHERE (o.buyer_id = ? OR o.seller_id = ? OR d.assigned_agent_id = ?)
          AND d.status NOT IN ('RESOLVED', 'CLOSED')
      `)
      .get(userId, userId, userId) as { count: number };

    return {
      user,
      openDisputes: countRow?.count || 0,
    };
  });
};
