import { useState } from 'react';
import styled from 'styled-components';
import type { Contract } from '@api/contracts';
import type { PaymentListParams } from '@api/payments';
import {
  ActionLink,
  Button,
  ContractMark,
  DetailSection,
  FilterChips,
  FROM_LIST_STATE,
  ListFooter,
  MutedText,
  Panel,
  SectionError,
  Skeleton,
  StatusBadge,
} from '@components';
import { useContractPaymentsSummary, usePayments } from '@hooks/querys/payments';
import { formatMoney } from '@lib/format';
import { paymentTitle } from '@lib/paymentText';
import { media, theme as tokens } from '@styles/theme';
import { paymentDateLine } from '../contractText';

type Chip = 'all' | 'unpaid' | 'paid' | 'cancelled';

const CHIPS: ReadonlyArray<{ value: Chip; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'unpaid', label: 'Por pagar' },
  { value: 'paid', label: 'Pagados' },
  { value: 'cancelled', label: 'Cancelados' },
];

const Rows = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;

  > li + li {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }
`;

const Row = styled.li`
  padding: 12px 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    'concept amount'
    'date status'
    'actions actions';
  gap: 4px 12px;
  align-items: center;

  ${media.desktop} {
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) 140px 110px minmax(0, 1.2fr);
    grid-template-areas: 'concept date status amount actions';
  }
`;

const Concept = styled.span`
  grid-area: concept;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 15px;
  line-height: 22px;
  font-weight: 700;
`;

const DateLine = styled.span`
  grid-area: date;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Status = styled.span`
  grid-area: status;
  justify-self: end;

  ${media.desktop} {
    justify-self: start;
  }
`;

const Amount = styled.span`
  grid-area: amount;
  justify-self: end;
  font-size: 16px;
  font-weight: 700;
`;

const Actions = styled.span`
  grid-area: actions;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  margin-right: -10px;

  /* Petición del usuario (13 nov.): Registrar pago de la lista a 33 px para no alargar la fila. */
  button {
    height: 33px;
    min-height: 33px;
  }
`;

const ChipsWrap = styled.div`
  margin-bottom: 4px;
`;

/** Lista de cobros del contrato (C-03 a C-06) con chips y conteos completos del backend. */
export function ContractPayments({ contract }: { contract: Contract }) {
  const [chip, setChip] = useState<Chip>('all');
  const summary = useContractPaymentsSummary(contract.id);
  const counts = summary.data?.data.counts;
  const today = summary.data?.data.as_of_date;
  const status: PaymentListParams['status'] = chip;
  const query = usePayments({ contract_id: contract.id, status });
  const chipLabel = CHIPS.find(item => item.value === chip)?.label ?? 'Todos';

  return (
    <DetailSection title="Cobros">
      <ChipsWrap>
        <FilterChips
          label="Filtrar cobros del contrato"
          value={chip}
          onChange={setChip}
          options={CHIPS.map(item => ({ ...item, count: counts?.[item.value] }))}
        />
      </ChipsWrap>
      {query.isPending ? (
        <Skeleton $height="168px" $radius={tokens.radius.card} />
      ) : query.isError && !query.data ? (
        <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
      ) : query.items.length === 0 ? (
        <MutedText>No hay cobros en {chipLabel}.</MutedText>
      ) : (
        <Panel aria-busy={query.isPlaceholderData || undefined}>
          <Rows>
            {query.items.map(payment => {
              const unpaid = payment.status === 'pending' || payment.status === 'overdue';
              // Rentas de un contrato anterior que cubren meses de esta vigencia conservan su origen.
              const fromPrevious = payment.contract.id !== contract.id;
              return (
                <Row key={payment.id}>
                  <Concept>
                    {paymentTitle(payment)}
                    {fromPrevious ? <ContractMark current={false} /> : null}
                  </Concept>
                  <DateLine>{paymentDateLine(payment, today)}</DateLine>
                  <Status>
                    <StatusBadge status={payment.status} compact />
                  </Status>
                  <Amount>{formatMoney(payment.amount)}</Amount>
                  <Actions>
                    {unpaid ? (
                      <Button variant="secondary" disabled title="Disponible próximamente">
                        Registrar pago
                      </Button>
                    ) : null}
                    <ActionLink to={`/cobros/${payment.id}`} state={FROM_LIST_STATE}>
                      Ver cobro
                    </ActionLink>
                  </Actions>
                </Row>
              );
            })}
          </Rows>
          <ListFooter
            query={query}
            endLabel="No hay más cobros"
            errorLabel="No pudimos cargar más cobros"
          />
        </Panel>
      )}
    </DetailSection>
  );
}
