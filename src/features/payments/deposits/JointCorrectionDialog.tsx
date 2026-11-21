import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { isAppError } from '@api/errors';
import type { DepositRefundCorrectionPreview, PaymentDetail } from '@api/payments';
import { Button, Dialog, DialogActions, Notice, Skeleton, StatusBadge } from '@components';
import { useCorrectDepositRefund, usePreviewDepositRefundCorrection } from '@hooks/querys/payments';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatDateWithYear } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { tenantName } from '@lib/paymentText';
import { placeName } from '@lib/place';
import type { ResultMessage } from '@lib/useResultNotice';
import { List, Text, Who } from '../actions/actionStyles';

type Failure = {
  tone: 'error' | 'uncertain' | 'warning';
  title: string;
  body: string;
  /** El depósito o la devolución cambiaron: hay que revisar de nuevo. */
  stale: boolean;
  requestId?: string;
};

const Changes = styled.section`
  margin: 0 0 12px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.neutral50};
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 15px;
  line-height: 22px;

  h3 {
    margin: 0;
    font-size: 16px;
  }

  p {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
`;

const CODE_FAILURES: Record<string, Omit<Failure, 'requestId'>> = {
  DEPOSIT_REFUND_MISMATCH: {
    tone: 'warning',
    title: 'La devolución cambió',
    body: 'No hicimos cambios. Revisa de nuevo antes de confirmar.',
    stale: true,
  },
  EXPENSE_INACTIVE: {
    tone: 'warning',
    title: 'La devolución ya se eliminó',
    body: 'No hicimos cambios. Ahora puedes corregir solo el pago del depósito.',
    stale: true,
  },
  EXPENSE_NOT_FOUND: {
    tone: 'warning',
    title: 'La devolución ya no existe',
    body: 'No hicimos cambios. Revisa el depósito antes de volver a intentarlo.',
    stale: true,
  },
  DEPOSIT_NOT_PAID: {
    tone: 'warning',
    title: 'El depósito ya no está Pagado',
    body: 'No hicimos cambios. Revisa cómo está ahora.',
    stale: true,
  },
  PAYMENT_OPERATION_CONFLICT: {
    tone: 'warning',
    title: 'El depósito está cambiando',
    body: 'Otra operación lo está modificando. No hicimos cambios; revisa cómo está ahora.',
    stale: true,
  },
};

/**
 * Y-18 Corregir depósito y devolución: aparece al usar Corregir pago en un depósito con devolución
 * activa. La revisión del servidor (FE-37) dice a qué estado vuelve el depósito y qué devolución se
 * corrige; se confirma con su `preview_token`. Cambian los dos registros o ninguno.
 */
const statusWord = (status: 'pending' | 'overdue') =>
  status === 'overdue' ? 'Vencido' : 'Pendiente';

