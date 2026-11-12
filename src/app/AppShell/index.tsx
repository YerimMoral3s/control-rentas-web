import { Outlet } from 'react-router';
import styled from 'styled-components';
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

/** Marco con navegación: barra inferior en celular (F-09) y barra lateral en computadora (F-10). */
export function AppShell() {
  return (
    <Layout>
      <Sidebar />
      <Main>
        <Content>
          <Outlet />
        </Content>
      </Main>
      <BottomNav />
    </Layout>
  );
}
