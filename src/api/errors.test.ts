import { AxiosError, AxiosHeaders, CanceledError, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';
import { AppError, normalizeError } from './errors';

const config = (method: string): InternalAxiosRequestConfig => ({
  method,
  url: '/payments/1/register',
  headers: new AxiosHeaders({ 'X-Request-Id': 'req_front_test_1' }),
});

const responseError = (
  method: string,
  status: number,
  data: unknown,
  headers: Record<string, string> = {},
) =>
  new AxiosError('fallo', 'ERR_BAD_RESPONSE', config(method), null, {
    status,
    statusText: '',
    data,
    headers,
    config: config(method),
  });

const apiError = (code: string, status: number, details: unknown = null) => ({
  error: { type: 'x', code, title: 't', detail: 'detalle técnico', status, details },
  meta: { request_id: 'req_back_1' },
});

describe('normalizeError', () => {
  it('marca como incierta una escritura sin respuesta y nunca como error de conexión simple', () => {
    const error = normalizeError(new AxiosError('Network Error', 'ERR_NETWORK', config('post')));
    expect(error.type).toBe('uncertain');
    expect(error.requestId).toBe('req_front_test_1');
  });

  it('trata una lectura sin respuesta como error de conexión', () => {
    const error = normalizeError(new AxiosError('Network Error', 'ERR_NETWORK', config('get')));
    expect(error.type).toBe('network');
  });

  it('marca como incierta una escritura que recibe 500', () => {
    const error = normalizeError(
      responseError('patch', 500, apiError('INTERNAL_SERVER_ERROR', 500)),
    );
    expect(error.type).toBe('uncertain');
  });

  it('conserva los errores por campo de un 422 y el request_id del backend', () => {
    const fields = [{ field: 'amount', code: 'isPositive', message: 'x' }];
    const error = normalizeError(
      responseError('post', 422, apiError('VALIDATION_FAILED', 422, { fields })),
    );
    expect(error.type).toBe('validation');
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.fields).toEqual(fields);
    expect(error.requestId).toBe('req_back_1');
  });

  it('distingue 409 con detalles, como la nueva revisión de PREVIEW_CHANGED', () => {
    const error = normalizeError(
      responseError('post', 409, apiError('PREVIEW_CHANGED', 409, { preview: { total: 1 } })),
    );
    expect(error.type).toBe('conflict');
    expect(error.details).toEqual({ preview: { total: 1 } });
  });

  it('respeta Retry-After en 429', () => {
    const error = normalizeError(
      responseError('post', 429, apiError('RATE_LIMIT_EXCEEDED', 429), { 'retry-after': '30' }),
    );
    expect(error.type).toBe('rate_limit');
    expect(error.retryAfterMs).toBe(30_000);
  });

  it('separa sesión, ausencia y rechazo del cuerpo', () => {
    expect(
      normalizeError(responseError('get', 401, apiError('ACCESS_TOKEN_EXPIRED', 401))).type,
    ).toBe('authentication');
    expect(normalizeError(responseError('get', 404, apiError('NOT_FOUND', 404))).type).toBe(
      'not_found',
    );
    expect(
      normalizeError(responseError('post', 413, apiError('VALIDATION_FAILED', 413))).type,
    ).toBe('rejected');
  });

  it('nunca expone el texto técnico del backend en el mensaje para la usuaria', () => {
    const error = normalizeError(responseError('get', 404, apiError('NOT_FOUND', 404)));
    expect(error.safeMessage).not.toContain('detalle técnico');
    expect(error.safeMessage).not.toMatch(/404|NOT_FOUND/);
  });

  it('reconoce cancelaciones y errores ya normalizados', () => {
    expect(normalizeError(new CanceledError()).type).toBe('cancelled');
    const existing = new AppError({ type: 'conflict', code: 'X' });
    expect(normalizeError(existing)).toBe(existing);
  });
});
