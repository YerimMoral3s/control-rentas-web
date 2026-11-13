import { AxiosError, type AxiosAdapter } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient, apiRequest, setAuthHandlers } from './http';

const originalAdapter = apiClient.defaults.adapter;
afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

const unauthorizedOnce = () => {
  const calls: Array<string | undefined> = [];
  const adapter: AxiosAdapter = async config => {
    calls.push(config.headers.get('Authorization') as string | undefined);
    if (calls.length === 1) {
      const body = { error: { type: 'auth', code: 'ACCESS_TOKEN_EXPIRED', status: 401 } };
      throw new AxiosError('401', 'ERR_BAD_REQUEST', config, null, {
        status: 401,
        statusText: '',
        data: body,
        headers: {},
        config,
      });
    }
    return {
      status: 200,
      statusText: '',
      data: { data: 'ok', meta: { request_id: 'r' } },
      headers: {},
      config,
    };
  };
  return { adapter, calls };
};

const installHandlers = () => {
  let token = 'viejo';
  const handlers = {
    getAccessToken: () => token,
    ensureFreshAccessToken: vi.fn(async () => undefined),
    recoverFromUnauthorized: vi.fn(async () => {
      token = 'nuevo';
      return true;
    }),
  };
  setAuthHandlers(handlers);
  return handlers;
};

describe('sesión en el cliente HTTP', () => {
  it('una lectura con 401 renueva la sesión y se repite una vez con el token nuevo', async () => {
    const handlers = installHandlers();
    const { adapter, calls } = unauthorizedOnce();
    apiClient.defaults.adapter = adapter;

    await expect(apiRequest({ method: 'GET', url: '/tenants' })).resolves.toMatchObject({
      data: 'ok',
    });

    expect(handlers.recoverFromUnauthorized).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(['Bearer viejo', 'Bearer nuevo']);
  });

  it('una escritura con 401 renueva la sesión pero nunca se reenvía sola', async () => {
    const handlers = installHandlers();
    const { adapter, calls } = unauthorizedOnce();
    apiClient.defaults.adapter = adapter;

    await expect(apiRequest({ method: 'POST', url: '/payments/1/register' })).rejects.toMatchObject(
      {
        type: 'authentication',
      },
    );

    expect(handlers.ensureFreshAccessToken).toHaveBeenCalledTimes(1);
    expect(handlers.recoverFromUnauthorized).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(1);
  });

  it('login y refresh no llevan Bearer ni intentan renovar', async () => {
    const handlers = installHandlers();
    const { adapter, calls } = unauthorizedOnce();
    apiClient.defaults.adapter = adapter;

    await expect(
      apiRequest({ method: 'POST', url: '/auth/login', skipAuth: true }),
    ).rejects.toMatchObject({
      type: 'authentication',
    });

    expect(calls).toEqual([undefined]);
    expect(handlers.recoverFromUnauthorized).not.toHaveBeenCalled();
  });
});
