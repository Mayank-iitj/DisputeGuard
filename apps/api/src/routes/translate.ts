import { FastifyPluginAsync } from 'fastify';
import { TranslateRequestSchema } from '@dg/shared';
import { getDatabase } from '../db/database';
import { getLlmService } from '../ai/anthropic';

export const translateRoutes: FastifyPluginAsync = async (fastify) => {
  const appDb = getDatabase();
  const llm = getLlmService();

  // POST /translate
  fastify.post('/translate', { preHandler: [fastify.authenticate] }, async (req: any, reply) => {
    const parsed = TranslateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_FAILED', message: 'Invalid translate request', details: parsed.error.issues },
      });
    }

    const { disputeId, targetLang, items } = parsed.data;

    const results: any[] = [];
    const checkCache = appDb.db.prepare(
      'SELECT source_lang, text, tone_note FROM translations WHERE message_uid = ? AND target_lang = ?'
    );
    const saveCache = appDb.db.prepare(
      'INSERT OR REPLACE INTO translations (message_uid, target_lang, source_lang, text, tone_note) VALUES (?, ?, ?, ?, ?)'
    );

    for (const item of items) {
      const cached = checkCache.get(item.messageUid, targetLang) as any;
      const isStaleFallback =
        cached &&
        cached.source_lang !== targetLang &&
        (cached.text === item.text ||
          cached.text === 'Customer message regarding order inquiry.' ||
          cached.text === 'Mensaje de soporte recibido sobre la orden.');

      if (cached && !isStaleFallback) {
        results.push({
          messageUid: item.messageUid,
          sourceLang: cached.source_lang,
          translation: cached.text,
          toneNote: cached.tone_note,
          cached: true,
        });
      } else {
        try {
          const res = await llm.translate({ text: item.text, targetLang });
          saveCache.run(item.messageUid, targetLang, res.source_lang, res.translation, res.tone_note);

          results.push({
            messageUid: item.messageUid,
            sourceLang: res.source_lang,
            translation: res.translation,
            toneNote: res.tone_note,
            cached: false,
          });
        } catch (e) {
          // Graceful fallback: return original text without breaking chat
          results.push({
            messageUid: item.messageUid,
            sourceLang: 'unknown',
            translation: item.text,
            toneNote: null,
            cached: false,
          });
        }
      }
    }

    return { items: results };
  });
};
