import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';

import authRoutes from './routes/auth.js';
import devAuthRoutes from './routes/devAuth.js';
import entryRoutes from './routes/entries.js';
import dayPlanRoutes from './routes/dayPlans.js';
import routineRoutes from './routes/routines.js';
import routineAssignmentRoutes from './routes/routineAssignments.js';
import routineProgressRoutes from './routes/routineProgress.js';
import aiRoutes from './routes/ai.js';
import logRoutes from './routes/logs.js';
import { checkRedisHealth } from './lib/cache.js';
import { logRequest, logError } from './lib/log.js';

// bodyLimit por defecto de Fastify es 1MB — una foto de celular en base64 lo
// supera fácil (el propio encoding base64 ya suma ~33% sobre el tamaño real).
const app = Fastify({ logger: true, bodyLimit: 15 * 1024 * 1024 });

await app.register(cors, { origin: true }); // la app nativa no corre en un origen fijo

// Traza cada request al esquema "logging" (tabla request_logs). No se usa para
// nada que afecte la respuesta — si falla, solo se loggea por consola (ver lib/log.js).
app.addHook('onResponse', (request, reply, done) => {
  logRequest({
    requestId: String(request.id),
    method: request.method,
    path: request.url,
    statusCode: reply.statusCode,
    durationMs: reply.elapsedTime,
    userId: request.userId,
  });
  done();
});

// Cualquier error no manejado por una ruta (throws, validaciones de Fastify, etc.)
// se guarda en error_logs antes de responder, para poder auditarlo después.
app.setErrorHandler((error, request, reply) => {
  logError({
    requestId: String(request.id),
    source: 'http',
    message: error.message,
    stack: error.stack,
    context: { method: request.method, path: request.url },
    userId: request.userId,
  });
  const statusCode = error.statusCode || 500;
  reply.code(statusCode).send({ error: error.message });
});

app.get('/health', async () => {
  const redisUp = await checkRedisHealth();
  return { ok: true, redis: redisUp ? 'connected' : 'unavailable' };
});

await app.register(authRoutes);
if (process.env.ALLOW_DEV_AUTH === 'true') {
  app.log.warn('ALLOW_DEV_AUTH=true — /auth/dev habilitado, NO usar en producción');
  await app.register(devAuthRoutes);
}
await app.register(entryRoutes);
await app.register(dayPlanRoutes);
await app.register(routineRoutes);
await app.register(routineAssignmentRoutes);
await app.register(routineProgressRoutes);
await app.register(aiRoutes);
await app.register(logRoutes);

const port = Number(process.env.PORT) || 3001;
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
