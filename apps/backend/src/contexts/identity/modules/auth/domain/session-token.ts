import { createHash, randomBytes } from 'node:crypto';

// Duración de la sesión: 7 días. La cookie y la fila en security.sessions
// comparten este TTL.
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Token opaco que viaja en la cookie httpOnly. En la base solo se guarda
// su hash sha256 (si se filtra la tabla, los tokens no sirven).
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
