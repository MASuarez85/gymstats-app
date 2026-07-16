import { prisma } from '../db.js';
import { requireAuth } from '../auth/middleware.js';

export default async function routineProgressRoutes(app) {
  app.addHook('preHandler', requireAuth);

  // Mapa { 'YYYY-MM-DD': { exerciseId: true } }
  app.get('/routine-progress', async (request) => {
    const rows = await prisma.routineProgress.findMany({ where: { userId: request.userId, done: true } });
    const map = {};
    for (const r of rows) {
      const key = r.date.toISOString().slice(0, 10);
      map[key] = map[key] || {};
      map[key][r.exerciseId] = true;
    }
    return map;
  });

  // Alterna (toggle) si un ejercicio de la rutina de ese día está hecho o no.
  app.put('/routine-progress/:date/:exerciseId', async (request, reply) => {
    const { date, exerciseId } = request.params;
    const existing = await prisma.routineProgress.findUnique({
      where: { userId_date_exerciseId: { userId: request.userId, date: new Date(date), exerciseId } },
    });

    if (existing) {
      await prisma.routineProgress.delete({ where: { id: existing.id } });
      return reply.send({ date, exerciseId, done: false });
    }

    await prisma.routineProgress.create({
      data: { userId: request.userId, date: new Date(date), exerciseId, done: true },
    });
    return reply.send({ date, exerciseId, done: true });
  });
}
