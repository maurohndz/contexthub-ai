// Usuario visto desde el módulo de auth (sin datos sensibles).
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

export class EmailAlreadyInUseError extends Error {
  constructor() {
    super('El email ya está registrado');
    this.name = 'EmailAlreadyInUseError';
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Email o contraseña incorrectos');
    this.name = 'InvalidCredentialsError';
  }
}
