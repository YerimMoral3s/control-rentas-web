import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it } from 'vitest';
import type { AppError } from './errors';
import { apiClient, apiRequest } from './http';

const originalAdapter = apiClient.defaults.adapter;

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

const respondWith = (status: number, data: unknown): AxiosAdapter => {
  const sent: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = async config => {
    sent.push(config);
    const response = { status, statusText: '', data, headers: {}, config };
    if (status >= 400) throw new AxiosError('fallo', 'ERR_BAD_RESPONSE', config, null, response);
    return response;
  };
  return Object.assign(adapter, { sent });
};

describe('apiRequest', () => {
  it('envía un X-Request-Id propio con la operación y devuelve la envoltura tal como llega', async () => {
    const adapter = respondWith(200, { data: { status: 'ok' }, meta: { request_id: 'req_1' } });
    apiClient.defaults.adapter = adapter;

    const result = await apiRequest<{ status: string }>({
      method: 'GET',
      url: '/health',
      operation: 'health_check',
    });

    expect(result).toEqual({ data: { status: 'ok' }, meta: { request_id: 'req_1' } });
    const requestId = (
      adapter as unknown as { sent: InternalAxiosRequestConfig[] }
    ).sent[0]?.headers.get('X-Request-Id');
    expect(requestId).toMatch(/^req_front_health_check_[0-9a-f]{32}$/);
  });

  it('rechaza con un AppError normalizado', async () => {
    apiClient.defaults.adapter = respondWith(409, {
      error: { type: 'conflict', code: 'PAYMENT_STATE_CONFLICT', status: 409 },
      meta: { request_id: 'req_2' },
    });

    await expect(apiRequest({ method: 'POST', url: '/payments/1/register' })).rejects.toMatchObject(
      {
        type: 'conflict',
        code: 'PAYMENT_STATE_CONFLICT',
        requestId: 'req_2',
      } satisfies Partial<AppError>,
    );
  });
});
