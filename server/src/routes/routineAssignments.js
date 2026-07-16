import { prisma } from '../db.js';
import { requireAuth } from '../auth/middleware.js';

export default async function routineAssignmentRoutes(app) {
  app.addHook('preHandler', requireAuth);

  // Mapa { 'YYYY-MM-DD': routineId }
  app.get('/routine-assignments', async (request) => {
    const rows = await prisma.routineAssignment.findMany({ where: { userId: request.userId } });
    const map = {};
    for (const r of rows) map[r.date.toISOString().slice(0, 10)] = r.routineId;
    return map;
  });

  // Body: { routineId } — null/vacío borra la asignación de ese día.
  app.put('/routine-assignments/:date', async (request, reply) => {
    const { date } = request.params;
    const { routineId } = request.body || {};

    if (!routineId) {
      await prisma.routineAssignment.deleteMany({ where: { userId: request.userId, date: new Date(date) } });
      return reply.send({ date, routineId: null });
    }

    const routine = await prisma.routine.findUnique({ where: { id: routineId } });
    if (!routine || routine.userId !== request.userId) {
      return reply.code(404).send({ error: 'Rutina no encontrada' });
    }

    await prisma.routineAssignment.upsert({
      where: { userId_date: { userId: request.userId, date: new Date(date) } },
      update: { routineId },
      create: { userId: request.userId, date: new Date(date), routineId },
    });
    return reply.send({ date, routineId });
  });
}
