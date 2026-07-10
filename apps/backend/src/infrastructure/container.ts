// Wiring manual de dependencias (composition root). Si el grafo crece,
// migrar a awilix o similar.
import { BcryptPasswordHasher } from '../contexts/identity/modules/auth/infra/bcrypt-password-hasher';
import { PrismaSessionRepository } from '../contexts/identity/modules/auth/infra/prisma-session.repository';
import { PrismaUserRepository } from '../contexts/identity/modules/auth/infra/prisma-user.repository';
import { GetCurrentUserUseCase } from '../contexts/identity/modules/auth/use-cases/get-current-user/get-current-user.use-case';
import { LoginUserUseCase } from '../contexts/identity/modules/auth/use-cases/login-user/login-user.use-case';
import { LogoutUserUseCase } from '../contexts/identity/modules/auth/use-cases/logout-user/logout-user.use-case';
import { RegisterUserUseCase } from '../contexts/identity/modules/auth/use-cases/register-user/register-user.use-case';

const userRepository = new PrismaUserRepository();
const sessionRepository = new PrismaSessionRepository();
const passwordHasher = new BcryptPasswordHasher();

export const container = {
  registerUser: new RegisterUserUseCase(userRepository, sessionRepository, passwordHasher),
  loginUser: new LoginUserUseCase(userRepository, sessionRepository, passwordHasher),
  logoutUser: new LogoutUserUseCase(sessionRepository),
  getCurrentUser: new GetCurrentUserUseCase(userRepository, sessionRepository),
};
