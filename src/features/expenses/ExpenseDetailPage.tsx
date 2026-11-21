import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';
import type { Expense } from '@api/expenses';
import {
  ActionLink,
  ActionMenu,
  Button,
  DetailSection,
  Icon,
  Notice,
  ReturnLink,
  SectionError,
  Skeleton,
  StateMessage,
} from '@components';
import { useExpense } from '@hooks/querys/expenses';
import { usePayment } from '@hooks/querys/payments';
import { withResult, useResultNotice, type ResultMessage } from '@lib/useResultNotice';
import { DeleteRefundDialog, EditRefundDialog } from '@features/payments/deposits/RefundDialogs';
import { formatDateWithYear } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { expenseTypeLabel } from '@lib/labels';
import { placeName } from '@lib/place';
import { media, theme as tokens, pageTitle } from '@styles/theme';

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
    ${pageTitle}
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
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<'edit' | 'delete' | null>(null);
  const { result, dismiss } = useResultNotice();
  // Límite de la devolución: el depósito recibido.
  const deposit = usePayment(query.data?.data.deposit_payment?.id);
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

      {result ? (
        <Notice tone="success" title={result.title} onClose={dismiss}>
          {result.body}
        </Notice>
      ) : null}

      <Actions>
        {refund ? (
          <>
            <Button variant="secondary" onClick={() => setDialog('edit')}>
              Editar importe
            </Button>
            <ActionMenu
              items={[
                {
                  label: 'Eliminar devolución',
                  danger: true,
                  onSelect: () => setDialog('delete'),
                },
              ]}
            />
          </>
        ) : (
          <>
            {/* Editar y eliminar gastos llegan con la fase 7. */}
            <Button variant="secondary" {...comingSoon}>
              Editar gasto
            </Button>
            <Button variant="neutral" {...comingSoon} aria-label="Más acciones">
              <Icon name="more" size={20} />
            </Button>
          </>
        )}
        {expense.deposit_payment ? (
          <ActionLink to={`/cobros/${expense.deposit_payment.id}`}>Ver depósito</ActionLink>
        ) : null}
      </Actions>

      {refund ? (
        <>
          <EditRefundDialog
            refund={expense}
            depositAmount={deposit.data?.data.amount ?? null}
            open={dialog === 'edit'}
            onClose={() => setDialog(null)}
            onDone={(message: ResultMessage) =>
              void navigate('.', { replace: true, state: withResult(message) })
            }
          />
          <DeleteRefundDialog
            refund={expense}
            depositAmount={deposit.data?.data.amount ?? null}
            open={dialog === 'delete'}
            onClose={() => setDialog(null)}
            onDone={(message: ResultMessage) =>
              // La devolución eliminada ya no se consulta aquí: se vuelve al contrato.
              void navigate(
                expense.related_contract_id ? `/contratos/${expense.related_contract_id}` : '/',
                { replace: true, state: withResult(message) },
              )
            }
          />
        </>
      ) : null}

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
