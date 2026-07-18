// Cliente único de Redis. Si Redis no está disponible (no lo levantaste, o se cayó),
// el backend tiene que seguir funcionando sin cache — nunca debe tirar el proceso.
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  lazyConnect: true, // no intenta conectar hasta el primer uso real
  maxRetriesPerRequest: 1,
  retryStrategy: () => null, // no reintentar solo en el fondo; si falla, seguimos sin cache
  enableOfflineQueue: false,
  connectTimeout: 5000,
  // Railway (y otros PaaS) exponen la red privada entre servicios solo por IPv6
  // (hostnames *.railway.internal). family: 0 le pide a Node que pruebe IPv4 y
  // IPv6 (dual stack) en vez de forzar IPv4, que es lo que rompía la conexión ahí.
  family: 0,
});

redis.on('error', (err) => {
  console.warn('[redis] ' + err.message);
});
