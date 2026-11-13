import { Link } from 'react-router';
import styled from 'styled-components';
import type { Contract } from '@api/contracts';
import type { Unit } from '@api/units';
import { FROM_LIST_STATE, Icon, StatusBadge } from '@components';
import { fullName } from '@features/tenants/tenantText';

export const UnitRows = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;

  li + li {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }
`;

const Row = styled(Link)`
  min-height: 64px;
  padding: 10px 12px 10px 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 18px;
  grid-template-areas:
    'name badge chevron'
    'sub badge chevron';
  gap: 2px 12px;
  align-items: center;
  color: ${({ theme }) => theme.color.neutral950};
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.color.neutral50};
  }

  strong {
    grid-area: name;
    font-size: 16px;
    line-height: 22px;
  }
`;

const BadgeCell = styled.span`
  grid-area: badge;
`;

const Chevron = styled.span`
  grid-area: chevron;
  display: flex;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Sub = styled.span`
  grid-area: sub;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral600};
`;

/** Segunda línea de la unidad: quién la renta, "Sin inquilino" o el motivo del mantenimiento. */
const unitDetail = (unit: Unit, contract: Contract | undefined) => {
  if (unit.reviewed_at === null) return 'Falta revisar';
  if (unit.current_contract) {
    if (!contract) return '';
    return contract.status === 'expired'
      ? `${fullName(contract.tenant)} · contrato Vencido`
      : fullName(contract.tenant);
  }
  if (unit.status === 'maintenance') return unit.description ?? '';
  return 'Sin inquilino';
};

type UnitRowProps = {
  unit: Unit;
  /** Contrato actual de la unidad (de la lista de contratos actuales de la propiedad). */
  contract: Contract | undefined;
};

export function UnitRow({ unit, contract }: UnitRowProps) {
  const detail = unitDetail(unit, contract);
  return (
    <li>
      <Row to={`/unidades/${unit.id}`} state={FROM_LIST_STATE}>
        <strong>{unit.name}</strong>
        <BadgeCell>
          {unit.status === 'inactive' ? null : <StatusBadge status={unit.status} compact />}
        </BadgeCell>
        <Chevron>
          <Icon name="chevronRight" size={18} strokeWidth={2.4} />
        </Chevron>
        {detail ? <Sub>{detail}</Sub> : null}
      </Row>
    </li>
  );
}
