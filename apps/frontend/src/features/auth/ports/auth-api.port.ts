import type { User } from '../domain/user';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthApiPort {
  register(input: RegisterInput): Promise<User>;
  login(input: LoginInput): Promise<User>;
  getCurrentUser(): Promise<User | null>;
  logout(): Promise<void>;
}
