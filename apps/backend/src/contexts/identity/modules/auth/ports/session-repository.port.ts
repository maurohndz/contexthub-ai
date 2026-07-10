export interface CreateSessionInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface ActiveSession {
  id: string;
  userId: string;
}

export interface SessionRepositoryPort {
  create(input: CreateSessionInput): Promise<void>;
  findActiveByTokenHash(tokenHash: string): Promise<ActiveSession | null>;
  revokeByTokenHash(tokenHash: string): Promise<void>;
}
