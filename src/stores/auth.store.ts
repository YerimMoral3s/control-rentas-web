import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Account, SessionTokens } from '@api/auth';

/**
 * anonymous: sin cuenta en esta pestaña (acceso vacío).
 * authenticated: sesión vigente.
 * expired: la sesión ya no puede renovarse; se conserva la cuenta para reautenticar (G-03).
 */
export type AuthStatus = 'anonymous' | 'authenticated' | 'expired';

type AuthState = {
  status: AuthStatus;
  account: Account | null;
  /** Solo en memoria: nunca se guarda en almacenamiento. */
  accessToken: string | null;
  accessExpiresAt: number | null;
  refreshToken: string | null;
  sessionExpiresAt: string | null;
  applyLogin: (account: Account, session: SessionTokens) => void;
  applyTokens: (session: SessionTokens) => void;
  markExpired: () => void;
  reset: () => void;
};

const EMPTY = {
  status: 'anonymous' as AuthStatus,
  account: null,
  accessToken: null,
  accessExpiresAt: null,
  refreshToken: null,
  sessionExpiresAt: null,
};

const tokensFrom = (session: SessionTokens) => ({
  accessToken: session.access_token,
  accessExpiresAt: Date.now() + session.expires_in * 1000,
  refreshToken: session.refresh_token,
  sessionExpiresAt: session.session_expires_at,
});

/**
 * Sesión de la pestaña. Se guarda en sessionStorage (no se comparte con pestañas nuevas)
 * y solo con lo necesario para sobrevivir una recarga. La contraseña nunca entra aquí.
 */
export const useAuth = create<AuthState>()(
  persist(
    set => ({
      ...EMPTY,
      applyLogin: (account, session) =>
        set({ status: 'authenticated', account, ...tokensFrom(session) }),
      applyTokens: session => set({ status: 'authenticated', ...tokensFrom(session) }),
      markExpired: () =>
        set(state => ({
          ...EMPTY,
          // Sin cuenta conocida no hay a quién reautenticar: se pide el acceso normal.
          status: state.account ? 'expired' : 'anonymous',
          account: state.account,
        })),
      reset: () => set(EMPTY),
    }),
    {
      name: 'rentario-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ status, account, refreshToken, sessionExpiresAt }) => ({
        status,
        account,
        refreshToken,
        sessionExpiresAt,
      }),
    },
  ),
);
