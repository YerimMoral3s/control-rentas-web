import { useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import styled from 'styled-components';
import { Notice } from '@components';
import { media } from '@styles/theme';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

const Layout = styled.div`
  min-height: 100dvh;

  ${media.desktop} {
    display: flex;
  }
`;

const Main = styled.main`
  flex: 1;
  min-width: 0;
  padding: 20px 16px
    calc(${({ theme }) => theme.size.bottomNav} + 24px + env(safe-area-inset-bottom));

  ${media.desktop} {
    padding: 32px 40px 48px;
  }
`;

const Content = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.size.contentMax};
  margin: 0 auto;
`;

const ReturnNotice = styled.div`
  margin-bottom: 20px;

  &:focus {
    outline: none;
  }
`;

type AppShellProps = {
  /** Sesión vencida: el contenido sigue visible pero inerte detrás de G-03. */
  blocked: boolean;
  /** Se volvió a entrar con la misma cuenta. */
  returned: boolean;
  onDismissReturned: () => void;
};

/** Marco con navegación: barra inferior en celular (F-09) y barra lateral en computadora (F-10). */
export function AppShell({ blocked, returned, onDismissReturned }: AppShellProps) {
  const noticeRef = useRef<HTMLDivElement>(null);

  // G-03: al volver a entrar, el foco va al aviso "Volviste a entrar".
  useEffect(() => {
    if (returned) noticeRef.current?.focus();
  }, [returned]);

  return (
    <Layout inert={blocked} aria-hidden={blocked || undefined}>
      <Sidebar />
      <Main>
        <Content>
          {returned ? (
            <ReturnNotice ref={noticeRef} tabIndex={-1}>
              <Notice tone="success" title="Volviste a entrar" onClose={onDismissReturned}>
                Si estabas capturando algo, aún no se guardó. Revisa los datos y guarda de nuevo.
              </Notice>
            </ReturnNotice>
          ) : null}
          <Outlet />
        </Content>
      </Main>
      <BottomNav />
      {/* Volver a una lista restaura su posición; una pantalla nueva abre arriba. */}
      <ScrollRestoration />
    </Layout>
  );
}
