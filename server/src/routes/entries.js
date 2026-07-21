import { randomUUID } from 'node:crypto';
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

  // Superserie: 2+ ejercicios (mismo grupo muscular, distintas máquinas) cargados
  // juntos, cada uno con sus propias series. Comparten un block_id generado acá
  // para que el frontend los muestre agrupados en Historial/Calendario.
  app.post('/entries/superset', async (request, reply) => {
    const { date, exercises } = request.body || {};
    if (!date || !Array.isArray(exercises) || exercises.length < 2) {
      return reply.code(400).send({ error: 'Faltan campos: date, exercises[] (mínimo 2)' });
    }
    for (const ex of exercises) {
      if (!ex.exercise || !ex.muscleGroup || !Array.isArray(ex.sets) || ex.sets.length === 0) {
        return reply.code(400).send({ error: 'Cada ejercicio necesita exercise, muscleGroup y sets[]' });
      }
    }

    const blockId = randomUUID();
    const created = await prisma.$transaction(
      exercises.map((ex) =>
        prisma.entry.create({
          data: {
            userId: request.userId,
            exercise: ex.exercise,
            muscleGroup: ex.muscleGroup,
            date: new Date(date),
            blockId,
            sets: { create: ex.sets.map((s, i) => ({ weight: Number(s.weight), reps: Number(s.reps), order: i })) },
          },
          include: { sets: { orderBy: { order: 'asc' } } },
        })
      )
    );

    await invalidate(entriesKey(request.userId));
    return reply.code(201).send(created.map(serializeEntry));
  });

  // Edita un entrenamiento existente: reemplaza sus series y/o el ejercicio/grupo
  // muscular. Se manda el array de series completo (no solo la nueva) para que
  // desde el cliente sea fácil tanto agregar una serie como corregir una existente.
  app.patch('/entries/:id', async (request, reply) => {
    const { id } = request.params;
    const { exercise, muscleGroup, sets } = request.body || {};
    const existing = await prisma.entry.findUnique({ where: { id } });
    if (!existing || existing.userId !== request.userId) {
      return reply.code(404).send({ error: 'No encontrado' });
    }
    if (sets !== undefined && (!Array.isArray(sets) || sets.length === 0)) {
      return reply.code(400).send({ error: 'sets[] no puede quedar vacío' });
    }

    const entry = await prisma.$transaction(async (tx) => {
      if (sets !== undefined) {
        await tx.entrySet.deleteMany({ where: { entryId: id } });
      }
      return tx.entry.update({
        where: { id },
        data: {
          ...(exercise !== undefined ? { exercise } : {}),
          ...(muscleGroup !== undefined ? { muscleGroup } : {}),
          ...(sets !== undefined
            ? { sets: { create: sets.map((s, i) => ({ weight: Number(s.weight), reps: Number(s.reps), order: i })) } }
            : {}),
        },
        include: { sets: { orderBy: { order: 'asc' } } },
      });
    });

    await invalidate(entriesKey(request.userId));
    return reply.send(serializeEntry(entry));
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
    block_id: entry.blockId || null,
  };
}
