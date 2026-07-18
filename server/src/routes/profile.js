import { prisma } from '../db.js';
import { requireAuth } from '../auth/middleware.js';

const TRIAL_DAYS = 30;
const GOALS = ['Fuerza', 'Hipertrofia', 'Resistencia', 'Salud general'];

// Calcula el estado de la prueba gratuita a partir de trialStartedAt/subscriptionActive.
// No hay billing real todavía (fase futura) — esto solo determina si las pestañas
// pagas (Calendario, Progreso, Consultar, Rutinas) siguen habilitadas.
function trialStatus(user) {
  if (user.subscriptionActive) {
    return { active: true, subscribed: true, daysLeft: null };
  }
  const startedMs = new Date(user.trialStartedAt).getTime();
  const elapsedDays = (Date.now() - startedMs) / (1000 * 60 * 60 * 24);
  const daysLeft = Math.max(0, Math.ceil(TRIAL_DAYS - elapsedDays));
  return { active: elapsedDays < TRIAL_DAYS, subscribed: false, daysLeft };
}

function serialize(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    height: user.height,
    weight: user.weight,
    goal: user.goal,
    birthdate: user.birthdate ? user.birthdate.toISOString().slice(0, 10) : null,
    trial: trialStatus(user),
  };
}

export default async function profileRoutes(app) {
  app.addHook('preHandler', requireAuth);

  app.get('/profile', async (request, reply) => {
    const user = await prisma.user.findUnique({ where: { id: request.userId } });
    if (!user) return reply.code(404).send({ error: 'Usuario no encontrado' });
    return serialize(user);
  });

  // Body: { displayName?, height?, weight?, goal?, birthdate? } — todos opcionales,
  // solo se actualiza lo que venga presente.
  app.put('/profile', async (request, reply) => {
    const { displayName, height, weight, goal, birthdate } = request.body || {};

    if (goal !== undefined && goal !== null && !GOALS.includes(goal)) {
      return reply.code(400).send({ error: `goal debe ser uno de: ${GOALS.join(', ')}` });
    }

    const data = {};
    if (displayName !== undefined) data.displayName = displayName || null;
    if (height !== undefined) data.height = height === null || height === '' ? null : Number(height);
    if (weight !== undefined) data.weight = weight === null || weight === '' ? null : Number(weight);
    if (goal !== undefined) data.goal = goal || null;
    if (birthdate !== undefined) data.birthdate = birthdate ? new Date(birthdate) : null;

    const user = await prisma.user.update({ where: { id: request.userId }, data });
    return serialize(user);
  });
}
