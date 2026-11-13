import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SessionTokens } from '@api/auth';
import { AppError } from '@api/errors';
import { queryClient } from '@app/queryClient';
import { useAuth } from '@stores';
import { handleSessionMessage, refreshSession } from './session';

const refreshTokens = vi.hoisted(() => vi.fn());
vi.mock('@api/auth', () => ({ refreshTokens }));

const ACCOUNT_A = { id: 'a', email: 'a@rentario.test' };
const ACCOUNT_B = { id: 'b', email: 'b@rentario.test' };

const tokens = (suffix: string, expiresInMs = 60 * 60 * 1000): SessionTokens => ({
  access_token: `access-${suffix}`,
  refresh_token: `refresh-${suffix}`,
  token_type: 'Bearer',
  expires_in: 900,
  session_expires_at: new Date(Date.now() + expiresInMs).toISOString(),
});

beforeEach(() => {
  refreshTokens.mockReset();
  queryClient.clear();
  useAuth.getState().reset();
  useAuth.getState().applyLogin(ACCOUNT_A, tokens('1'));
});

describe('refreshSession', () => {
  it('renueva una sola vez aunque varias peticiones lo pidan a la vez', async () => {
    refreshTokens.mockResolvedValue({ data: { session: tokens('2') }, meta: { request_id: 'x' } });

    const results = await Promise.all([refreshSession(), refreshSession()]);

    expect(results).toEqual([true, true]);
    expect(refreshTokens).toHaveBeenCalledTimes(1);
    expect(useAuth.getState().accessToken).toBe('access-2');
  });

  it('no intenta renovar fuera del máximo de 2 horas y pide reautenticar a la misma cuenta', async () => {
    useAuth.getState().applyLogin(ACCOUNT_A, tokens('1', -1000));

    await expect(refreshSession()).resolves.toBe(false);

    expect(refreshTokens).not.toHaveBeenCalled();
    expect(useAuth.getState().status).toBe('expired');
    expect(useAuth.getState().account).toEqual(ACCOUNT_A);
    expect(useAuth.getState().refreshToken).toBeNull();
  });

  it('si el servidor rechaza la renovación, la sesión pasa a vencida', async () => {
    refreshTokens.mockRejectedValue(
      new AppError({ type: 'authentication', code: 'SESSION_REPLACED' }),
    );

    await expect(refreshSession()).resolves.toBe(false);
    expect(useAuth.getState().status).toBe('expired');
  });

  it('una falla de conexión conserva la sesión', async () => {
    refreshTokens.mockRejectedValue(new AppError({ type: 'network', code: 'NETWORK_ERROR' }));

    await expect(refreshSession()).rejects.toMatchObject({ type: 'network' });
    expect(useAuth.getState().status).toBe('authenticated');
  });
});

describe('handleSessionMessage', () => {
  it('con la misma cuenta adopta la sesión nueva y conserva los datos cargados', () => {
    queryClient.setQueryData(['tenants'], ['dato de A']);

    const result = handleSessionMessage({
      type: 'session',
      account: ACCOUNT_A,
      session: tokens('9'),
    });

    expect(result).toBe('adopted');
    expect(useAuth.getState().accessToken).toBe('access-9');
    expect(queryClient.getQueryData(['tenants'])).toEqual(['dato de A']);
  });

  it('con otra cuenta retira todos los datos de la anterior antes de abrir la nueva', () => {
    queryClient.setQueryData(['tenants'], ['dato de A']);

    const result = handleSessionMessage({
      type: 'session',
      account: ACCOUNT_B,
      session: tokens('b'),
    });

    expect(result).toBe('switched');
    expect(useAuth.getState().account).toEqual(ACCOUNT_B);
    expect(queryClient.getQueryData(['tenants'])).toBeUndefined();
  });

  it('una pestaña sin cuenta no adopta sesiones de otras pestañas', () => {
    useAuth.getState().reset();

    expect(
      handleSessionMessage({ type: 'session', account: ACCOUNT_B, session: tokens('b') }),
    ).toBe('ignored');
    expect(useAuth.getState().status).toBe('anonymous');
  });

  it('el cierre de sesión de la misma cuenta en otra pestaña retira el contexto', () => {
    expect(handleSessionMessage({ type: 'logout', accountId: 'a' })).toBe('logged_out');
    expect(useAuth.getState().status).toBe('anonymous');
  });
});
