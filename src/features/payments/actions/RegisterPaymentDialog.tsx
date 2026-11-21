import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { isAppError } from '@api/errors';
import type { Payment } from '@api/payments';
import { Button, Dialog, DialogActions, Notice, StatusBadge } from '@components';
import { useRegisterPayment } from '@hooks/querys/payments';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatDateTime, formatDateWithYear } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { paymentTitle, tenantName } from '@lib/paymentText';
import { placeName } from '@lib/place';
import { withResult } from '@lib/useResultNotice';
import { Facts, Text, Who } from './actionStyles';

type Failure = {
  tone: 'error' | 'uncertain' | 'warning';
  title: string;
  body: string;
  /** El cobro cambió o no sabemos si se guardó: solo se ofrece revisarlo. */
  review: boolean;
  requestId?: string;
};

const failureOf = (error: unknown, payment: Payment): Failure => {
  const requestId = isAppError(error) ? error.requestId : undefined;
  if (isAppError(error) && error.code === 'PAYMENT_ALREADY_PAID')
    return {
      tone: 'warning',
      title: 'Este cobro ya está Pagado',
      body: 'Mientras revisabas, se registró su pago. No registramos nada nuevo.',
      review: true,
    };
  if (isAppError(error) && error.code === 'PAYMENT_CANCELLED')
    return {
      tone: 'warning',
      title: 'Este cobro ya está Cancelado',
      body: 'Mientras revisabas, se canceló. No registramos nada.',
      review: true,
    };
  if (isAppError(error) && error.code === 'PAYMENT_OPERATION_CONFLICT')
    return {
      tone: 'warning',
      title: 'Este cobro está cambiando',
      body: 'Otra operación lo está modificando. No registramos nada; revisa cómo está ahora.',
      review: true,
    };
  if (isAppError(error) && error.type === 'uncertain')
    return {
      tone: 'uncertain',
      title: 'No sabemos si se registró el pago',
      body: 'Antes de volver a intentarlo, revisa cómo está el cobro ahora.',
      review: true,
      requestId,
    };
  return {
    tone: 'error',
    title: 'No pudimos registrar el pago',
    body: `El cobro sigue ${payment.status === 'overdue' ? 'Vencido' : 'Pendiente'}. Revisa tu conexión e inténtalo de nuevo.`,
    review: false,
    requestId,
  };
};

/**
 * Y-04 Registrar pago: la revisión es la confirmación (no hay una segunda). Pago completo con la
 * fecha y hora del servidor; al terminar abre el cobro con el resultado.
 */
export function RegisterPaymentDialog({
  payment,
  open,
  onClose,
}: {
  payment: Payment;
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const events = useInvalidateEvents();
  const register = useRegisterPayment();
  const [failure, setFailure] = useState<Failure | null>(null);
  const name = tenantName(payment.tenant);
  const title = paymentTitle(payment);
  const detail = `/cobros/${payment.id}`;

  const close = () => {
    setFailure(null);
    onClose();
  };

  const review = () => {
    close();
    void navigate(detail);
    void events.paymentChanged();
  };

  const confirm = () => {
    setFailure(null);
    register.mutate(payment.id, {
      onSuccess: ({ data }) => {
        setFailure(null);
        onClose();
        // Desde el mismo cobro se reemplaza la entrada para no duplicar el historial.
        void navigate(detail, {
          replace: location.pathname === detail,
          state: withResult({
            title: 'Pago registrado',
            body: `${title} quedó Pagada${data.paid_at ? ` el ${formatDateTime(data.paid_at)}` : ''}. También actualizamos Pagos por atender, los pagos atrasados de ${name}, el resumen del mes y Movimientos.`,
          }),
        });
        void events.paymentChanged();
      },
      onError: error => setFailure(failureOf(error, payment)),
    });
  };

  return (
    <Dialog open={open} title="Registrar pago" onClose={close} busy={register.isPending}>
      <Who>
        <strong>{name}</strong>
        {placeName(payment.unit.name, payment.property)}
      </Who>
      <Facts>
        <div>
          <dt>Concepto</dt>
          <dd>{title}</dd>
        </div>
        <div>
          <dt>Vencimiento</dt>
          <dd>{formatDateWithYear(payment.due_date)}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>
            <StatusBadge status={payment.status} compact />
          </dd>
        </div>
        <div>
          <dt>Importe</dt>
          <dd>{formatMoney(payment.amount)}</dd>
        </div>
      </Facts>
      <Text>Se registra el pago completo, con la fecha y hora de este momento.</Text>
      {failure ? (
        <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
          {failure.body}
        </Notice>
      ) : null}
      <DialogActions>
        {failure?.review ? (
          <Button onClick={review}>Revisar el cobro</Button>
        ) : (
          <Button onClick={confirm} loading={register.isPending} loadingLabel="Guardando…">
            {failure ? 'Intentar de nuevo' : `Registrar pago de ${formatMoney(payment.amount)}`}
          </Button>
        )}
        <Button variant="secondary" onClick={close} disabled={register.isPending}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
