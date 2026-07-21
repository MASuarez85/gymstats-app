import { prisma } from '../db.js';
import { requireAuth } from '../auth/middleware.js';
import { analyzeVisionPhoto, answerConsult, analyzeRoutinePhoto } from '../lib/anthropic.js';
import { withCache } from '../lib/cache.js';
import { sha256 } from '../lib/hash.js';
import { logError } from '../lib/log.js';

const DAY = 60 * 60 * 24;
const PHOTO_TTL = 30 * DAY; // el ejercicio que hace una máquina no cambia de un día a otro
const CONSULT_TTL = DAY; // preguntas de texto: se repiten seguido y la respuesta no envejece tan rápido
const CORRECTIONS_LIMIT = 8; // cuántas correcciones recientes del usuario se le pasan al modelo

async function getRecentCorrections(userId) {
  return prisma.visionCorrection.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: CORRECTIONS_LIMIT,
  });
}

export default async function aiRoutes(app) {
  app.addHook('preHandler', requireAuth);

  // La key es el hash de la foto: si dos usuarios (o el mismo, dos veces) sacan foto
  // a la misma máquina, la segunda vez no llama a Anthropic. Si el usuario tiene
  // correcciones propias cargadas, el cache pasa a ser por usuario+foto (no global),
  // porque la respuesta que le sirve a él ya no es necesariamente la genérica.
  app.post('/ai/vision', async (request, reply) => {
    const { image } = request.body || {};
    if (!image) return reply.code(400).send({ error: 'Falta la imagen' });
    try {
      const corrections = await getRecentCorrections(request.userId);
      const key = corrections.length ? `vision:${request.userId}:${sha256(image)}` : `vision:${sha256(image)}`;
      const { value, cached } = await withCache(key, PHOTO_TTL, () => analyzeVisionPhoto(image, corrections));
      return reply.send({ ...value, _cached: cached });
    } catch (err) {
      logError({ requestId: String(request.id), source: 'anthropic', message: err.message, stack: err.stack, context: { route: '/ai/vision' }, userId: request.userId });
      return reply.code(err.status || 500).send({ error: err.message });
    }
  });

  // Guarda una corrección en texto libre sobre lo último que detectó la IA en una
  // foto ("esto es prensa de pierna, no press de banca"). Se usa como contexto en
  // el próximo /ai/vision de este mismo usuario (ver getRecentCorrections arriba).
  app.post('/ai/vision/corrections', async (request, reply) => {
    const { originalExercise, originalMuscleGroup, correction } = request.body || {};
    if (!originalExercise || !originalMuscleGroup || !correction) {
      return reply.code(400).send({ error: 'Faltan campos: originalExercise, originalMuscleGroup, correction' });
    }
    const saved = await prisma.visionCorrection.create({
      data: { userId: request.userId, originalExercise, originalMuscleGroup, correction },
    });
    return reply.code(201).send({ id: saved.id });
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
      logError({ requestId: String(request.id), source: 'anthropic', message: err.message, stack: err.stack, context: { route: '/ai/consult' }, userId: request.userId });
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
      logError({ requestId: String(request.id), source: 'anthropic', message: err.message, stack: err.stack, context: { route: '/ai/routine' }, userId: request.userId });
      return reply.code(err.status || 500).send({ error: err.message });
    }
  });
}
