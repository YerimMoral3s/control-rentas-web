import { apiRequest } from './http';

/** Contrato: apis/auth_api_control_rentas.txt */

export type Account = {
  id: string;
  email: string;
};

export type SessionTokens = {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  /** Segundos de vida del access token, ya acotados al plazo de la sesión. */
  expires_in: number;
  /** Límite máximo original de 2 horas; renovar no lo extiende. */
  session_expires_at: string;
};

export type LoginResponse = { account: Account; session: SessionTokens };
type RefreshResponse = { session: SessionTokens };
type LogoutResponse = { logged_out: boolean };

export type LoginRequest = { email: string; password: string };

/** POST /v1/auth/login — pública. */
export const login = (body: LoginRequest) =>
  apiRequest<LoginResponse>({
    method: 'POST',
    url: '/auth/login',
    data: body,
    operation: 'auth_login',
    skipAuth: true,
  });

/** POST /v1/auth/refresh — pública; rota el refresh token dentro del mismo plazo. */
export const refreshTokens = (refreshToken: string) =>
  apiRequest<RefreshResponse>({
    method: 'POST',
    url: '/auth/refresh',
    data: { refresh_token: refreshToken },
    operation: 'auth_refresh',
    skipAuth: true,
  });

/** POST /v1/auth/logout — cierra solo la sesión autenticada. */
export const logout = () =>
  apiRequest<LogoutResponse>({ method: 'POST', url: '/auth/logout', operation: 'auth_logout' });
