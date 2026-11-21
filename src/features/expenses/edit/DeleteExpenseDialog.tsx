import { useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { isAppError } from '@api/errors';
import type { Expense } from '@api/expenses';
import { Button, ButtonLink, Dialog, DialogActions, Notice } from '@components';
import { useDeactivateExpense } from '@hooks/querys/expenses';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatDateWithYear, monthName } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { expenseTypeLabel } from '@lib/labels';
import { withResult } from '@lib/useResultNotice';

const Text = styled.p`
  margin: 0 0 8px;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

const List = styled.ul`
  margin: 0 0 12px;
  padding-left: 20px;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

type Failure = {
  tone: 'error' | 'uncertain' | 'warning';
  title: string;
  body: string;
  requestId?: string;
};

/** E-05 Eliminar gasto (sin motivo): deja de contar; su historial se conserva. */
export function DeleteExpenseDialog({
  expense,
  place,
  open,
  onClose,
}: {
  expense: Expense;
  place: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const deactivate = useDeactivateExpense();
  const [failure, setFailure] = useState<Failure | null>(null);
  const title = expense.description || expenseTypeLabel(expense.expense_type);
  const month = monthName(
    Number(expense.expense_date.slice(0, 4)),
    Number(expense.expense_date.slice(5, 7)),
  );

  const close = () => {
    setFailure(null);
    onClose();
  };

  const confirm = () => {
    setFailure(null);
    deactivate.mutate(expense.id, {
      onSuccess: () => {
        onClose();
        // El gasto eliminado ya no tiene detalle operativo: se vuelve a Movimientos.
        void navigate('/movimientos', {
          replace: true,
          state: withResult({
            title: 'Gasto eliminado',
            body: `${title} ya no aparece en Movimientos ni cuenta en el resumen de ${month}.`,
          }),
        });
        void events.expenseChanged();
      },
      onError: error => {
        const requestId = isAppError(error) ? error.requestId : undefined;
        if (isAppError(error) && error.code === 'EXPENSE_INACTIVE') {
          setFailure({
            tone: 'warning',
            title: 'Este gasto ya se eliminó',
            body: 'No hicimos cambios. Revisa Movimientos.',
            requestId,
          });
          void events.expenseChanged();
          return;
        }
        const uncertain = isAppError(error) && error.type === 'uncertain';
        setFailure({
          tone: uncertain ? 'uncertain' : 'error',
          title: uncertain ? 'No sabemos si se eliminó el gasto' : 'No pudimos eliminar el gasto',
          body: uncertain
            ? 'Revisa Movimientos antes de volver a intentarlo.'
            : 'No cambió nada. Inténtalo de nuevo.',
          requestId,
        });
      },
    });
  };

  return (
    <Dialog
      open={open}
      title={`¿Eliminar el gasto ${title}?`}
      onClose={close}
      busy={deactivate.isPending}
    >
      <Text>
        <strong>
          −{formatMoney(expense.amount)} · {expenseTypeLabel(expense.expense_type)}
        </strong>
        <br />
        {place ? `${place} · ` : ''}
        {formatDateWithYear(expense.expense_date)}
      </Text>
      <List>
        <li>Dejará de aparecer en Movimientos.</li>
        <li>Dejará de contar en el resumen de {month}.</li>
        <li>Se conservará en el historial.</li>
        <li>No significa que el dinero haya regresado.</li>
      </List>
      {failure ? (
        <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
          {failure.body}
        </Notice>
      ) : null}
      <DialogActions>
        {failure && failure.tone !== 'error' ? (
          <ButtonLink to="/movimientos">Ver Movimientos</ButtonLink>
        ) : (
          <Button variant="danger" onClick={confirm} loading={deactivate.isPending}>
            {failure ? 'Intentar de nuevo' : 'Eliminar gasto'}
          </Button>
        )}
        <Button
          variant="secondary"
          onClick={close}
          disabled={deactivate.isPending}
          data-initial-focus
        >
          Volver
        </Button>
      </DialogActions>
    </Dialog>
  );
}
