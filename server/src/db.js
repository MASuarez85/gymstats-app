// Cliente único de Prisma, reusado en toda la app (evita abrir un pool nuevo por request).
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
