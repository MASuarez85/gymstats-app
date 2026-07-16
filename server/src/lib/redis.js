// Cliente único de Redis. Si Redis no está disponible (no lo levantaste, o se cayó),
// el backend tiene que seguir funcionando sin cache — nunca debe tirar el proceso.
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  lazyConnect: true, // no intenta conectar hasta el primer uso real
  maxRetriesPerRequest: 1,
  retryStrategy: () => null, // no reintentar solo en el fondo; si falla, seguimos sin cache
  enableOfflineQueue: false,
  connectTimeout: 2000,
});

redis.on('error', (err) => {
  console.warn('[redis] ' + err.message);
});
