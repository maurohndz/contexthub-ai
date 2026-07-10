export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'local',
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  // Origen permitido para CORS con credenciales (el frontend).
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  // La cookie de sesión lleva el flag Secure salvo en local (http://).
  // Se puede forzar con COOKIE_SECURE=true.
  COOKIE_SECURE:
    process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
};
