import { prisma } from '../db.js';
import { signSession } from '../auth/jwt.js';

// Solo para probar el CRUD sin depender de un identity token real de Apple.
// Se registra en index.js únicamente si ALLOW_DEV_AUTH=true — nunca la actives en producción.
export default async function devAuthRoutes(app) {
  app.post('/auth/dev', async (request, reply) => {
    const { email } = request.body || {};
    const user = await prisma.user.upsert({
      where: { appleUserId: 'dev-user' },
      update: {},
      create: { appleUserId: 'dev-user', email: email || 'dev@localhost' },
    });
    const token = signSession(user.id);
    return reply.send({ token, userId: user.id });
  });
}
