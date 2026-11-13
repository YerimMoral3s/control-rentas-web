import { useState } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import { Icon } from '@components';
import { LogoutDialog } from '@features/access/LogoutDialog';
import { PageTitle } from './PendingScreen';

const Group = styled.div`
  margin-bottom: 20px;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
  overflow: hidden;
`;

const Row = styled(Link)`
  min-height: 64px;
  padding: 10px 12px 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.color.neutral950};
  text-decoration: none;

  &:hover {
    color: ${({ theme }) => theme.color.neutral950};
  }

  &:active {
    background: ${({ theme }) => theme.color.neutral50};
  }

  &:focus-visible {
    outline-offset: -3px;
  }
`;

const RowText = styled.span`
  flex: 1;
  display: flex;
  flex-direction: column;

  strong {
    font-size: 16px;
    line-height: 22px;
  }

  span {
    font-size: 13px;
    line-height: 18px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Chevron = styled.span`
  display: flex;
  transform: rotate(180deg);
  color: ${({ theme }) => theme.color.neutral400};
`;

const LogoutRow = styled.button`
  width: 100%;
  min-height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.color.neutral700};
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  &:active {
    background: ${({ theme }) => theme.color.neutral50};
  }

  &:focus-visible {
    outline-offset: -3px;
  }
`;

/** G-04 en celular: Contratos y, en su propio grupo, Cerrar sesión. */
export function MorePage() {
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <>
      <PageTitle>Más</PageTitle>
      <Group>
        <Row to="/contratos">
          <Icon name="contracts" size={22} />
          <RowText>
            <strong>Contratos</strong>
            <span>Activos, vencidos y terminados</span>
          </RowText>
          <Chevron>
            <Icon name="chevronLeft" size={20} />
          </Chevron>
        </Row>
      </Group>
      <Group>
        <LogoutRow type="button" onClick={() => setLogoutOpen(true)}>
          <Icon name="logout" size={22} />
          Cerrar sesión
        </LogoutRow>
      </Group>
      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </>
  );
}
