import { prisma } from '../db.js';
import { requireAuth } from '../auth/middleware.js';
import { withCache, invalidate } from '../lib/cache.js';

const LIST_TTL = 60; // corto a propósito: se invalida al escribir, esto es solo por si dos requests casi simultáneas piden la lista

function entriesKey(userId) {
  return `entries:${userId}`;
}

export default async function entryRoutes(app) {
  app.addHook('preHandler', requireAuth);

  // Devuelve todos los entrenamientos del usuario, con sus series, más nuevos primero.
  app.get('/entries', async (request) => {
    const { value } = await withCache(entriesKey(request.userId), LIST_TTL, async () => {
      const entries = await prisma.entry.findMany({
        where: { userId: request.userId },
        include: { sets: { orderBy: { order: 'asc' } } },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      });
      return entries.map(serializeEntry);
    });
    return value;
  });

  // Crea un entrenamiento con sus series en una sola transacción.
  app.post('/entries', async (request, reply) => {
    const { exercise, muscleGroup, date, sets } = request.body || {};
    if (!exercise || !muscleGroup || !date || !Array.isArray(sets) || sets.length === 0) {
      return reply.code(400).send({ error: 'Faltan campos: exercise, muscleGroup, date, sets[]' });
    }

    const entry = await prisma.entry.create({
      data: {
        userId: request.userId,
        exercise,
        muscleGroup,
        date: new Date(date),
        sets: {
          create: sets.map((s, i) => ({
            weight: Number(s.weight),
            reps: Number(s.reps),
            order: i,
          })),
        },
      },
      include: { sets: { orderBy: { order: 'asc' } } },
    });

    await invalidate(entriesKey(request.userId));
    return reply.code(201).send(serializeEntry(entry));
  });

  app.delete('/entries/:id', async (request, reply) => {
    const { id } = request.params;
    const entry = await prisma.entry.findUnique({ where: { id } });
    if (!entry || entry.userId !== request.userId) {
      return reply.code(404).send({ error: 'No encontrado' });
    }
    await prisma.entry.delete({ where: { id } });
    await invalidate(entriesKey(request.userId));
    return reply.code(204).send();
  });
}

function serializeEntry(entry) {
  return {
    id: entry.id,
    exercise: entry.exercise,
    muscle_group: entry.muscleGroup,
    date: entry.date.toISOString().slice(0, 10),
    sets: entry.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
    createdAt: entry.createdAt.getTime(),
  };
}
