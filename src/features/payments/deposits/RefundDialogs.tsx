import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { Expense } from '@api/expenses';
import { isAppError } from '@api/errors';
import { Button, Dialog, DialogActions, Notice, TextField } from '@components';
import { toAmount } from '@features/contracts/form/ContractFields';
import { useDeactivateExpense, useUpdateRefundAmount } from '@hooks/querys/expenses';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatDateWithYear } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { applyFieldErrors } from '@lib/formErrors';
import { formatMoneyInput } from '@lib/numericInput';
import type { ResultMessage } from '@lib/useResultNotice';
import { Facts, Fields, List } from '../actions/actionStyles';

type Failure = {
  tone: 'error' | 'uncertain' | 'warning';
  title: string;
  body: string;
  requestId?: string;
};

type RefundDialogProps = {
  refund: Expense;
  /** Importe del depósito recibido (límite de la devolución); null mientras carga. */
  depositAmount: string | null;
  open: boolean;
  onClose: () => void;
  onDone: (result: ResultMessage) => void;
};

/** Textos propios por código; nunca el mensaje del backend. */
const CODE_FAILURES: Record<string, Omit<Failure, 'requestId'>> = {
  EXPENSE_INACTIVE: {
    tone: 'warning',
    title: 'Esta devolución ya se eliminó',
    body: 'No guardamos nada. Revisa el depósito en el contrato.',
  },
  DEPOSIT_NOT_PAID: {
    tone: 'warning',
    title: 'El depósito ya no está Pagado',
    body: 'No guardamos nada. Revisa el depósito en el contrato.',
  },
  DEPOSIT_REFUND_AMOUNT_EXCEEDED: {
    tone: 'error',
    title: 'El importe es mayor que el depósito',
    body: 'La devolución no puede ser mayor que el depósito recibido.',
  },
};

const failureOf = (error: unknown, notSaved: string, uncertain: string): Failure => {
  const requestId = isAppError(error) ? error.requestId : undefined;
  const known = isAppError(error) ? CODE_FAILURES[error.code] : undefined;
  if (known) return { ...known, requestId };
  if (isAppError(error) && error.type === 'uncertain')
    return {
      tone: 'uncertain',
      title: uncertain,
      body: 'Antes de volver a intentarlo, revisa el depósito en el contrato.',
      requestId,
    };
  return {
    tone: 'error',
    title: notSaved,
    body: 'Revisa tu conexión e inténtalo de nuevo.',
    requestId,
  };
};

