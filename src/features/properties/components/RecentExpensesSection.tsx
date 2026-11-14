import { Link } from 'react-router';
import styled from 'styled-components';
import {
  Button,
  DetailSection,
  MutedText,
  Panel,
  SectionError,
  Skeleton,
  FROM_LIST_STATE,
} from '@components';
import { useRecentMovements } from '@hooks/querys/movements';
import { formatDateWithYear } from '@lib/dates';
import { formatSignedMoney } from '@lib/format';
import { clampLines, theme as tokens } from '@styles/theme';

const RECENT_SIZE = 5;

const Rows = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;

  li > a {
    padding: 12px 16px;
    display: grid;
    color: ${({ theme }) => theme.color.neutral950};
    text-decoration: none;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 2px 12px;
    align-items: center;
  }

  li > a:hover {
    background: ${({ theme }) => theme.color.neutral50};
  }

  li + li {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }

  strong {
    font-size: 15px;
    line-height: 22px;
    ${clampLines(2)}
  }
`;

const Sub = styled.span`
  grid-column: 1;
  font-size: 13px;
  line-height: 18px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Amount = styled.span`
  grid-column: 2;
  grid-row: 1 / span 2;
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
`;

/**
 * Gastos recientes de un edificio, plaza o mixta (P-03): los de la propiedad y los de sus unidades.
 * `GET /movements?kind=expense&property_id` incluye ambos (FE-19); `/expenses?property_id` solo los directos.
 */
export function RecentExpensesSection({ propertyId }: { propertyId: string }) {
  const query = useRecentMovements({ kind: 'expense', property_id: propertyId }, RECENT_SIZE);

  const action = (
    <Button variant="tertiary" icon="plus" disabled title="Disponible próximamente">
      Registrar gasto
    </Button>
  );

  return (
    <DetailSection title="Gastos recientes" action={action}>
      {query.isPending ? (
        <Skeleton $height="64px" $radius={tokens.radius.card} />
      ) : query.isError ? (
        <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
      ) : query.data.data.length === 0 ? (
        <MutedText>Aún no hay gastos registrados.</MutedText>
      ) : (
        <Panel>
          <Rows>
            {query.data.data.map(movement => (
              <li key={`${movement.source.type}-${movement.source.id}`}>
                <Link to={`/gastos/${movement.source.id}`} state={FROM_LIST_STATE}>
                  <strong>{movement.concept}</strong>
                  <Sub>
                    {movement.unit?.name ?? movement.property?.name ?? ''} ·{' '}
                    {formatDateWithYear(movement.date)}
                  </Sub>
                  <Amount>{formatSignedMoney(movement.amount)}</Amount>
                </Link>
              </li>
            ))}
          </Rows>
        </Panel>
      )}
    </DetailSection>
  );
}
