import axios, { type AxiosRequestConfig } from 'axios';
import { createRequestId } from '@lib/requestId';
import { API_BASE_URL } from './config';
import { normalizeError } from './errors';
import type { ApiMeta, ApiSuccess } from './types';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Nombre corto de la operación para el X-Request-Id, por ejemplo "payments_register". */
    operation?: string;
    /** Login y refresh: no llevan Bearer ni intentan renovar la sesión. */
    skipAuth?: boolean;
    /** Interno: una lectura ya se repitió una vez tras renovar. */
    authRetried?: boolean;
  }
}

/** Lo registra la capa de sesión al arrancar, para evitar dependencias circulares. */
type AuthHandlers = {
  getAccessToken: () => string | null;
  /** Antes de escribir: renueva por adelantado si el access token está por vencer. */
  ensureFreshAccessToken: () => Promise<void>;
  /** Tras un 401: intenta renovar. Devuelve true si la sesión sigue válida. */
  recoverFromUnauthorized: () => Promise<boolean>;
};

let authHandlers: AuthHandlers | null = null;

export const setAuthHandlers = (handlers: AuthHandlers) => {
  authHandlers = handlers;
};

const isReadMethod = (method?: string) => !method || method.toLowerCase() === 'get';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.request.use(async config => {
  config.headers.set('X-Request-Id', createRequestId(config.operation));

  if (!config.skipAuth && authHandlers) {
    if (!isReadMethod(config.method)) await authHandlers.ensureFreshAccessToken();
    const token = authHandlers.getAccessToken();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async error => {
    const appError = normalizeError(error);
    const config = axios.isAxiosError(error) ? error.config : undefined;

    if (appError.type === 'authentication' && config && !config.skipAuth && authHandlers) {
      const recovered = await authHandlers.recoverFromUnauthorized();
      // Solo una lectura se repite, una vez. Una escritura nunca se reenvía sola.
      if (recovered && isReadMethod(config.method) && !config.authRetried) {
        return apiClient.request({ ...config, authRetried: true });
      }
    }

    return Promise.reject(appError);
  },
);

/** Ejecuta una petición y devuelve la envoltura { data, meta, message } tal como llega. */
export const apiRequest = async <TData, TMeta extends ApiMeta = ApiMeta>(
  config: AxiosRequestConfig,
): Promise<ApiSuccess<TData, TMeta>> => {
  const response = await apiClient.request<ApiSuccess<TData, TMeta>>(config);
  return response.data;
};
