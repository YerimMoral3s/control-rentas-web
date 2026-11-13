import { isAppError } from '@api/errors';

export type LoginFailure = { kind: 'credentials' | 'connection' | 'other'; message: string };

/** Mensajes de G-02: genéricos, sin revelar si el correo existe. */
export const describeLoginError = (error: unknown): LoginFailure => {
  if (isAppError(error)) {
    if (error.type === 'authentication' || error.type === 'validation') {
      return {
        kind: 'credentials',
        message: 'No pudimos iniciar sesión. Revisa tu correo y contraseña.',
      };
    }
    if (error.type === 'network' || error.type === 'uncertain') {
      return {
        kind: 'connection',
        message: 'No pudimos conectar. Revisa tu conexión e intenta de nuevo.',
      };
    }
    if (error.type === 'rate_limit') {
      return {
        kind: 'other',
        message: 'Hiciste varios intentos seguidos. Espera un momento e inténtalo de nuevo.',
      };
    }
    return { kind: 'other', message: error.safeMessage };
  }
  return { kind: 'other', message: 'Algo no salió como esperábamos. Inténtalo de nuevo.' };
};

/** Validación de captura del acceso (G-02): no se envía nada si falta algo. */
export const EMAIL_RULES = {
  required: 'Escribe tu correo.',
  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Escribe un correo válido.' },
} as const;

export const PASSWORD_RULES = { required: 'Escribe tu contraseña.' } as const;
