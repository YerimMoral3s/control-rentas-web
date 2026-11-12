import axios, { type AxiosRequestConfig } from 'axios';
import { createRequestId } from '@lib/requestId';
import { API_BASE_URL } from './config';
import { normalizeError } from './errors';
import type { ApiMeta, ApiSuccess } from './types';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Nombre corto de la operación para el X-Request-Id, por ejemplo "payments_register". */
    operation?: string;
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.request.use(config => {
  config.headers.set('X-Request-Id', createRequestId(config.operation));
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  error => Promise.reject(normalizeError(error)),
);

/** Ejecuta una petición y devuelve la envoltura { data, meta, message } tal como llega. */
export const apiRequest = async <TData, TMeta extends ApiMeta = ApiMeta>(
  config: AxiosRequestConfig,
): Promise<ApiSuccess<TData, TMeta>> => {
  const response = await apiClient.request<ApiSuccess<TData, TMeta>>(config);
  return response.data;
};
