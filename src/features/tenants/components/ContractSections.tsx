import styled from 'styled-components';
import {
  ActionLink,
  DetailSection,
  ListFooter,
  MutedText,
  Panel,
  SectionError,
  Skeleton,
  StatusBadge,
} from '@components';
import { useContracts } from '@hooks/querys/contracts';
import { formatDateRange } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { theme as tokens } from '@styles/theme';
import { contractTypeLabel, placeOf } from '../tenantText';

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
`;

const Card = styled(Panel)`
  padding: 14px 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Top = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;

  strong {
    font-size: 16px;
    line-height: 22px;
  }
`;

const Line = styled.span`
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

const Warning = styled.span`
  font-size: 13px;
  line-height: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.color.warning};
`;

const Links = styled.div`
  display: flex;
  gap: 4px;
  margin: 4px -10px 0;
`;

const HistoryRow = styled.li`
  padding: 12px 16px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px 12px;
  align-items: center;
  border: 1px dashed ${({ theme }) => theme.color.neutral300};
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.neutral50};

  strong {
    font-size: 15px;
    line-height: 22px;
  }

  > span:last-child {
    grid-column: 2;
    grid-row: 1 / span 2;
  }
`;

function Loading() {
  return (
    <List aria-busy="true">
      <Skeleton as="li" $height="132px" $radius={tokens.radius.card} />
    </List>
  );
}

/** Unidades que renta (T-03 / T-04): cada ocupación actual con su contrato, estado y renta. */
type SectionProps = {
  tenantId: string;
};

export function CurrentUnitsSection({ tenantId, count }: SectionProps & { count: number }) {
  const query = useContracts({ tenant_id: tenantId, is_current: true }, count > 0);
  if (count === 0) return null;

  return (
    <DetailSection title="Unidades que renta" count={count > 1 ? count : undefined}>
      {query.isPending ? (
        <Loading />
      ) : query.isError && !query.data ? (
        <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
      ) : (
        <List>
          {query.items.map(contract => (
            <Card as="li" key={contract.id}>
              <Top>
                <strong>{placeOf(contract)}</strong>
                <StatusBadge status={contract.status} compact />
              </Top>
              <Line>
                {contractTypeLabel(contract.contract_type)} ·{' '}
                {formatDateRange(contract.start_date, contract.end_date)}
              </Line>
              <Line>
                Renta {formatMoney(contract.rent_amount)} al mes · paga el día{' '}
                {contract.fixed_due_day}
              </Line>
              {contract.status === 'expired' ? (
                <Warning>El contrato venció, pero sigue rentando {contract.unit.name}.</Warning>
              ) : null}
              <Links>
                <ActionLink to={`/contratos/${contract.id}`}>Ver contrato</ActionLink>
                <ActionLink to={`/unidades/${contract.unit.id}`}>Ver unidad</ActionLink>
              </Links>
            </Card>
          ))}
        </List>
      )}
    </DetailSection>
  );
}

/** Historial (T-03 / T-05): contratos que ya no son ocupación actual. */
export function HistorySection({ tenantId }: SectionProps) {
  const query = useContracts({ tenant_id: tenantId, is_current: false });

  return (
    <DetailSection title="Historial">
      {query.isPending ? (
        <Loading />
      ) : query.isError && !query.data ? (
        <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
      ) : query.items.length === 0 ? (
        <MutedText>Aún no tiene contratos anteriores.</MutedText>
      ) : (
        <>
          <List>
            {query.items.map(contract => (
              <HistoryRow key={contract.id}>
                <strong>{placeOf(contract)}</strong>
                <Line>
                  {contractTypeLabel(contract.contract_type)} ·{' '}
                  {formatDateRange(contract.start_date, contract.end_date)}
                </Line>
                <span>
                  <StatusBadge status={contract.status} compact />
                </span>
              </HistoryRow>
            ))}
          </List>
          {query.hasNextPage || query.isFetchNextPageError ? (
            <ListFooter
              query={query}
              endLabel="No hay más contratos"
              errorLabel="No pudimos cargar más contratos"
            />
          ) : null}
        </>
      )}
    </DetailSection>
  );
}