/** Y-17 Editar devolución: solo el importe; la revisión del cambio está en el mismo diálogo. */
export function EditRefundDialog({
  refund,
  depositAmount,
  open,
  onClose,
  onDone,
}: RefundDialogProps) {
  const events = useInvalidateEvents();
  const update = useUpdateRefundAmount();
  const [failure, setFailure] = useState<Failure | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    control,
    reset,
    formState: { errors },
  } = useForm<{ amount: string }>({ defaultValues: { amount: formatMoneyInput(refund.amount) } });
  const amount = toAmount(useWatch({ control, name: 'amount' }));
  const changed = amount > 0 && amount !== Number(refund.amount);

  const close = () => {
    setFailure(null);
    reset({ amount: formatMoneyInput(refund.amount) });
    onClose();
  };

  const save = handleSubmit(values => {
    setFailure(null);
    update.mutate(
      { expenseId: refund.id, amount: toAmount(values.amount) },
      {
        onSuccess: ({ data }) => {
          setFailure(null);
          onClose();
          onDone({
            title: 'Devolución corregida',
            body: `Ahora es de ${formatMoney(data.amount)}. Cambiaron Movimientos y el resumen del mes; el depósito y el contrato no cambian.`,
          });
          void events.depositRefundChanged();
        },
        onError: error => {
          if (applyFieldErrors(error, setError, { amount: 'Revisa el importe devuelto.' })) return;
          const result = failureOf(
            error,
            'No pudimos guardar el importe',
            'No sabemos si se guardó el importe',
          );
          setFailure(result);
          if (result.tone !== 'error') void events.depositRefundChanged();
        },
      },
    );
  });

  return (
    <Dialog open={open} title="Editar devolución" onClose={close} busy={update.isPending}>
      <Fields>
        <TextField
          label="Importe devuelto"
          format="money"
          prefix="$"
          autoComplete="off"
          help={`Antes: ${formatMoney(refund.amount)}.${depositAmount ? ` No puede ser mayor a ${formatMoney(depositAmount)}.` : ''}`}
          disabled={update.isPending}
          error={errors.amount?.message}
          {...register('amount', {
            validate: value => {
              const next = toAmount(value);
              if (next <= 0) return 'Escribe un importe mayor a cero.';
              if (depositAmount && next > Number(depositAmount))
                return `No puede ser mayor que el depósito recibido: ${formatMoney(depositAmount)}.`;
              return true;
            },
          })}
        />
      </Fields>
      <Facts>
        <div>
          <dt>Fecha</dt>
          <dd>{formatDateWithYear(refund.expense_date)}</dd>
        </div>
        <div>
          <dt>Tipo</dt>
          <dd>Devolución de depósito</dd>
        </div>
        {changed ? (
          <div>
            <dt>Importe devuelto</dt>
            <dd>
              {formatMoney(refund.amount)} → {formatMoney(amount)}
            </dd>
          </div>
        ) : null}
      </Facts>
      <List as="p">
        Cambiarán Movimientos y el resumen del mes. La fecha, el depósito y el contrato no cambian.
      </List>
      {failure ? (
        <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
          {failure.body}
        </Notice>
      ) : null}
      <DialogActions>
        <Button
          onClick={() => void save()}
          loading={update.isPending}
          disabled={!changed || (failure !== null && failure.tone !== 'error')}
        >
          {changed ? `Guardar importe de ${formatMoney(amount)}` : 'Guardar importe'}
        </Button>
        <Button variant="secondary" onClick={close} disabled={update.isPending} data-initial-focus>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Y-17 Eliminar devolución (sin motivo): deja de contar como gasto; el registro se conserva. */
export function DeleteRefundDialog({
  refund,
  depositAmount,
  open,
  onClose,
  onDone,
}: RefundDialogProps) {
  const events = useInvalidateEvents();
  const deactivate = useDeactivateExpense();
  const [failure, setFailure] = useState<Failure | null>(null);

  const close = () => {
    setFailure(null);
    onClose();
  };

  const confirm = () => {
    setFailure(null);
    deactivate.mutate(refund.id, {
      onSuccess: () => {
        onClose();
        onDone({
          title: 'Devolución eliminada',
          body: `Ya no cuenta como gasto.${depositAmount ? ` El depósito de ${formatMoney(depositAmount)} sigue Pagado.` : ' El depósito sigue Pagado.'}`,
        });
        void events.depositRefundChanged();
      },
      onError: error => {
        const result = failureOf(
          error,
          'No pudimos eliminar la devolución',
          'No sabemos si se eliminó la devolución',
        );
        setFailure(result);
        if (result.tone !== 'error') void events.depositRefundChanged();
      },
    });
  };

  return (
    <Dialog
      open={open}
      title={`¿Eliminar la devolución de ${formatMoney(refund.amount)}?`}
      onClose={close}
      busy={deactivate.isPending}
    >
      <List>
        <li>Dejará de contar como gasto en Movimientos y en el resumen del mes.</li>
        <li>El registro se conserva como eliminado; no significa que el dinero regresó.</li>
        <li>El depósito sigue Pagado y podrá devolverse otra vez.</li>
        <li>El contrato no cambia.</li>
      </List>
      {failure ? (
        <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
          {failure.body}
        </Notice>
      ) : null}
      <DialogActions>
        <Button
          variant="danger"
          onClick={confirm}
          loading={deactivate.isPending}
          disabled={failure !== null && failure.tone !== 'error'}
        >
          {failure?.tone === 'error' ? 'Intentar de nuevo' : 'Eliminar devolución'}
        </Button>
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
