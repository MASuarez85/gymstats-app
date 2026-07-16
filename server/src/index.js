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
import { checkRedisHealth } from './lib/cache.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true }); // la app nativa no corre en un origen fijo

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

const port = Number(process.env.PORT) || 3001;
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
