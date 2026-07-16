import { prisma } from '../db.js';
import { requireAuth } from '../auth/middleware.js';

// Solo para vos: ver los últimos requests/errores sin tener que entrar a Postgres
// directamente. Protegido igual que el resto de la API (requiere sesión).
export default async function logRoutes(app) {
  app.addHook('preHandler', requireAuth);

  app.get('/logs/requests', async (request) => {
    const limit = Math.min(Number(request.query.limit) || 50, 200);
    return prisma.requestLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
  });

  app.get('/logs/errors', async (request) => {
    const limit = Math.min(Number(request.query.limit) || 50, 200);
    return prisma.errorLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
  });
}
