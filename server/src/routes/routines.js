import { prisma } from '../db.js';
import { requireAuth } from '../auth/middleware.js';
import { withCache, invalidate } from '../lib/cache.js';

const LIST_TTL = 60;

function routinesKey(userId) {
  return `routines:${userId}`;
}

export default async function routineRoutes(app) {
  app.addHook('preHandler', requireAuth);

  app.get('/routines', async (request) => {
    const { value } = await withCache(routinesKey(request.userId), LIST_TTL, async () => {
      const routines = await prisma.routine.findMany({
        where: { userId: request.userId },
        include: { exercises: { orderBy: { order: 'asc' } } },
      });
      return routines.map(serializeRoutine);
    });
    return value;
  });

  // Body: { name, exercises: [{ name, muscleGroup, targetSets, targetReps }] }
  app.post('/routines', async (request, reply) => {
    const { name, exercises } = request.body || {};
    if (!name || !Array.isArray(exercises) || exercises.length === 0) {
      return reply.code(400).send({ error: 'Faltan campos: name, exercises[]' });
    }
    const routine = await prisma.routine.create({
      data: {
        userId: request.userId,
        name,
        exercises: { create: exercises.map((ex, i) => toExerciseData(ex, i)) },
      },
      include: { exercises: { orderBy: { order: 'asc' } } },
    });
    await invalidate(routinesKey(request.userId));
    return reply.code(201).send(serializeRoutine(routine));
  });

  // Reemplaza nombre y lista completa de ejercicios (igual que el editor del frontend, que
  // siempre manda el array entero en vez de diffs).
  app.put('/routines/:id', async (request, reply) => {
    const { id } = request.params;
    const existing = await prisma.routine.findUnique({ where: { id } });
    if (!existing || existing.userId !== request.userId) {
      return reply.code(404).send({ error: 'No encontrado' });
    }
    const { name, exercises } = request.body || {};
    if (!name || !Array.isArray(exercises) || exercises.length === 0) {
      return reply.code(400).send({ error: 'Faltan campos: name, exercises[]' });
    }

    await prisma.$transaction([
      prisma.routineExercise.deleteMany({ where: { routineId: id } }),
      prisma.routine.update({
        where: { id },
        data: {
          name,
          exercises: { create: exercises.map((ex, i) => toExerciseData(ex, i)) },
        },
      }),
    ]);

    const updated = await prisma.routine.findUnique({
      where: { id },
      include: { exercises: { orderBy: { order: 'asc' } } },
    });
    await invalidate(routinesKey(request.userId));
    return reply.send(serializeRoutine(updated));
  });

  app.delete('/routines/:id', async (request, reply) => {
    const { id } = request.params;
    const existing = await prisma.routine.findUnique({ where: { id } });
    if (!existing || existing.userId !== request.userId) {
      return reply.code(404).send({ error: 'No encontrado' });
    }
    // Las asignaciones de calendario que apuntaban a esta rutina se van en cascada (ver schema).
    await prisma.routine.delete({ where: { id } });
    await invalidate(routinesKey(request.userId));
    return reply.code(204).send();
  });
}

function toExerciseData(ex, order) {
  return {
    name: ex.name,
    muscleGroup: ex.muscle_group || ex.muscleGroup,
    targetSets: Number(ex.targetSets) || 3,
    targetReps: Number(ex.targetReps) || 10,
    order,
  };
}

function serializeRoutine(routine) {
  return {
    id: routine.id,
    name: routine.name,
    exercises: routine.exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      muscle_group: ex.muscleGroup,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
    })),
  };
}
