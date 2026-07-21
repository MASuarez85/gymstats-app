import { prisma } from '../db.js';
import { requireAuth } from '../auth/middleware.js';

export default async function dayPlanRoutes(app) {
  app.addHook('preHandler', requireAuth);

  // Devuelve el mapa { 'YYYY-MM-DD': ['Pecho', 'Espalda'] }. Antes era un solo
  // string por día; ahora un día puede tener varios grupos musculares planificados.
  app.get('/day-plans', async (request) => {
    const plans = await prisma.dayPlan.findMany({ where: { userId: request.userId } });
    const map = {};
    for (const p of plans) {
      const key = p.date.toISOString().slice(0, 10);
      (map[key] = map[key] || []).push(p.muscleGroup);
    }
    return map;
  });

  // Reemplaza TODOS los grupos planificados de un día de una sola vez.
  // Body: { muscleGroups: [...] } (vacío/ausente = borrar el plan del día).
  app.put('/day-plans/:date', async (request, reply) => {
    const { date } = request.params;
    const { muscleGroups } = request.body || {};
    const groups = Array.isArray(muscleGroups) ? muscleGroups.filter(Boolean) : [];

    await prisma.$transaction([
      prisma.dayPlan.deleteMany({ where: { userId: request.userId, date: new Date(date) } }),
      ...(groups.length
        ? [
            prisma.dayPlan.createMany({
              data: groups.map((muscleGroup) => ({ userId: request.userId, date: new Date(date), muscleGroup })),
            }),
          ]
        : []),
    ]);
    return reply.send({ date, muscleGroups: groups });
  });

  // Agrega un grupo muscular al día sin tocar los que ya estaban planificados.
  // Body: { muscleGroup }
  app.post('/day-plans/:date/groups', async (request, reply) => {
    const { date } = request.params;
    const { muscleGroup } = request.body || {};
    if (!muscleGroup) return reply.code(400).send({ error: 'Falta muscleGroup' });

    await prisma.dayPlan.upsert({
      where: { userId_date_muscleGroup: { userId: request.userId, date: new Date(date), muscleGroup } },
      update: {},
      create: { userId: request.userId, date: new Date(date), muscleGroup },
    });
    const plans = await prisma.dayPlan.findMany({ where: { userId: request.userId, date: new Date(date) } });
    return reply.send({ date, muscleGroups: plans.map((p) => p.muscleGroup) });
  });

  // Quita un único grupo muscular del día, dejando el resto del plan intacto.
  app.delete('/day-plans/:date/groups/:muscleGroup', async (request, reply) => {
    const { date, muscleGroup } = request.params;
    await prisma.dayPlan.deleteMany({ where: { userId: request.userId, date: new Date(date), muscleGroup } });
    const plans = await prisma.dayPlan.findMany({ where: { userId: request.userId, date: new Date(date) } });
    return reply.send({ date, muscleGroups: plans.map((p) => p.muscleGroup) });
  });
}
