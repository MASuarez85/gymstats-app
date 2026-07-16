import { prisma } from '../db.js';
import { verifyAppleToken } from '../auth/appleAuth.js';
import { signSession } from '../auth/jwt.js';

export default async function authRoutes(app) {
  // La app iOS manda el identityToken que le dio Sign in with Apple.
  // Creamos el usuario si es la primera vez, o lo buscamos si ya existe.
  app.post('/auth/apple', async (request, reply) => {
    const { identityToken } = request.body || {};
    if (!identityToken) {
      return reply.code(400).send({ error: 'Falta identityToken' });
    }

    let appleUserId, email;
    try {
      ({ appleUserId, email } = await verifyAppleToken(identityToken));
    } catch (err) {
      return reply.code(401).send({ error: 'Token de Apple inválido: ' + err.message });
    }

    const user = await prisma.user.upsert({
      where: { appleUserId },
      update: email ? { email } : {},
      create: { appleUserId, email },
    });

    const token = signSession(user.id);
    return reply.send({ token, userId: user.id });
  });
}
