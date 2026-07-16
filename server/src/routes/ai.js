import { requireAuth } from '../auth/middleware.js';
import { analyzeVisionPhoto, answerConsult, analyzeRoutinePhoto } from '../lib/anthropic.js';
import { withCache } from '../lib/cache.js';
import { sha256 } from '../lib/hash.js';

const DAY = 60 * 60 * 24;
const PHOTO_TTL = 30 * DAY; // el ejercicio que hace una máquina no cambia de un día a otro
const CONSULT_TTL = DAY; // preguntas de texto: se repiten seguido y la respuesta no envejece tan rápido

export default async function aiRoutes(app) {
  app.addHook('preHandler', requireAuth);

  // La key es el hash de la foto: si dos usuarios (o el mismo, dos veces) sacan foto
  // a la misma máquina, la segunda vez no llama a Anthropic.
  app.post('/ai/vision', async (request, reply) => {
    const { image } = request.body || {};
    if (!image) return reply.code(400).send({ error: 'Falta la imagen' });
    try {
      const key = `vision:${sha256(image)}`;
      const { value, cached } = await withCache(key, PHOTO_TTL, () => analyzeVisionPhoto(image));
      return reply.send({ ...value, _cached: cached });
    } catch (err) {
      return reply.code(err.status || 500).send({ error: err.message });
    }
  });

  // La key es la pregunta normalizada (minúsculas, espacios colapsados), para que
  // variaciones triviales de la misma pregunta caigan en el mismo cache.
  app.post('/ai/consult', async (request, reply) => {
    const { question } = request.body || {};
    if (!question) return reply.code(400).send({ error: 'Falta la pregunta' });
    try {
      const normalized = question.trim().toLowerCase().replace(/\s+/g, ' ');
      const key = `consult:${sha256(normalized)}`;
      const { value: answer, cached } = await withCache(key, CONSULT_TTL, () => answerConsult(question));
      return reply.send({ answer, _cached: cached });
    } catch (err) {
      return reply.code(err.status || 500).send({ error: err.message });
    }
  });

  app.post('/ai/routine', async (request, reply) => {
    const { image } = request.body || {};
    if (!image) return reply.code(400).send({ error: 'Falta la imagen' });
    try {
      const key = `routine:${sha256(image)}`;
      const { value, cached } = await withCache(key, PHOTO_TTL, () => analyzeRoutinePhoto(image));
      return reply.send({ ...value, _cached: cached });
    } catch (err) {
      return reply.code(err.status || 500).send({ error: err.message });
    }
  });
}
