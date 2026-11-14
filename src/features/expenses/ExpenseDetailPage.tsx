import { Link, useParams } from 'react-router';
import styled from 'styled-components';
import type { Expense } from '@api/expenses';
import {
  ActionLink,
  Button,
  DetailSection,
  Icon,
  ReturnLink,
  SectionError,
  Skeleton,
  StateMessage,
} from '@components';
import { useExpense } from '@hooks/querys/expenses';
import { formatDateWithYear } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { expenseTypeLabel } from '@lib/labels';
import { placeName } from '@lib/place';
import { media, theme as tokens } from '@styles/theme';

const Page = styled.div`
  width: 100%;
  max-width: 760px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 6px;

  h1 {
    margin: 0;
    font-size: 28px;
    line-height: 34px;
  }

  span {
    font-size: 15px;
    line-height: 22px;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

const AmountBox = styled.div`
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};

  span {
    font-size: 15px;
    font-weight: 600;
    color: ${({ theme }) => theme.color.neutral700};
  }

  strong {
    font-size: 24px;
    line-height: 30px;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const Data = styled.dl`
  margin: 0;
  padding: 4px 16px;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.neutral200};
  border-radius: ${({ theme }) => theme.radius.card};

  div {
    padding: 10px 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    gap: 12px;
  }

  div + div {
    border-top: 1px solid ${({ theme }) => theme.color.neutral200};
  }

  dt {
    font-size: 15px;
    color: ${({ theme }) => theme.color.neutral600};
  }

  dd {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    text-align: right;

    ${media.desktop} {
      text-align: left;
    }
  }

  a {
    color: ${({ theme }) => theme.color.primary600};
  }
`;

const comingSoon = { disabled: true, title: 'Disponible próximamente' } as const;

/** Destino del gasto: una unidad o toda la propiedad (exactamente uno en un gasto ordinario). */
const target = (expense: Expense) =>
  expense.unit
    ? {
        label: 'Unidad',
        name: expense.unit.property
          ? placeName(expense.unit.name, expense.unit.property)
          : expense.unit.name,
        to: `/unidades/${expense.unit.id}`,
      }
    : expense.property
      ? {
          label: 'Propiedad',
          name: expense.property.name,
          to: `/propiedades/${expense.property.id}`,
        }
      : null;

/** E-03: detalle de gasto. Editar y eliminar llegan con la fase 7; la devolución de depósito, con la 6. */
export function ExpenseDetailPage() {
  const { expenseId } = useParams();
  const query = useExpense(expenseId);
  const back = <ReturnLink to="/movimientos" label="Movimientos" />;

  if (query.isPending) {
    return (
      <Page aria-busy="true">
        {back}
        <Skeleton $height="34px" $width="50%" />
        <Skeleton $height="120px" $radius={tokens.radius.card} />
      </Page>
    );
  }

  if (query.isError) {
    return (
      <Page>
        {back}
        {query.error.type === 'not_found' ? (
          <StateMessage
            kind="empty"
            title="No encontramos este gasto"
            description="Puede que se haya eliminado. Búscalo en Movimientos."
          />
        ) : (
          <SectionError onRetry={() => void query.refetch()} retrying={query.isFetching} />
        )}
      </Page>
    );
  }

  const expense = query.data.data;
  const category = expenseTypeLabel(expense.expense_type);
  const destination = target(expense);
  const refund = expense.expense_type === 'deposit_refund';
  // El título es siempre la categoría; la descripción, por larga que sea, se lee completa en Detalle.
  const description =
    expense.description && expense.description !== expense.expense_type
      ? expense.description
      : null;

  return (
    <Page>
      {back}
      <Header>
        <h1>{category}</h1>
        <span>Gasto{destination ? ` · ${destination.name}` : ''}</span>
      </Header>

      <AmountBox>
        <span>Importe</span>
        <strong>−{formatMoney(expense.amount)}</strong>
      </AmountBox>

      <Actions>
        {refund ? (
          <Button variant="secondary" {...comingSoon}>
            Editar importe
          </Button>
        ) : (
          <Button variant="secondary" {...comingSoon}>
            Editar gasto
          </Button>
        )}
        <Button variant="neutral" {...comingSoon} aria-label="Más acciones">
          <Icon name="more" size={20} />
        </Button>
        {expense.deposit_payment ? (
          <ActionLink to={`/cobros/${expense.deposit_payment.id}`}>Ver depósito</ActionLink>
        ) : null}
      </Actions>

      <DetailSection title="Detalle">
        <Data>
          {description ? (
            <div>
              <dt>Descripción</dt>
              <dd>{description}</dd>
            </div>
          ) : null}
          <div>
            <dt>Categoría</dt>
            <dd>{category}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{formatDateWithYear(expense.expense_date)}</dd>
          </div>
          {destination ? (
            <>
              <div>
                <dt>Registrado en</dt>
                <dd>
                  <Link to={destination.to}>{destination.name}</Link>
                </dd>
              </div>
              <div>
                <dt>Destino</dt>
                <dd>{destination.label}</dd>
              </div>
            </>
          ) : null}
          {expense.related_contract_id ? (
            <div>
              <dt>Contrato relacionado</dt>
              <dd>
                <Link to={`/contratos/${expense.related_contract_id}`}>Ver contrato</Link>
              </dd>
            </div>
          ) : null}
        </Data>
      </DetailSection>
    </Page>
  );
}
