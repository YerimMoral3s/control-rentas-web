import { Link } from 'react-router';
import styled from 'styled-components';
import {
  Button,
  DetailSection,
  ListFooter,
  MutedText,
  Panel,
  SectionError,
  Skeleton,
  FROM_LIST_STATE,
} from '@components';
import { useExpenses } from '@hooks/querys/expenses';
import { formatDateWithYear } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { clampLines, theme as tokens } from '@styles/theme';
import { expenseTypeLabel } from '@lib/labels';

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

type ExpensesSectionProps = {
  /** Gastos directos de una unidad (o de una propiedad, sin los de sus unidades). */
  filters: { property_id?: string; unit_id?: string };
};

/** Gastos de una propiedad o unidad. Registrar gasto llega con su formulario (fase 7). */
export function ExpensesSection({ filters }: ExpensesSectionProps) {
  const query = useExpenses(filters);

  const action = (
    <Button variant="tertiary" icon="plus" disabled title="Disponible próximamente">
      Registrar gasto
    </Button>
  );

  return (
    <DetailSection title="Gastos" action={action}>
      {query.isPending ? (
        <Skeleton $height="64px" $radius={tokens.radius.card} />
      ) : query.isError && !query.data ? (
        <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
      ) : query.items.length === 0 ? (
        <MutedText>Aún no hay gastos registrados.</MutedText>
      ) : (
        <Panel>
          <Rows>
            {query.items.map(expense => (
              <li key={expense.id}>
                <Link to={`/gastos/${expense.id}`} state={FROM_LIST_STATE}>
                  <strong>{expense.description || expenseTypeLabel(expense.expense_type)}</strong>
                  <Sub>{formatDateWithYear(expense.expense_date)}</Sub>
                  <Amount>−{formatMoney(expense.amount)}</Amount>
                </Link>
              </li>
            ))}
          </Rows>
          {query.hasNextPage || query.isFetchNextPageError ? (
            <ListFooter
              query={query}
              endLabel="No hay más gastos"
              errorLabel="No pudimos cargar más gastos"
            />
          ) : null}
        </Panel>
      )}
    </DetailSection>
  );
}
