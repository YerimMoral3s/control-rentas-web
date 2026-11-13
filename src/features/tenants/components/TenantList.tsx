import { Link } from 'react-router';
import styled, { css } from 'styled-components';
import type { Tenant } from '@api/tenants';
import { FROM_LIST_STATE, Icon } from '@components';
import { formatPhone } from '@lib/format';
import { fullName, occupationSummary } from '../tenantText';
import { DebtLabel } from './DebtLabel';

/* ---------- Celular: tarjetas ---------- */

export const Cards = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Card = styled(Link)`
  padding: 14px 12px 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
  color: ${({ theme }) => theme.color.neutral950};
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.color.neutral50};
  }
`;

const CardText = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const Name = styled.span`
  font-size: 16px;
  line-height: 22px;
  font-weight: 700;
`;

const Occupation = styled.span<{ $none: boolean }>`
  font-size: 15px;
  line-height: 22px;
  font-weight: ${({ $none }) => ($none ? 400 : 600)};
  color: ${({ $none, theme }) => ($none ? theme.color.neutral600 : theme.color.neutral950)};
`;

const Aux = styled.span`
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Chevron = styled.span`
  display: flex;
  color: ${({ theme }) => theme.color.neutral600};
`;

/* ---------- Computadora: tabla ---------- */

const COLUMNS = 'minmax(0, 1fr) minmax(0, 1.4fr) 170px 24px';

export const Table = styled.div`
  flex: 1;
  min-width: 0;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
  overflow: hidden;
`;

const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: ${COLUMNS};
  gap: 16px;
  padding: 12px 20px;
  background: ${({ theme }) => theme.color.neutral50};
  border-bottom: 1px solid ${({ theme }) => theme.color.neutral200};
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.neutral600};
`;

const rowStyle = css<{ $selected?: boolean }>`
  width: 100%;
  min-height: 64px;
  padding: 10px 20px;
  display: grid;
  grid-template-columns: ${COLUMNS};
  gap: 16px;
  align-items: center;
  border: 0;
  border-bottom: 1px solid ${({ theme }) => theme.color.neutral200};
  background: ${({ $selected, theme }) => ($selected ? theme.color.primary50 : 'transparent')};
  box-shadow: ${({ $selected, theme }) => ($selected ? `inset 3px 0 0 ${theme.color.primary600}` : 'none')};
  font: inherit;
  color: ${({ theme }) => theme.color.neutral950};
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background ${({ theme }) => theme.motion.control} ${({ theme }) => theme.motion.enter};

  &:hover {
    background: ${({ $selected, theme }) => ($selected ? theme.color.primary50 : theme.color.neutral50)};
  }
`;

const RowLink = styled(Link)<{ $selected?: boolean }>`
  ${rowStyle}
`;

const RowButton = styled.button<{ $selected: boolean }>`
  ${rowStyle}
`;

const Cell = styled.span`
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

export function TenantTableHeader() {
  return (
    <HeaderRow aria-hidden="true">
      <span>Inquilino</span>
      <span>Unidades que renta</span>
      <span>Pagos atrasados</span>
      <span />
    </HeaderRow>
  );
}

/** Enlace al detalle que recuerda la búsqueda para volver a la misma lista. */
const detailLink = (tenant: Tenant) => ({ to: `/inquilinos/${tenant.id}`, state: FROM_LIST_STATE });

function RowContent({ tenant }: { tenant: Tenant }) {
  const occupation = occupationSummary(tenant);
  return (
    <>
      <Cell>
        <Name>{fullName(tenant)}</Name>
        <Aux>{formatPhone(tenant.phone)}</Aux>
      </Cell>
      <Cell>
        <Occupation $none={tenant.current_contracts.length === 0}>{occupation.title}</Occupation>
        {occupation.detail ? <Aux>{occupation.detail}</Aux> : null}
      </Cell>
      <span>
        <DebtLabel tenant={tenant} />
      </span>
      <Chevron>
        <Icon name="chevronRight" size={18} strokeWidth={2.4} />
      </Chevron>
    </>
  );
}

/** T-01 en celular: la tarjeta abre el detalle a pantalla completa. */
export function TenantCard({ tenant }: { tenant: Tenant }) {
  const link = detailLink(tenant);
  const occupation = occupationSummary(tenant);
  return (
    <li>
      <Card {...link}>
        <CardText>
          <Name>{fullName(tenant)}</Name>
          <Occupation $none={tenant.current_contracts.length === 0}>
            {occupation.title}
            {occupation.detail ? ` · ${occupation.detail}` : ''}
          </Occupation>
          <Aux>{formatPhone(tenant.phone)}</Aux>
          <DebtLabel tenant={tenant} small />
        </CardText>
        <Chevron>
          <Icon name="chevronRight" size={18} strokeWidth={2.4} />
        </Chevron>
      </Card>
    </li>
  );
}

/** T-01 en tableta: la fila abre el detalle. */
export function TenantLinkRow({ tenant }: { tenant: Tenant }) {
  const link = detailLink(tenant);
  return (
    <RowLink {...link}>
      <RowContent tenant={tenant} />
    </RowLink>
  );
}

type TenantSelectRowProps = {
  tenant: Tenant;
  selected: boolean;
  onSelect: (tenantId: string) => void;
};

/** T-01 en computadora ancha: la fila abre la vista rápida (T-02). */
export function TenantSelectRow({ tenant, selected, onSelect }: TenantSelectRowProps) {
  return (
    <RowButton
      type="button"
      data-tenant-row={tenant.id}
      $selected={selected}
      aria-pressed={selected}
      aria-label={`${fullName(tenant)}, ver vista rápida`}
      onClick={() => onSelect(tenant.id)}
    >
      <RowContent tenant={tenant} />
    </RowButton>
  );
}
