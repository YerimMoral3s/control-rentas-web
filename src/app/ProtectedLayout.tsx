import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import styled from 'styled-components';
import { Button, Skeleton, StateMessage } from '@components';
import { ReauthDialog } from '@features/access/ReauthDialog';
import { expireSession, handleSessionMessage, refreshSession } from '@session/session';
import { listenSessionChannel } from '@session/sessionChannel';
import { useAuth } from '@stores';
import { queryClient } from './queryClient';
import { AppShell } from './AppShell';

const Centered = styled.div`
  max-width: 560px;
  margin: 48px auto;
  padding: 0 16px;
  display: grid;
  gap: 12px;
`;

/**
 * Valida la sesión antes de mostrar cualquier pantalla protegida (flujo 2 de acceso):
 * recupera el access token tras recargar, cierra al llegar a las 2 horas y atiende otras pestañas.
 */
export function ProtectedLayout() {
  const status = useAuth(state => state.status);
  const hasAccessToken = useAuth(state => Boolean(state.accessToken));
  const sessionExpiresAt = useAuth(state => state.sessionExpiresAt);
  const navigate = useNavigate();
  const [restoreFailed, setRestoreFailed] = useState(false);
  const { pathname } = useLocation();
  // F-08: el aviso "Volviste a entrar" permanece hasta cerrarlo o salir de la pantalla.
  const [returnedAt, setReturnedAt] = useState<string | null>(null);
  const returned = returnedAt === pathname;

  useEffect(
    () =>
      listenSessionChannel(message => {
        const result = handleSessionMessage(message);
        if (result === 'switched') navigate('/', { replace: true });
        if (result === 'logged_out') navigate('/acceso', { replace: true });
      }),
    [navigate],
  );

  // Al llegar al máximo de 2 horas se bloquea el contenido aunque no haya peticiones en curso.
  useEffect(() => {
    if (status !== 'authenticated' || !sessionExpiresAt) return;
    const timer = setTimeout(expireSession, Math.max(Date.parse(sessionExpiresAt) - Date.now(), 0));
    return () => clearTimeout(timer);
  }, [status, sessionExpiresAt]);

  // Tras recargar, el access token (solo en memoria) se recupera con el refresh token.
  useEffect(() => {
    if (status !== 'authenticated' || hasAccessToken) return;
    refreshSession().catch(() => setRestoreFailed(true));
  }, [status, hasAccessToken]);

  if (status === 'anonymous') return <Navigate to="/acceso" replace />;

  if (status === 'authenticated' && !hasAccessToken) {
    return (
      <Centered aria-busy={!restoreFailed}>
        {restoreFailed ? (
          <StateMessage
            kind="error"
            title="No pudimos conectar"
            description="Revisa tu conexión e intenta de nuevo."
            action={
              <Button
                variant="secondary"
                icon="retry"
                onClick={() => {
                  setRestoreFailed(false);
                  refreshSession().catch(() => setRestoreFailed(true));
                }}
              >
                Intentar de nuevo
              </Button>
            }
          />
        ) : (
          <>
            <Skeleton $height="34px" $width="40%" />
            <Skeleton $height="120px" $radius="14px" />
          </>
        )}
      </Centered>
    );
  }

  return (
    <>
      <AppShell
        blocked={status === 'expired'}
        returned={returned}
        onDismissReturned={() => setReturnedAt(null)}
      />
      <ReauthDialog
        onReturned={() => {
          setReturnedAt(pathname);
          // Los datos se vuelven a consultar con la nueva sesión; nada se reenvía solo.
          void queryClient.invalidateQueries();
        }}
      />
    </>
  );
}
