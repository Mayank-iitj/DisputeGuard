import * as dotenv from 'dotenv';
import * as path from 'node:path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { WebSocketServer } from 'ws';
import { getDatabase } from './db/database';
import { seedDatabase } from './db/seed';
import { getFallbackServer } from './nexconn/fallback';
import { OutboxWorker } from './nexconn/outbox';

import { authRoutes } from './routes/auth';
import { orderRoutes } from './routes/orders';
import { disputeRoutes } from './routes/disputes';
import { translateRoutes } from './routes/translate';
import { evidenceRoutes } from './routes/evidence';
import { proposalRoutes } from './routes/proposals';
import { agentRoutes } from './routes/agent';
import { demoRoutes } from './routes/demo';
import { healthRoutes } from './routes/health';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
  }
}

export async function buildApp() {
  const app = Fastify({
    logger: false,
  });

  // CORS
  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Multipart uploads
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  // JWT
  const jwtSecret = process.env.JWT_SECRET || 'disputeguard-secret-2026';
  await app.register(jwt, { secret: jwtSecret });

  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: { code: 'UNAUTHENTICATED', message: 'Missing or invalid token' } });
    }
  });

  // Initialize DB & Seed if empty
  const appDb = getDatabase();
  const userCount = appDb.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedDatabase(appDb);
  }

  // Start Outbox Worker
  const outbox = new OutboxWorker(appDb);
  outbox.start(500);

  // Register Routes under /api/v1
  await app.register(authRoutes, { prefix: '/api/v1' });
  await app.register(orderRoutes, { prefix: '/api/v1' });
  await app.register(disputeRoutes, { prefix: '/api/v1' });
  await app.register(translateRoutes, { prefix: '/api/v1' });
  await app.register(evidenceRoutes, { prefix: '/api/v1' });
  await app.register(proposalRoutes, { prefix: '/api/v1' });
  await app.register(agentRoutes, { prefix: '/api/v1' });
  await app.register(demoRoutes, { prefix: '/api/v1' });
  await app.register(healthRoutes, { prefix: '/api/v1' });

  // Direct health route
  app.get('/health', async () => ({ status: 'ok', time: Date.now() }));

  return { app, outbox };
}

async function start() {
  const port = Number(process.env.PORT || 8787);
  const { app } = await buildApp();

  const server = await app.listen({ port, host: '0.0.0.0' });
  console.log(`DisputeGuard API listening on http://localhost:${port}`);

  // Attach WebSocket server for real-time fallback bus
  const wss = new WebSocketServer({ server: app.server, path: '/ws' });
  const fallback = getFallbackServer();
  fallback.setWebSocketServer(wss);
  console.log(`DisputeGuard Realtime WebSocket listening on ws://localhost:${port}/ws`);
}

if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  start().catch((err) => {
    console.error('Error starting DisputeGuard API:', err);
    process.exit(1);
  });
}
