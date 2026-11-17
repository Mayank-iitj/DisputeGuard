import { FastifyPluginAsync } from 'fastify';
import { getDatabase } from '../db/database';
import { seedDatabase } from '../db/seed';

export const demoRoutes: FastifyPluginAsync = async (fastify) => {
  const appDb = getDatabase();

  // POST /demo/reset
  fastify.post('/demo/reset', async () => {
    appDb.clearAll();
    seedDatabase(appDb);
    return { ok: true, message: 'DisputeGuard reset to initial clean seed state.' };
  });

  // POST /demo/seed
  fastify.post('/demo/seed', async () => {
    seedDatabase(appDb);
    return { ok: true, message: 'Database seeded.' };
  });

  // POST /demo/scenario/:name/advance
  fastify.post('/demo/scenario/:name/advance', async (req: any) => {
    const { name } = req.params;
    const { step = 1 } = (req.body as any) || {};

    return {
      scenario: name,
      step,
      advanced: true,
      hint: `Scenario ${name} step ${step} executed`,
    };
  });
};
