// Patrón cache-aside sobre Redis, con fallback: si Redis no está disponible o falla,
// las funciones siguen andando calculando todo en el momento, solo que sin cache.
import { redis } from './redis.js';

let lastAttemptAt = 0;
const RETRY_COOLDOWN_MS = 15_000; // si falla, no reintenta en cada request — como mucho cada 15s

// Antes esto solo probaba conectar una vez por vida del proceso: si el primer
// intento fallaba (ej: Redis todavía arrancando en Railway), quedaba sin cache
// hasta el próximo redeploy manual. Con el cooldown se auto-recupera solo.
async function ensureConnected() {
  if (redis.status === 'ready') return true;
  const now = Date.now();
  if (now - lastAttemptAt < RETRY_COOLDOWN_MS) return false;
  lastAttemptAt = now;
  try {
    await redis.connect();
    return true;
  } catch (err) {
    console.warn('[cache] no se pudo conectar a Redis, sigo sin cache:', err.message);
    return false;
  }
}

// compute() solo se llama si no hay hit en cache (o si Redis no está disponible).
// Devuelve { value, cached } para que quien llama sepa si vino de cache o no.
export async function withCache(key, ttlSeconds, compute) {
  const connected = await ensureConnected();

  if (connected) {
    try {
      const cached = await redis.get(key);
      if (cached !== null) return { value: JSON.parse(cached), cached: true };
    } catch (err) {
      console.warn('[cache] lectura falló, sigo sin cache:', err.message);
    }
  }

  const value = await compute();

  if (connected) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      console.warn('[cache] escritura falló:', err.message);
    }
  }

  return { value, cached: false };
}

export async function invalidate(key) {
  try {
    if (redis.status === 'ready') await redis.del(key);
  } catch (err) {
    console.warn('[cache] invalidación falló:', err.message);
  }
}

// Usado por /health para reportar si Redis está disponible sin romper nada si no lo está.
export async function checkRedisHealth() {
  return ensureConnected();
}
