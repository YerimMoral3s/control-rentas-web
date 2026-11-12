import { Link } from 'react-router';
import styled from 'styled-components';
import { Icon } from '@components';
import { MOBILE_MORE } from '@app/navigation';
import { PageTitle } from './PendingScreen';

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
  overflow: hidden;
`;

const Row = styled(Link)`
  min-height: 64px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: ${({ theme }) => theme.color.neutral950};
  text-decoration: none;
  font-size: 16px;
  font-weight: 700;

  &:active {
    background: ${({ theme }) => theme.color.neutral50};
  }

  &:focus-visible {
    outline-offset: -3px;
  }
`;

/** G-04 en celular: destinos secundarios. Cerrar sesión se agrega en la fase 2. */
export function MorePage() {
  return (
    <>
      <PageTitle>Más</PageTitle>
      <List>
        {MOBILE_MORE.map(item => (
          <li key={item.path}>
            <Row to={item.path}>
              <Icon name={item.icon} size={22} />
              {item.label}
            </Row>
          </li>
        ))}
      </List>
    </>
  );
}
