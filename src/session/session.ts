import type { Account, SessionTokens } from '@api/auth';
import { refreshTokens } from '@api/auth';
import { isAppError } from '@api/errors';
import { setAuthHandlers } from '@api/http';
import { queryClient } from '@app/queryClient';
import { useAuth } from '@stores';
import { broadcastSession, type SessionMessage } from './sessionChannel';

/** Se renueva por adelantado si al access token le queda menos que esto. */
const ACCESS_REFRESH_MARGIN_MS = 30_000;

let refreshInFlight: Promise<boolean> | null = null;

const sessionTimeLeftMs = () => {
  const { sessionExpiresAt } = useAuth.getState();
  return sessionExpiresAt ? Date.parse(sessionExpiresAt) - Date.now() : 0;
};

/** La sesión ya no puede renovarse: se bloquea el contenido y se pide la contraseña (G-03). */
export const expireSession = () => {
  useAuth.getState().markExpired();
};

/** Retira todo el contexto de la cuenta: caché de consultas y sesión local. No borra registros. */
export const clearSessionData = () => {
  queryClient.clear();
  useAuth.getState().reset();
};

/** Nueva sesión (login o reautenticación). Si cambia la cuenta, primero se retira el contexto anterior. */
export const startSession = (account: Account, session: SessionTokens) => {
  const previous = useAuth.getState().account;
  if (previous && previous.id !== account.id) clearSessionData();
  useAuth.getState().applyLogin(account, session);
  broadcastSession({ type: 'session', account, session });
};

/**
 * Renueva la sesión una sola vez aunque varias peticiones lo pidan a la vez.
 * Nunca intenta renovar fuera del máximo de 2 horas.
 */
export const refreshSession = (): Promise<boolean> => {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const { refreshToken, account } = useAuth.getState();

    if (!refreshToken || !account || sessionTimeLeftMs() <= 0) {
      expireSession();
      return false;
    }

    try {
      const { data } = await refreshTokens(refreshToken);
      useAuth.getState().applyTokens(data.session);
      broadcastSession({ type: 'session', account, session: data.session });
      return true;
    } catch (error) {
      // Otra pestaña con la misma sesión pudo rotar el token mientras tanto.
      const current = useAuth.getState();
      if (current.status === 'authenticated' && current.refreshToken !== refreshToken) return true;

      if (isAppError(error) && error.type === 'authentication') {
        expireSession();
        return false;
      }
      // Falla de red: la sesión se conserva; la petición que lo pidió fallará y podrá reintentarse.
      throw error;
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
};

const ensureFreshAccessToken = async () => {
  const { status, accessExpiresAt } = useAuth.getState();
  if (status !== 'authenticated') return;
  if (accessExpiresAt && accessExpiresAt - Date.now() > ACCESS_REFRESH_MARGIN_MS) return;
  try {
    await refreshSession();
  } catch {
    // Sin conexión: la escritura sigue su curso y su falla se trata como resultado incierto.
  }
};

const recoverFromUnauthorized = async () => {
  if (useAuth.getState().status !== 'authenticated') return false;
  try {
    return await refreshSession();
  } catch {
    return false;
  }
};

/** Conecta el cliente HTTP con la sesión. Se llama una vez al arrancar. */
export const installSessionHandlers = () => {
  setAuthHandlers({
    getAccessToken: () => useAuth.getState().accessToken,
    ensureFreshAccessToken,
    recoverFromUnauthorized,
  });
};

/**
 * Mensajes de otras pestañas:
 * - Misma cuenta: adopta la sesión nueva y conserva lo que se estaba haciendo.
 * - Otra cuenta: retira todo el contexto anterior y abre la cuenta nueva.
 * - Una pestaña sin cuenta (acceso vacío) no adopta sesiones ajenas.
 */
export const handleSessionMessage = (
  message: SessionMessage,
): 'adopted' | 'switched' | 'logged_out' | 'ignored' => {
  const { account } = useAuth.getState();
  if (!account) return 'ignored';

  if (message.type === 'logout') {
    if (message.accountId !== account.id) return 'ignored';
    clearSessionData();
    return 'logged_out';
  }

  if (message.account.id === account.id) {
    useAuth.getState().applyLogin(message.account, message.session);
    return 'adopted';
  }

  clearSessionData();
  useAuth.getState().applyLogin(message.account, message.session);
  return 'switched';
};