export function JointCorrectionDialog({
  payment,
  open,
  onClose,
  onDone,
}: {
  payment: PaymentDetail;
  open: boolean;
  onClose: () => void;
  onDone: (result: ResultMessage) => void;
}) {
  const events = useInvalidateEvents();
  const previewMutation = usePreviewDepositRefundCorrection();
  const correct = useCorrectDepositRefund();
  const [preview, setPreview] = useState<DepositRefundCorrectionPreview | null>(null);
  const [changed, setChanged] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const { mutate: requestPreview } = previewMutation;

  const knownFailure = (error: unknown): Failure | null => {
    const known = isAppError(error) ? CODE_FAILURES[error.code] : undefined;
    return known ? { ...known, requestId: isAppError(error) ? error.requestId : undefined } : null;
  };

  const previewHandlers = {
    onSuccess: ({ data }: { data: DepositRefundCorrectionPreview }) => setPreview(data),
    onError: (error: unknown) => {
      const known = knownFailure(error);
      if (known) void events.depositRefundChanged();
      setFailure(
        known ?? {
          tone: 'error',
          title: 'No pudimos revisar la corrección',
          body: 'No hicimos cambios. Revisa tu conexión e inténtalo de nuevo.',
          stale: false,
          requestId: isAppError(error) ? error.requestId : undefined,
        },
      );
    },
  };

  // Cada vez que se abre se pide la revisión del servidor (nada se guarda).
  useEffect(() => {
    if (open) requestPreview(payment.id, previewHandlers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    setFailure(null);
    setPreview(null);
    setChanged(false);
    onClose();
  };

  const confirm = () => {
    if (!preview) return;
    setFailure(null);
    correct.mutate(
      { paymentId: payment.id, refundId: preview.refund.id, previewToken: preview.preview_token },
      {
        onSuccess: ({ data }) => {
          close();
          onDone({
            title: 'Corregimos el depósito y la devolución',
            body: `El depósito de ${formatMoney(preview.deposit.amount)} volvió a ${data.deposit.status === 'overdue' ? 'Vencido' : 'Pendiente'} y la devolución de ${formatMoney(preview.refund.amount)} dejó de contar como gasto.`,
          });
          void events.depositRefundChanged();
        },
        onError: error => {
          if (isAppError(error) && error.code === 'PREVIEW_CHANGED' && error.details?.preview) {
            // Nada se guardó: se muestra la revisión nueva y se confirma otra vez.
            setPreview(error.details.preview as DepositRefundCorrectionPreview);
            setChanged(true);
            return;
          }
          const known = knownFailure(error);
          if (known) {
            setFailure(known);
            void events.depositRefundChanged();
            return;
          }
          const uncertain = isAppError(error) && error.type === 'uncertain';
          setFailure({
            tone: uncertain ? 'uncertain' : 'error',
            title: uncertain
              ? 'No sabemos si se hizo la corrección'
              : 'No pudimos hacer la corrección',
            body: uncertain
              ? 'Revisa el depósito antes de volver a intentarlo.'
              : 'No cambió ninguno de los dos registros. Inténtalo de nuevo.',
            stale: uncertain,
            requestId: isAppError(error) ? error.requestId : undefined,
          });
          if (uncertain) void events.depositRefundChanged();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      title="Corregir depósito y devolución"
      onClose={close}
      busy={correct.isPending}
    >
      <Who>
        <strong>{tenantName(payment.tenant)}</strong>
        {placeName(payment.unit.name, payment.property)}
      </Who>
      {changed ? (
        <Notice tone="warning" title="La revisión cambió">
          {`La devolución o el depósito cambiaron mientras revisabas${preview ? `; la devolución ahora es de ${formatMoney(preview.refund.amount)}` : ''}. Revisa de nuevo antes de confirmar.`}
        </Notice>
      ) : (
        <Notice tone="warning" title="Este depósito tiene una devolución registrada">
          Para corregir el pago del depósito, también hay que corregir la devolución. Hazlo solo si
          los dos registros fueron un error.
        </Notice>
      )}
      {preview ? (
        <>
          <Changes aria-label="Qué cambiará">
            <h3>Qué cambiará</h3>
            <p>
              <strong>Depósito · {formatMoney(preview.deposit.amount)}</strong>
              <StatusBadge status="paid" compact /> →
              <StatusBadge status={preview.after.status} compact />
            </p>
            <p>
              <strong>
                Devolución · {formatMoney(preview.refund.amount)} ·{' '}
                {formatDateWithYear(preview.refund.expense_date)}
              </strong>
            </p>
            <List>
              <li>Ahora cuenta como gasto.</li>
              <li>Después de corregir dejará de contar como gasto.</li>
              <li>El registro se conservará en el historial.</li>
            </List>
          </Changes>
          <Text>
            {preview.after.status === 'overdue'
              ? `El depósito vuelve a ${statusWord('overdue')} porque su fecha, ${formatDateWithYear(preview.deposit.due_date)}, ya pasó.`
              : `El depósito vuelve a ${statusWord('pending')} porque vence el ${formatDateWithYear(preview.deposit.due_date)}.`}{' '}
            Cambian los dos registros o ninguno. Corregir la captura no devuelve dinero ni registra
            un gasto hoy.
          </Text>
        </>
      ) : previewMutation.isPending ? (
        <div aria-busy="true" aria-label="Revisando la corrección">
          <Skeleton $height="160px" />
        </div>
      ) : null}
      {failure ? (
        <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
          {failure.body}
        </Notice>
      ) : null}
      <DialogActions>
        {failure?.stale ? (
          <Button onClick={close}>Revisar de nuevo</Button>
        ) : failure && !preview ? (
          <Button
            onClick={() => {
              setFailure(null);
              requestPreview(payment.id, previewHandlers);
            }}
            loading={previewMutation.isPending}
          >
            Intentar de nuevo
          </Button>
        ) : (
          <Button
            variant="danger"
            onClick={confirm}
            loading={correct.isPending}
            disabled={!preview}
          >
            {failure ? 'Intentar de nuevo' : 'Corregir depósito y devolución'}
          </Button>
        )}
        <Button variant="secondary" onClick={close} disabled={correct.isPending} data-initial-focus>
          Conservar ambos
        </Button>
      </DialogActions>
    </Dialog>
  );
}
