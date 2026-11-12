import { apiRequest } from './http';

export type Health = { status: 'ok' };

/** GET /v1/health — pública; comprueba que el proceso HTTP del backend responde. */
export const getHealth = (signal?: AbortSignal) =>
  apiRequest<Health>({ method: 'GET', url: '/health', signal, operation: 'health_check' });
