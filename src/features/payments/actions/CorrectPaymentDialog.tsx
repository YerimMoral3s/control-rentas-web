import { useEffect, useState } from 'react';
import { isAppError } from '@api/errors';
import type { PaymentDetail, ReopenPreview } from '@api/payments';
import { Button, Dialog, DialogActions, Notice, Skeleton } from '@components';
import { usePreviewReopen, useReopenPayment } from '@hooks/querys/payments';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatDateTime, formatDateWithYear } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { paymentTitle, tenantName } from '@lib/paymentText';
import { placeName } from '@lib/place';
import type { ResultMessage } from '@lib/useResultNotice';
import { Facts, List, Who } from './actionStyles';

type Failure = {
  tone: 'error' | 'uncertain' | 'warning';
  title: string;
  body: string;
  /** El cobro cambió: solo se ofrece verlo actualizado. */
  stale: boolean;
  requestId?: string;
};

const CODE_FAILURES: Record<string, Omit<Failure, 'requestId'>> = {
  PAYMENT_CANNOT_BE_REOPENED: {
    tone: 'warning',
    title: 'Este cobro ya no está Pagado',
    body: 'Mientras revisabas, cambió. No corregimos nada; revisa cómo está ahora.',
    stale: true,
  },
  PAYMENT_CANCELLED: {
    tone: 'warning',
    title: 'Este cobro está Cancelado',
    body: 'No corregimos nada.',
    stale: true,
  },
  DEPOSIT_HAS_ACTIVE_REFUND: {
    tone: 'warning',
    title: 'Este depósito tiene una devolución registrada',
    body: 'No corregimos nada. El depósito y su devolución se corrigen juntos desde el contrato.',
    stale: true,
  },
  PAYMENT_OPERATION_CONFLICT: {
    tone: 'warning',
    title: 'Este cobro está cambiando',
    body: 'Otra operación lo está modificando. No corregimos nada; revisa cómo está ahora.',
    stale: true,
  },
};

const statusLabel = (status: 'pending' | 'overdue') =>
  status === 'overdue' ? 'Vencido' : 'Pendiente';

/**
 * Y-05 Corregir pago. La revisión del servidor dice si vuelve a Pendiente o Vencido (FE-34); se
 * confirma con su `preview_token`. Es el mismo cobro; no se crea otro.
 */
export function CorrectPaymentDialog({
  payment,
  open,
  onClose,
  onCorrected,
}: {
  payment: PaymentDetail;
  open: boolean;
  onClose: () => void;
  /** Resultado para mostrar en el cobro. */
  onCorrected: (result: ResultMessage) => void;
}) {
  const events = useInvalidateEvents();
  const previewMutation = usePreviewReopen();
  const reopen = useReopenPayment();
  const [preview, setPreview] = useState<ReopenPreview | null>(null);
  const [changed, setChanged] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const title = paymentTitle(payment);
  const { mutate: requestPreview } = previewMutation;

  const knownFailure = (error: unknown): Failure | null => {
    const known = isAppError(error) ? CODE_FAILURES[error.code] : undefined;
    return known ? { ...known, requestId: isAppError(error) ? error.requestId : undefined } : null;
  };

  const previewHandlers = {
    onSuccess: ({ data }: { data: ReopenPreview }) => setPreview(data),
    onError: (error: unknown) => {
      const known = knownFailure(error);
      if (known) void events.paymentChanged();
      setFailure(
        known ?? {
          tone: 'error',
          title: 'No pudimos revisar la corrección',
          body: 'No corregimos nada. Revisa tu conexión e inténtalo de nuevo.',
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
    reopen.mutate(
      { paymentId: payment.id, previewToken: preview.preview_token },
      {
        onSuccess: ({ data }) => {
          close();
          onCorrected({
            title: 'Pago corregido',
            body: `${title} volvió a ${statusLabel(data.status === 'overdue' ? 'overdue' : 'pending')}. Ya no aparece en Movimientos.`,
          });
          void events.paymentChanged();
        },
        onError: error => {
          if (isAppError(error) && error.code === 'PREVIEW_CHANGED' && error.details?.preview) {
            // Nada se guardó: se muestra la revisión nueva y se confirma otra vez.
            setPreview(error.details.preview as ReopenPreview);
            setChanged(true);
            return;
          }
          const known = knownFailure(error);
          if (known) {
            setFailure(known);
            void events.paymentChanged();
            return;
          }
          const uncertain = isAppError(error) && error.type === 'uncertain';
          setFailure({
            tone: uncertain ? 'uncertain' : 'error',
            title: uncertain ? 'No sabemos si se corrigió el pago' : 'No pudimos corregir el pago',
            body: uncertain
              ? 'Antes de volver a intentarlo, revisa cómo está el cobro ahora.'
              : 'El cobro sigue Pagado. Revisa tu conexión e inténtalo de nuevo.',
            stale: uncertain,
            requestId: isAppError(error) ? error.requestId : undefined,
          });
          if (uncertain) void events.paymentChanged();
        },
      },
    );
  };

  const after = preview?.after.status;

  return (
    <Dialog
      open={open}
      title={`¿Corregir el pago de ${title.charAt(0).toLowerCase()}${title.slice(1)}?`}
      onClose={close}
      busy={reopen.isPending}
    >
      <Who>
        <strong>{tenantName(payment.tenant)}</strong>
        {placeName(payment.unit.name, payment.property)}
      </Who>
      {changed ? (
        <Notice tone="warning" title="La revisión cambió">
          Algo cambió mientras revisabas. Revisa otra vez y confirma de nuevo.
        </Notice>
      ) : null}
      {preview && after ? (
        <>
          <List>
            <li>El cobro dejará de estar Pagado.</li>
            <li>
              {after === 'overdue'
                ? `Volverá a Vencido porque venció el ${formatDateWithYear(preview.payment.due_date)}.`
                : `Volverá a Pendiente porque vence el ${formatDateWithYear(preview.payment.due_date)}.`}
            </li>
            <li>Saldrá de Movimientos y volverá a Pagos por atender.</li>
            <li>Es el mismo cobro; no se crea otro.</li>
          </List>
          <Facts>
            <div>
              <dt>Importe</dt>
              <dd>{formatMoney(preview.payment.amount)}</dd>
            </div>
            {preview.before.paid_at ? (
              <div>
                <dt>Pago registrado</dt>
                <dd>{formatDateTime(preview.before.paid_at)}</dd>
              </div>
            ) : null}
          </Facts>
        </>
      ) : previewMutation.isPending ? (
        <div aria-busy="true" aria-label="Revisando la corrección">
          <Skeleton $height="120px" />
        </div>
      ) : null}
      {failure ? (
        <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
          {failure.body}
        </Notice>
      ) : null}
      <DialogActions>
        {failure?.stale ? (
          <Button onClick={close}>Ver cobro actualizado</Button>
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
          <Button variant="danger" onClick={confirm} loading={reopen.isPending} disabled={!preview}>
            {failure ? 'Intentar de nuevo' : 'Corregir pago'}
          </Button>
        )}
        <Button variant="secondary" onClick={close} disabled={reopen.isPending} data-initial-focus>
          Volver
        </Button>
      </DialogActions>
    </Dialog>
  );
}
