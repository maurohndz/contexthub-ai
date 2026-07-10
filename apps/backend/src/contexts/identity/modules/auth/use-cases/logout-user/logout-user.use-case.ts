import { hashSessionToken } from '../../domain/session-token';
import type { SessionRepositoryPort } from '../../ports/session-repository.port';

export class LogoutUserUseCase {
  constructor(private readonly sessions: SessionRepositoryPort) {}

  async execute(sessionToken: string): Promise<void> {
    await this.sessions.revokeByTokenHash(hashSessionToken(sessionToken));
  }
}
