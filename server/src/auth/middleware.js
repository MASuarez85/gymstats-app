import { verifySession } from './jwt.js';

// Fastify preHandler: exige "Authorization: Bearer <token>" y cuelga request.userId.
export async function requireAuth(request, reply) {
  const header = request.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return reply.code(401).send({ error: 'Falta autenticación' });
  }
  try {
    request.userId = verifySession(token);
  } catch (err) {
    return reply.code(401).send({ error: 'Sesión inválida o expirada' });
  }
}
