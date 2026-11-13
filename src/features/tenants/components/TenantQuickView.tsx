import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import type { Tenant } from '@api/tenants';
import { Button, FROM_LIST_STATE, Icon, StatusBadge } from '@components';
import { formatPhone } from '@lib/format';
import { fullName, placeName } from '../tenantText';
import { DebtLabel } from './DebtLabel';

const Aside = styled.aside`
  width: 400px;
  flex: none;
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.panel};
  box-shadow: 0 12px 32px rgba(16, 24, 40, 0.1);
`;

const Head = styled.div`
  padding: 16px 12px 12px 20px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.color.neutral200};
`;

const HeadText = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;

  h2 {
    margin: 0;
    font-size: 20px;
    line-height: 26px;
  }

  span {
    font-size: 13px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Close = styled.button`
  width: 44px;
  height: 44px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: ${({ theme }) => theme.radius.control};
  background: transparent;
  color: ${({ theme }) => theme.color.neutral600};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.neutral100};
  }
`;

const Body = styled.div`
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Block = styled.section`
  display: flex;
  flex-direction: column;
  gap: 6px;

  h3 {
    margin: 0;
    font-size: 13px;
    line-height: 18px;
    font-weight: 700;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Muted = styled.span`
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Units = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
    padding: 10px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border: 1px solid ${({ theme }) => theme.color.neutral200};
    border-radius: ${({ theme }) => theme.radius.control};
    background: ${({ theme }) => theme.color.neutral50};
    font-size: 15px;
    font-weight: 600;
  }
`;

const Foot = styled.div`
  padding: 12px 20px 16px;
  display: flex;
  gap: 8px;
  border-top: 1px solid ${({ theme }) => theme.color.neutral200};

  > * {
    flex: 1;
  }
`;

const DetailLink = styled(Link)`
  height: ${({ theme }) => theme.size.touchPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.color.primaryBorder};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ theme }) => theme.color.primary100};
  color: ${({ theme }) => theme.color.primary700};
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.color.primaryPressed};
  }
`;

type TenantQuickViewProps = {
  tenant: Tenant;
  onClose: () => void;
};

/** T-02: vista rápida en computadora. No bloquea la lista; Esc o la X la cierran. */
export function TenantQuickView({ tenant, onClose }: TenantQuickViewProps) {
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const name = fullName(tenant);
  const historical = Number(tenant.overdue_debt.historical_amount) > 0;

  return (
    <Aside aria-label={`Vista rápida de ${name}`}>
      <Head>
        <HeadText>
          <h2>{name}</h2>
          <span>Inquilino · {formatPhone(tenant.phone)}</span>
        </HeadText>
        <Close type="button" aria-label="Cerrar vista rápida" onClick={onClose}>
          <Icon name="close" size={20} strokeWidth={2.2} />
        </Close>
      </Head>
      <Body>
        <Block>
          <h3>Teléfono</h3>
          <span>{formatPhone(tenant.phone)}</span>
          {tenant.secondary_phone ? (
            <Muted>Otro teléfono: {formatPhone(tenant.secondary_phone)}</Muted>
          ) : null}
        </Block>
        <Block>
          <h3>Pagos atrasados</h3>
          <DebtLabel tenant={tenant} />
          {historical ? <Muted>Incluye pagos de contratos anteriores.</Muted> : null}
        </Block>
        <Block>
          <h3>Unidades que renta</h3>
          {tenant.current_contracts.length === 0 ? (
            <Muted>No renta ninguna unidad actualmente.</Muted>
          ) : (
            <Units>
              {tenant.current_contracts.map(contract => (
                <li key={contract.id}>
                  {placeName(contract.unit)}
                  <StatusBadge status={contract.status} compact />
                </li>
              ))}
            </Units>
          )}
        </Block>
      </Body>
      <Foot>
        <Button variant="neutral" disabled title="Disponible próximamente">
          Editar
        </Button>
        <DetailLink to={`/inquilinos/${tenant.id}`} state={FROM_LIST_STATE}>
          Ver detalle
        </DetailLink>
      </Foot>
    </Aside>
  );
}
