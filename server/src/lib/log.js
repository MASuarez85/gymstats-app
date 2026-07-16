// Logging estructurado a Postgres (esquema "logging", separado de las tablas
// de negocio). Fire-and-forget a propósito: si guardar el log falla, no debe
// romper ni frenar la respuesta real al cliente — solo se avisa por consola.
import { prisma } from '../db.js';

export function logRequest({ requestId, method, path, statusCode, durationMs, userId }) {
  prisma.requestLog
    .create({
      data: {
        requestId,
        method,
        path,
        statusCode,
        durationMs: Math.round(durationMs),
        userId: userId || null,
      },
    })
    .catch((err) => console.warn('[log] no se pudo guardar el request log:', err.message));
}

export function logError({ requestId, source, message, stack, context, userId }) {
  prisma.errorLog
    .create({
      data: {
        requestId: requestId || null,
        source,
        message,
        stack: stack || null,
        context: context ?? undefined,
        userId: userId || null,
      },
    })
    .catch((err) => console.warn('[log] no se pudo guardar el error log:', err.message));
}
