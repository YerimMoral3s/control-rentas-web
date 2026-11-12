import { AxiosError, isCancel } from 'axios';
import type { ApiErrorBody, ApiFieldError } from './types';

export type AppErrorType =
  | 'network'
  | 'uncertain'
  | 'cancelled'
  | 'authentication'
  | 'not_found'
  | 'conflict'
  | 'validation'
  | 'rejected'
  | 'rate_limit'
  | 'server'
  | 'unknown';

/**
 * Mensajes amables y sin jerga técnica. Las pantallas pueden mostrar uno más específico
 * según `code`, pero nunca el `message` del backend ni códigos.
 */
export const SAFE_MESSAGES: Record<AppErrorType, string> = {
  network: 'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.',
  uncertain:
    'No pudimos confirmar si se guardó. Revisa la información antes de intentarlo otra vez.',
  cancelled: 'La consulta se canceló.',
  authentication: 'Tu sesión terminó. Vuelve a entrar para continuar.',
  not_found: 'No encontramos esta información. Es posible que ya no esté disponible.',
  conflict: 'La información cambió mientras trabajabas. Revisa cómo quedó antes de continuar.',
  validation: 'Revisa los datos marcados e inténtalo de nuevo.',
  rejected: 'No pudimos enviar la información. Revisa los datos e inténtalo de nuevo.',
  rate_limit: 'Hiciste varios intentos seguidos. Espera un momento e inténtalo de nuevo.',
  server: 'No pudimos cargar la información. Inténtalo de nuevo en un momento.',
  unknown: 'Algo no salió como esperábamos. Inténtalo de nuevo.',
};

type AppErrorParams = {
  type: AppErrorType;
  code: string;
  status?: number;
  requestId?: string;
  fields?: ApiFieldError[];
  details?: Record<string, unknown>;
  retryAfterMs?: number;
  cause?: unknown;
};

export class AppError extends Error {
  readonly type: AppErrorType;
  readonly code: string;
  readonly status?: number;
  readonly requestId?: string;
  readonly fields: ApiFieldError[];
  readonly details?: Record<string, unknown>;
  readonly retryAfterMs?: number;
  readonly safeMessage: string;

  constructor(params: AppErrorParams) {
    super(params.code, { cause: params.cause });
    this.name = 'AppError';
    this.type = params.type;
    this.code = params.code;
    this.status = params.status;
    this.requestId = params.requestId;
    this.fields = params.fields ?? [];
    this.details = params.details;
    this.retryAfterMs = params.retryAfterMs;
    this.safeMessage = SAFE_MESSAGES[params.type];
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;

const WRITE_METHODS = new Set(['post', 'put', 'patch', 'delete']);

const isWriteRequest = (method?: string): boolean =>
  method ? WRITE_METHODS.has(method.toLowerCase()) : false;

const isApiErrorBody = (value: unknown): value is ApiErrorBody => {
  if (!value || typeof value !== 'object') return false;
  const error = (value as { error?: unknown }).error;
  return (
    !!error && typeof error === 'object' && typeof (error as { code?: unknown }).code === 'string'
  );
};

const parseRetryAfterMs = (value: unknown): number | undefined => {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(String(value));
  return Number.isNaN(date) ? undefined : Math.max(date - Date.now(), 0);
};

const typeForStatus = (status: number, isWrite: boolean): AppErrorType => {
  if (status === 401) return 'authentication';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 400 || status === 422) return 'validation';
  if (status === 413 || status === 415) return 'rejected';
  if (status === 429) return 'rate_limit';
  if (status >= 500) return isWrite ? 'uncertain' : 'server';
  return 'unknown';
};

/**
 * Convierte cualquier falla de axios en un AppError.
 * - Escritura sin respuesta (red, tiempo agotado) o con 5xx: resultado incierto, nunca se repite sola.
 * - Lectura sin respuesta: error de conexión.
 */
export const normalizeError = (error: unknown): AppError => {
  if (isAppError(error)) return error;

  if (isCancel(error)) {
    return new AppError({ type: 'cancelled', code: 'REQUEST_CANCELLED', cause: error });
  }

  if (!(error instanceof AxiosError)) {
    return new AppError({ type: 'unknown', code: 'UNEXPECTED_ERROR', cause: error });
  }

  const isWrite = isWriteRequest(error.config?.method);
  const sentRequestId = error.config?.headers?.get?.('X-Request-Id');
  const fallbackRequestId = typeof sentRequestId === 'string' ? sentRequestId : undefined;

  if (!error.response) {
    return new AppError({
      type: isWrite ? 'uncertain' : 'network',
      code: isWrite ? 'WRITE_RESULT_UNKNOWN' : 'NETWORK_ERROR',
      requestId: fallbackRequestId,
      cause: error,
    });
  }

  const { status, data, headers } = error.response;
  const body = isApiErrorBody(data) ? data : undefined;
  const headerRequestId = headers?.['x-request-id'];
  const requestId =
    body?.meta?.request_id ??
    (typeof headerRequestId === 'string' ? headerRequestId : undefined) ??
    fallbackRequestId;
  const { fields, ...details } = body?.error.details ?? {};

  return new AppError({
    type: typeForStatus(status, isWrite),
    code: body?.error.code ?? `HTTP_${status}`,
    status,
    requestId,
    fields: Array.isArray(fields) ? fields : [],
    details: Object.keys(details).length > 0 ? details : undefined,
    retryAfterMs: status === 429 ? parseRetryAfterMs(headers?.['retry-after']) : undefined,
    cause: error,
  });
};
