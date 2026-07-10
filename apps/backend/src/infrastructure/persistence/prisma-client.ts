import { PrismaClient } from '@prisma/client';

// Singleton: una sola conexión (pool) por proceso. Se importa desde los
// repositorios de cada módulo cuando se conecten a la DB real.
export const prisma = new PrismaClient();
