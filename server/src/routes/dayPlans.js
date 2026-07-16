import { prisma } from '../db.js';
import { requireAuth } from '../auth/middleware.js';

export default async function dayPlanRoutes(app) {
  app.addHook('preHandler', requireAuth);

  // Devuelve el mapa { 'YYYY-MM-DD': 'Pecho' } tal como lo espera el frontend actual.
  app.get('/day-plans', async (request) => {
    const plans = await prisma.dayPlan.findMany({ where: { userId: request.userId } });
    const map = {};
    for (const p of plans) map[p.date.toISOString().slice(0, 10)] = p.muscleGroup;
    return map;
  });

  // Body: { muscleGroup } — si viene vacío/null, borra el plan de ese día.
  app.put('/day-plans/:date', async (request, reply) => {
    const { date } = request.params;
    const { muscleGroup } = request.body || {};

    if (!muscleGroup) {
      await prisma.dayPlan.deleteMany({ where: { userId: request.userId, date: new Date(date) } });
      return reply.send({ date, muscleGroup: null });
    }

    await prisma.dayPlan.upsert({
      where: { userId_date: { userId: request.userId, date: new Date(date) } },
      update: { muscleGroup },
      create: { userId: request.userId, date: new Date(date), muscleGroup },
    });
    return reply.send({ date, muscleGroup });
  });
}
