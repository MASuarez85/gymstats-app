# GymStats — Backend (Fase 1 + Fase 2)

API en Node.js (Fastify) + PostgreSQL (Prisma) + Redis (cache). Reemplaza el `localStorage` del frontend y las funciones serverless de `api/*.js` por un servidor propio con base de datos, autenticación y cache de las consultas repetitivas.

## Setup local

1. `cd server && npm install`
2. Copiá `.env.example` a `.env` y completá `DATABASE_URL` (podés levantar Postgres local con Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=gymstats postgres:16`), `ANTHROPIC_API_KEY`, `JWT_SECRET`, `APPLE_BUNDLE_ID` y `REDIS_URL`.
3. Redis local con Docker: `docker run -d -p 6379:6379 redis:7`. Si no lo levantás, el server igual arranca y funciona — simplemente no cachea nada (lo vas a ver en el log: `[redis] ...`).
4. `npx prisma migrate dev --name init` (si ya lo habías corrido antes, ahora hace falta una migración nueva: `npx prisma migrate dev --name add_logging_schema`, ver sección de logging más abajo) — crea las tablas.
5. `npm run dev` — levanta el servidor en `http://localhost:3001` (o el `PORT` que hayas puesto).

`GET /health` debería devolver `{"ok":true,"redis":"connected"}` (o `"unavailable"` si no levantaste Redis).

## Cache (Fase 2)

Patrón cache-aside, implementado en `src/lib/cache.js`:

- `POST /ai/vision` y `POST /ai/routine` — key = hash de la foto. Si ya se analizó esa misma foto, no se vuelve a llamar a Anthropic (TTL 30 días).
- `POST /ai/consult` — key = pregunta normalizada. TTL 24hs.
- `GET /entries` y `GET /routines` — cacheados por usuario (TTL 60s), se invalidan automáticamente al crear/editar/borrar.

Las tres respuestas de `/ai/*` incluyen un campo `_cached: true|false` para poder verificar fácilmente si vino de cache o de una llamada real.

## Logging y trazabilidad

Los requests y errores se guardan en Postgres, en un **esquema separado** (`logging`) del esquema `public` donde vive el resto de los datos — así las tablas de negocio (entries, rutinas, etc.) no se mezclan con las de diagnóstico. Esto usa la feature `multiSchema` de Prisma (`prisma/schema.prisma`), que crea el esquema `logging` solo con correr la migración, sin pasos manuales en Postgres.

- `request_logs` (esquema `logging`): un row por cada request — método, path, status code, duración, usuario, timestamp. Se guarda automáticamente vía un hook `onResponse` en `src/index.js`.
- `error_logs` (esquema `logging`): errores no manejados por las rutas (`setErrorHandler` en `src/index.js`) y errores específicos de las llamadas a Anthropic (capturados en `src/routes/ai.js`), con mensaje, stack trace y contexto.

Ambas tablas se escriben "fire and forget" (`src/lib/log.js`): si guardar el log falla, no rompe ni frena la respuesta real, solo avisa por consola.

Para consultarlos sin entrar directo a la base: `GET /logs/requests?limit=50` y `GET /logs/errors?limit=50` (mismo auth que el resto de la API).

## Endpoints

Todos menos `/auth/apple` y `/health` requieren el header `Authorization: Bearer <token>` (el token lo devuelve `/auth/apple`).

- `POST /auth/apple` — body `{ identityToken }`, devuelve `{ token, userId }`.
- `GET /entries` / `POST /entries` / `DELETE /entries/:id`
- `GET /day-plans` / `PUT /day-plans/:date` — body `{ muscleGroup }`
- `GET /routines` / `POST /routines` / `PUT /routines/:id` / `DELETE /routines/:id`
- `GET /routine-assignments` / `PUT /routine-assignments/:date` — body `{ routineId }`
- `GET /routine-progress` / `PUT /routine-progress/:date/:exerciseId` — alterna hecho/no hecho
- `POST /ai/vision` — body `{ image }` (base64), igual que el viejo `api/vision.js`
- `POST /ai/consult` — body `{ question }`, igual que el viejo `api/consult.js`
- `POST /ai/routine` — body `{ image }`, igual que el viejo `api/routine.js`
- `GET /logs/requests` / `GET /logs/errors` — query opcional `?limit=` (default 50, máximo 200)
- `GET /profile` / `PUT /profile` — body opcional `{ displayName, height, weight, goal, birthdate }`; devuelve también `trial: { active, subscribed, daysLeft }` (prueba gratuita de 30 días desde el alta, sin billing real todavía)

## Deploy (Railway, recomendado para arrancar)

1. Creá un proyecto nuevo en [railway.app](https://railway.app), agregá un servicio "Postgres" y uno "Redis" (cada uno te da su URL solo) y un servicio nuevo apuntando a este repo con **root directory** `server/`.
2. Variables de entorno del servicio: las mismas de `.env.example` (`DATABASE_URL` y `REDIS_URL` las completa Railway automático si linkeás esos servicios, las demás las cargás vos).
3. Build command: `npm install && npx prisma generate`. Start command: `npx prisma migrate deploy && npm start`.
4. Railway te da una URL pública tipo `https://gymstats-server-production.up.railway.app` — esa es la que va a usar la app nativa (Fase 3) en vez de `/api/...` de Vercel.

## Qué falta (próximas fases)

- Fase 3: la app Expo consumiendo esta API en vez de `localStorage`.
