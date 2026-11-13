import { Link } from 'react-router';
import styled from 'styled-components';
import type { Contract } from '@api/contracts';
import { SectionError, Skeleton, StatusBadge } from '@components';
import { useContractPaymentsSummary } from '@hooks/querys/payments';
import { formatDateWithYear, formatShortDate } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { paymentConcept } from '@lib/paymentText';
import { media, theme as tokens } from '@styles/theme';

const Grid = styled.div<{ $compact: boolean }>`
  display: grid;
  gap: 12px;

  ${({ $compact }) =>
    $compact
      ? ''
      : `
    ${media.desktop} {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  `}
`;

const Box = styled.div`
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};
`;

const Label = styled.span`
  font-size: 13px;
  line-height: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Amount = styled.span<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 24px;
  line-height: 30px;
  font-weight: 700;
  color: ${({ $danger, theme }) => ($danger ? theme.color.danger : theme.color.neutral950)};
`;

const Note = styled.span`
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral600};

  a {
    color: ${({ theme }) => theme.color.primary600};
    font-weight: 600;
  }
`;

/** Depósito propio o heredado de un contrato anterior; la devolución se muestra aparte. */
function DepositBox({ contract }: { contract: Contract }) {
  const deposit = contract.deposit;
  if (!deposit) {
    return (
      <Box>
        <Label>Depósito</Label>
        <Amount>—</Amount>
        <Note>Este contrato no tiene depósito.</Note>
      </Box>
    );
  }
  const inherited = deposit.origin_contract.id !== contract.id;
  return (
    <Box>
      <Label>{inherited ? 'Depósito del contrato anterior' : 'Depósito'}</Label>
      <Amount>
        {formatMoney(deposit.amount)}
        {deposit.status !== 'pending' ? <StatusBadge status={deposit.status} compact /> : null}
      </Amount>
      {inherited ? <Note>Se conserva del contrato anterior. No se cobra de nuevo.</Note> : null}
      {deposit.refund ? (
        <Note>
          Se devolvieron {formatMoney(deposit.refund.amount)} el{' '}
          {formatDateWithYear(deposit.refund.expense_date)}.
        </Note>
      ) : deposit.status === 'paid' ? (
        <Note>Aún no se ha devuelto.</Note>
      ) : null}
      {inherited ? (
        <Note>
          <Link to={`/contratos/${deposit.origin_contract.id}`}>Ver contrato de origen</Link>
        </Note>
      ) : null}
    </Box>
  );
}

/**
 * Resumen del contrato (C-02, C-03 a C-06): Pagos atrasados y Próximo pago del backend
 * (`/payments/contract-summary`, conjunto completo) y el depósito del contrato.
 */
export function ContractSummaryBlocks({
  contract,
  compact = false,
}: {
  contract: Contract;
  compact?: boolean;
}) {
  const query = useContractPaymentsSummary(contract.id);
  const summary = query.data?.data;

  return (
    <Grid $compact={compact}>
      {query.isPending ? (
        <>
          <Skeleton $height="96px" $radius={tokens.radius.card} />
          <Skeleton $height="96px" $radius={tokens.radius.card} />
        </>
      ) : query.isError || !summary ? (
        <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
      ) : (
        <>
          <Box>
            <Label>Pagos atrasados</Label>
            <Amount $danger={Number(summary.overdue_debt.amount) > 0}>
              {formatMoney(summary.overdue_debt.amount)}
            </Amount>
            <Note>
              {summary.overdue_debt.payment_count === 0
                ? 'Sin pagos atrasados'
                : `${summary.overdue_debt.payment_count} ${summary.overdue_debt.payment_count === 1 ? 'cobro' : 'cobros'}`}
            </Note>
          </Box>
          <Box>
            <Label>Próximo pago</Label>
            {summary.next_payment ? (
              <>
                <Amount>{formatMoney(summary.next_payment.amount)}</Amount>
                <Note>
                  {paymentConcept(summary.next_payment)} · vence el{' '}
                  {formatShortDate(summary.next_payment.due_date)}
                </Note>
              </>
            ) : (
              <>
                <Amount>—</Amount>
                <Note>No hay próximos pagos</Note>
              </>
            )}
          </Box>
        </>
      )}
      <DepositBox contract={contract} />
    </Grid>
  );
}
