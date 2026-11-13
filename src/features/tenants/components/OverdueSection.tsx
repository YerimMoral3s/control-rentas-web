import { Link } from 'react-router';
import {
  DetailSection,
  FROM_LIST_STATE,
  ListFooter,
  MutedText,
  Panel,
  SectionError,
  Skeleton,
} from '@components';
import styled from 'styled-components';
import type { Tenant } from '@api/tenants';
import { usePayments } from '@hooks/querys/payments';
import { formatMoney } from '@lib/format';
import { dueLabel, paymentConcept } from '@lib/paymentText';
import { theme as tokens } from '@styles/theme';
import { placeOf } from '../tenantText';

const Total = styled.div`
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.color.neutral200};

  span {
    font-size: 15px;
    font-weight: 600;
    color: ${({ theme }) => theme.color.neutral700};
  }

  strong {
    font-size: 24px;
    line-height: 30px;
    color: ${({ theme }) => theme.color.danger};
  }
`;

const Notes = styled.div`
  padding: 10px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  p {
    margin: 0;
    font-size: 13px;
    line-height: 18px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const Rows = styled.ul`
  margin: 0;
  padding: 8px;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Row = styled(Link)<{ $previous: boolean }>`
  padding: 10px 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 12px;
  align-items: center;
  border: 1px ${({ $previous }) => ($previous ? 'dashed' : 'solid')}
    ${({ $previous, theme }) => ($previous ? theme.color.neutral300 : theme.color.neutral200)};
  border-radius: ${({ theme }) => theme.radius.control};
  background: ${({ $previous, theme }) => ($previous ? theme.color.neutral50 : theme.color.white)};
  color: ${({ theme }) => theme.color.neutral950};
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.color.neutral100};
  }

  strong {
    font-size: 15px;
    line-height: 22px;
  }
`;

const Sub = styled.span`
  grid-column: 1;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Side = styled.span`
  grid-column: 2;
  grid-row: 1 / span 2;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  font-size: 16px;
  font-weight: 700;
`;

const Mark = styled.span<{ $previous: boolean }>`
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.pill};
  border: 1px ${({ $previous }) => ($previous ? 'dashed' : 'solid')}
    ${({ $previous, theme }) => ($previous ? theme.color.neutral400 : theme.color.infoBorder)};
  background: ${({ $previous, theme }) => ($previous ? theme.color.white : theme.color.infoBg)};
  color: ${({ $previous, theme }) => ($previous ? theme.color.neutral600 : theme.color.info)};
  font-size: 12px;
  line-height: 16px;
  font-weight: 700;
  white-space: nowrap;
`;

/**
 * Pagos atrasados (T-03): total y avisos con los datos del backend; las filas son los cobros
 * Vencidos del inquilino. Cada fila indica unidad y si es del contrato actual o de uno anterior.
 */
export function OverdueSection({ tenant }: { tenant: Tenant }) {
  const debt = tenant.overdue_debt;
  const hasDebt = Number(debt.amount) > 0;
  const payments = usePayments({ tenant_id: tenant.id, status: 'overdue' }, hasDebt);
  const currentIds = new Set(tenant.current_contracts.map(contract => contract.id));

  if (!hasDebt) {
    return (
      <DetailSection title="Pagos atrasados">
        <MutedText>Sin pagos atrasados.</MutedText>
      </DetailSection>
    );
  }

  const unitsWithDebt = new Set(debt.by_unit.map(item => item.unit.id));
  const unitsWithoutDebt = tenant.current_contracts.filter(
    contract => !unitsWithDebt.has(contract.unit.id),
  );

  return (
    <DetailSection title="Pagos atrasados">
      <Panel>
        <Total>
          <span>Total</span>
          <strong>{formatMoney(debt.amount)}</strong>
        </Total>
        {Number(debt.historical_amount) > 0 || unitsWithoutDebt.length > 0 ? (
          <Notes>
            {Number(debt.historical_amount) > 0 ? (
              <p>Incluye pagos de contratos anteriores.</p>
            ) : null}
            {unitsWithoutDebt.map(contract => (
              <p key={contract.id}>{contract.unit.name} no tiene pagos atrasados.</p>
            ))}
          </Notes>
        ) : null}
        {payments.isPending ? (
          <Rows aria-busy="true">
            <Skeleton as="li" $height="56px" $radius={tokens.radius.control} />
          </Rows>
        ) : payments.isError && !payments.data ? (
          <Rows as="div">
            <SectionError onRetry={() => void payments.refetch()} retrying={payments.isFetching} />
          </Rows>
        ) : (
          <>
            <Rows>
              {payments.items.map(payment => {
                const previous = !currentIds.has(payment.contract.id);
                return (
                  <li key={payment.id}>
                    <Row to={`/cobros/${payment.id}`} state={FROM_LIST_STATE} $previous={previous}>
                      <strong>{placeOf(payment)}</strong>
                      <Sub>
                        {paymentConcept(payment)} · {dueLabel(payment, debt.as_of_date)}
                      </Sub>
                      <Side>
                        {formatMoney(payment.amount)}
                        <Mark $previous={previous}>
                          {previous ? 'Contrato anterior' : 'Contrato actual'}
                        </Mark>
                      </Side>
                    </Row>
                  </li>
                );
              })}
            </Rows>
            {payments.hasNextPage || payments.isFetchNextPageError ? (
              <ListFooter
                query={payments}
                endLabel="No hay más pagos atrasados"
                errorLabel="No pudimos cargar más pagos atrasados"
                skeletonHeight="56px"
              />
            ) : null}
          </>
        )}
      </Panel>
    </DetailSection>
  );
}
