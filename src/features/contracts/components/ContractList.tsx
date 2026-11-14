import { Link } from 'react-router';
import styled, { css } from 'styled-components';
import type { Contract } from '@api/contracts';
import { ContractMark, FROM_LIST_STATE, Icon, StatusBadge } from '@components';
import { placeName } from '@lib/place';
import { contractDatesLine } from '../contractText';

const tenantName = (contract: Contract) =>
  `${contract.tenant.first_name} ${contract.tenant.last_name}`;
const placeOf = (contract: Contract) => placeName(contract.unit.name, contract.property);

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

const Stack = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Name = styled.span`
  font-size: 16px;
  line-height: 22px;
  font-weight: 700;
`;

const Aux = styled.span`
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Place = styled.span`
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

const Badges = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const Chevron = styled.span`
  display: flex;
  color: ${({ theme }) => theme.color.neutral600};
`;

/* ---------- Computadora: tabla ---------- */

const COLUMNS = 'minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr) 24px';

export const Table = styled.div`
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
  font-size: 15px;
  line-height: 22px;
`;

export function ContractTableHeader() {
  return (
    <HeaderRow aria-hidden="true">
      <span>Inquilino</span>
      <span>Unidad</span>
      <span>Estado</span>
      <span>Fechas del contrato</span>
      <span />
    </HeaderRow>
  );
}

function RowContent({ contract }: { contract: Contract }) {
  return (
    <>
      <Cell>
        <Name>{tenantName(contract)}</Name>
      </Cell>
      <Cell>{placeOf(contract)}</Cell>
      <Badges>
        <StatusBadge status={contract.status} compact />
        <ContractMark current={contract.is_current} />
      </Badges>
      <Aux>{contractDatesLine(contract)}</Aux>
      <Chevron>
        <Icon name="chevronRight" size={18} strokeWidth={2.4} />
      </Chevron>
    </>
  );
}

const detailLink = (contract: Contract) => ({
  to: `/contratos/${contract.id}`,
  state: FROM_LIST_STATE,
});

/** C-01 en celular. */
export function ContractCard({ contract }: { contract: Contract }) {
  return (
    <li>
      <Card {...detailLink(contract)}>
        <Stack>
          <Name>{tenantName(contract)}</Name>
          <Place>{placeOf(contract)}</Place>
          <Badges>
            <StatusBadge status={contract.status} compact />
            <ContractMark current={contract.is_current} />
          </Badges>
          <Aux>{contractDatesLine(contract)}</Aux>
        </Stack>
        <Chevron>
          <Icon name="chevronRight" size={18} strokeWidth={2.4} />
        </Chevron>
      </Card>
    </li>
  );
}

/** C-01 en tableta: la fila abre el detalle. */
export function ContractLinkRow({ contract }: { contract: Contract }) {
  return (
    <RowLink {...detailLink(contract)}>
      <RowContent contract={contract} />
    </RowLink>
  );
}

/** C-01 en computadora ancha: la fila abre la vista rápida (C-02). */
export function ContractSelectRow({
  contract,
  selected,
  onSelect,
}: {
  contract: Contract;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <RowButton
      type="button"
      data-contract-row={contract.id}
      $selected={selected}
      aria-pressed={selected}
      aria-label={`Contrato de ${tenantName(contract)}, ver vista rápida`}
      onClick={() => onSelect(contract.id)}
    >
      <RowContent contract={contract} />
    </RowButton>
  );
}
