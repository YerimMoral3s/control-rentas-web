import { useEffect, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { isAppError } from '@api/errors';
import type {
  AdditionalChargeChanges,
  AdditionalChargeUpdatePreview,
  PaymentDetail,
  ReactivatePreview,
} from '@api/payments';
import { Button, Dialog, DialogActions, Notice, Skeleton, TextField } from '@components';
import { toAmount } from '@features/contracts/form/ContractFields';
import { chargeFieldMessages, conceptRules } from '../charges/chargeRules';
import {
  useCancelPayment,
  usePreviewAdditionalChargeUpdate,
  usePreviewReactivate,
  useReactivatePayment,
  useUpdateAdditionalCharge,
  useUpdateManualRent,
} from '@hooks/querys/payments';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatDateWithYear, monthName } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { applyFieldErrors } from '@lib/formErrors';
import { formatMoneyInput } from '@lib/numericInput';
import { paymentTitle, tenantName } from '@lib/paymentText';
import { placeName } from '@lib/place';
import type { ResultMessage } from '@lib/useResultNotice';
import { Facts, Fields, List, Who } from './actionStyles';

type Failure = {
  tone: 'error' | 'uncertain' | 'warning';
  title: string;
  body: string;
  requestId?: string;
};

type DialogProps = {
  payment: PaymentDetail;
  open: boolean;
  onClose: () => void;
  /** Resultado para mostrar en el cobro. */
  onDone: (result: ResultMessage) => void;
};

/** "septiembre 2026" (periodo de la renta). */
const periodText = (payment: PaymentDetail) =>
  `${monthName(Number(payment.period_key.slice(0, 4)), Number(payment.period_key.slice(5, 7)))} ${payment.period_key.slice(0, 4)}`;

const capitalize = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

const statusWord = (status: PaymentDetail['status']) =>
  status === 'overdue'
    ? 'Vencida'
    : status === 'pending'
      ? 'Pendiente'
      : status === 'paid'
        ? 'Pagada'
        : 'Cancelada';

/** Textos propios por código; nunca el mensaje del backend. */
const CODE_FAILURES: Record<string, Omit<Failure, 'requestId'>> = {
  PAYMENT_STATE_CONFLICT: {
    tone: 'warning',
    title: 'Este cobro cambió',
    body: 'Mientras revisabas cambió su estado (por ejemplo, se registró su pago). No guardamos nada; revisa cómo está ahora.',
  },
  PAYMENT_CANNOT_BE_CANCELLED: {
    tone: 'warning',
    title: 'Esta renta ya no se puede cancelar',
    body: 'Solo se cancela una renta agregada sin pagar. No guardamos nada.',
  },
  MANUAL_RENT_CONTRACT_NOT_ELIGIBLE: {
    tone: 'warning',
    title: 'Ya no puedes reactivar esta renta',
    body: 'Su contrato ya no es el contrato actual Vencido: se continuó o se desocupó.',
  },
  MANUAL_RENT_PERIOD_NOT_ALLOWED: {
    tone: 'warning',
    title: 'Ya no puedes reactivar esta renta',
    body: 'Ese mes ya no se puede cobrar en este contrato.',
  },
  DUPLICATE_PAYMENT_PERIOD_KEY: {
    tone: 'warning',
    title: 'Otro cobro ya cubre ese mes',
    body: 'Para reactivarla, ese mes no debe tener otra renta válida.',
  },
  PAYMENT_OPERATION_CONFLICT: {
    tone: 'warning',
    title: 'Este cobro está cambiando',
    body: 'Otra operación lo está modificando. No guardamos nada; revisa cómo está ahora.',
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
      body: 'Antes de volver a intentarlo, revisa cómo está la renta ahora.',
      requestId,
    };
  return {
    tone: 'error',
    title: notSaved,
    body: 'Revisa tu conexión e inténtalo de nuevo.',
    requestId,
  };
};

function Header({ payment }: { payment: PaymentDetail }) {
  return (
    <Who>
      <strong>{tenantName(payment.tenant)}</strong>
      {placeName(payment.unit.name, payment.property)}
    </Who>
  );
}

function Actions({
  failure,
  onClose,
  busy,
  children,
}: {
  failure: Failure | null;
  onClose: () => void;
  busy: boolean;
  children: ReactNode;
}) {
  return (
    <>
      {failure ? (
        <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
          {failure.body}
        </Notice>
      ) : null}
      <DialogActions>
        {/* Si cambió o no sabemos si se guardó, solo se ofrece ver la renta actualizada. */}
        {failure && failure.tone !== 'error' ? (
          <Button onClick={onClose}>Ver cobro actualizado</Button>
        ) : (
          children
        )}
        <Button variant="secondary" onClick={onClose} disabled={busy} data-initial-focus>
          Volver
        </Button>
      </DialogActions>
    </>
  );
}

/** Y-08 Corregir importe de una renta agregada sin pagar. La revisión está en el mismo diálogo. */
export function CorrectAmountDialog({ payment, open, onClose, onDone }: DialogProps) {
  const events = useInvalidateEvents();
  const update = useUpdateManualRent();
  const [failure, setFailure] = useState<Failure | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    control,
    reset,
    formState: { errors },
  } = useForm<{ amount: string }>({
    defaultValues: { amount: formatMoneyInput(payment.amount) },
  });
  const amount = toAmount(useWatch({ control, name: 'amount' }));
  const changed = amount > 0 && amount !== Number(payment.amount);
  const title = paymentTitle(payment);

  const close = () => {
    setFailure(null);
    reset({ amount: formatMoneyInput(payment.amount) });
    onClose();
  };

  const save = handleSubmit(values => {
    setFailure(null);
    update.mutate(
      { paymentId: payment.id, amount: toAmount(values.amount) },
      {
        onSuccess: ({ data }) => {
          setFailure(null);
          onClose();
          onDone({
            title: 'Importe corregido',
            body: `${title} ahora es de ${formatMoney(data.amount)} y sigue ${statusWord(data.status)}.`,
          });
          void events.paymentChanged();
        },
        onError: error => {
          if (applyFieldErrors(error, setError, { amount: 'Escribe un importe mayor a cero.' }))
            return;
          const result = failureOf(
            error,
            'No pudimos corregir el importe',
            'No sabemos si se corrigió el importe',
          );
          setFailure(result);
          if (result.tone !== 'error') void events.paymentChanged();
        },
      },
    );
  });

  return (
    <Dialog open={open} title="Corregir importe" onClose={close} busy={update.isPending}>
      <Header payment={payment} />
      <TextField
        label="Importe"
        format="money"
        prefix="$"
        autoComplete="off"
        help={`Antes: ${formatMoney(payment.amount)}`}
        disabled={update.isPending}
        error={errors.amount?.message}
        {...register('amount', {
          validate: value => toAmount(value) > 0 || 'Escribe un importe mayor a cero.',
        })}
      />
      <Facts>
        <div>
          <dt>Periodo</dt>
          <dd>{capitalize(periodText(payment))}</dd>
        </div>
        <div>
          <dt>Vencimiento</dt>
          <dd>{formatDateWithYear(payment.due_date)}</dd>
        </div>
        {changed ? (
          <div>
            <dt>Importe</dt>
            <dd>
              {formatMoney(payment.amount)} → {formatMoney(amount)}
            </dd>
          </div>
        ) : null}
      </Facts>
      <List as="p">Sigue {statusWord(payment.status)}. No cambian el contrato ni el periodo.</List>
      <Actions failure={failure} onClose={close} busy={update.isPending}>
        <Button onClick={() => void save()} loading={update.isPending} disabled={!changed}>
          {changed ? `Guardar importe de ${formatMoney(amount)}` : 'Guardar importe'}
        </Button>
      </Actions>
    </Dialog>
  );
}

/**
 * Y-09 Cancelar renta agregada y Y-13 Cancelar cargo (sin motivo). El registro se conserva en el
 * contrato.
 */
export function CancelRentDialog({ payment, open, onClose, onDone }: DialogProps) {
  const events = useInvalidateEvents();
  const cancel = useCancelPayment();
  const [failure, setFailure] = useState<Failure | null>(null);
  const title = paymentTitle(payment);
  const charge = payment.payment_type === 'additional_services';

  const close = () => {
    setFailure(null);
    onClose();
  };

  const confirm = () => {
    setFailure(null);
    cancel.mutate(payment.id, {
      onSuccess: () => {
        onClose();
        onDone({
          title: charge ? 'Cargo cancelado' : 'Renta cancelada',
          body: `${title} quedó ${charge ? 'Cancelado' : 'Cancelada'}. Sigue visible en el contrato, en Cancelados.`,
        });
        void events.paymentChanged();
      },
      onError: error => {
        const result = failureOf(
          error,
          'No pudimos cancelar la renta',
          'No sabemos si se canceló la renta',
        );
        setFailure(result);
        if (result.tone !== 'error') void events.paymentChanged();
      },
    });
  };

  return (
    <Dialog
      open={open}
      title={
        charge ? `¿Cancelar el cargo ${title}?` : `¿Cancelar la renta de ${periodText(payment)}?`
      }
      onClose={close}
      busy={cancel.isPending}
    >
      <Header payment={payment} />
      <List>
        <li>
          {charge ? 'Quedará Cancelado' : 'Quedará Cancelada'} y saldrá de Pagos por atender y de
          los pagos atrasados.
        </li>
        <li>El registro se conserva y se consulta desde el contrato.</li>
        <li>
          {charge
            ? 'Un cargo Cancelado ya no se puede editar.'
            : 'Podrás reactivarla mientras este contrato Vencido siga siendo el actual.'}
        </li>
      </List>
      <Facts>
        <div>
          <dt>Importe</dt>
          <dd>{formatMoney(payment.amount)}</dd>
        </div>
      </Facts>
      <Actions failure={failure} onClose={close} busy={cancel.isPending}>
        <Button variant="danger" onClick={confirm} loading={cancel.isPending}>
          {failure ? 'Intentar de nuevo' : charge ? 'Cancelar cargo' : 'Cancelar renta'}
        </Button>
      </Actions>
    </Dialog>
  );
}

/**
 * Y-10 Reactivar renta agregada Cancelada. La revisión del servidor dice si vuelve a Pendiente o
 * Vencido (FE-35); se confirma con su `preview_token`. Es el mismo registro.
 */
export function ReactivateRentDialog({ payment, open, onClose, onDone }: DialogProps) {
  const events = useInvalidateEvents();
  const previewMutation = usePreviewReactivate();
  const reactivate = useReactivatePayment();
  const [preview, setPreview] = useState<ReactivatePreview | null>(null);
  const [changed, setChanged] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const title = paymentTitle(payment);
  const { mutate: requestPreview } = previewMutation;

  const previewHandlers = {
    onSuccess: ({ data }: { data: ReactivatePreview }) => setPreview(data),
    onError: (error: unknown) => {
      const result = failureOf(
        error,
        'No pudimos revisar la reactivación',
        'No pudimos revisar la reactivación',
      );
      setFailure(result);
      if (result.tone !== 'error') void events.paymentChanged();
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
    reactivate.mutate(
      { paymentId: payment.id, previewToken: preview.preview_token },
      {
        onSuccess: ({ data }) => {
          close();
          onDone({
            title: 'Renta reactivada',
            body: `${title} volvió a ${data.status === 'overdue' ? 'Vencido' : 'Pendiente'}.`,
          });
          void events.paymentChanged();
        },
        onError: error => {
          if (isAppError(error) && error.code === 'PREVIEW_CHANGED' && error.details?.preview) {
            // Nada se guardó: se muestra la revisión nueva y se confirma otra vez.
            setPreview(error.details.preview as ReactivatePreview);
            setChanged(true);
            return;
          }
          const result = failureOf(
            error,
            'No pudimos reactivar la renta',
            'No sabemos si se reactivó la renta',
          );
          setFailure(result);
          if (result.tone !== 'error') void events.paymentChanged();
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      title={`¿Reactivar la renta de ${periodText(payment)}?`}
      onClose={close}
      busy={reactivate.isPending}
    >
      <Header payment={payment} />
      {changed ? (
        <Notice tone="warning" title="La revisión cambió">
          Algo cambió mientras revisabas. Revisa otra vez y confirma de nuevo.
        </Notice>
      ) : null}
      {preview ? (
        <>
          <List>
            <li>
              {preview.after.status === 'overdue'
                ? `Volverá a Vencido porque venció el ${formatDateWithYear(preview.payment.due_date)}.`
                : `Volverá a Pendiente porque vence el ${formatDateWithYear(preview.payment.due_date)}.`}
            </li>
            <li>Es el mismo registro; no se crea otro ni se marca como Pagado.</li>
            <li>Volverá a Pagos por atender y a los pagos atrasados.</li>
          </List>
          <Facts>
            <div>
              <dt>Importe</dt>
              <dd>{formatMoney(preview.payment.amount)}</dd>
            </div>
          </Facts>
        </>
      ) : previewMutation.isPending ? (
        <div aria-busy="true" aria-label="Revisando la reactivación">
          <Skeleton $height="96px" />
        </div>
      ) : null}
      <Actions failure={failure} onClose={close} busy={reactivate.isPending}>
        {failure && !preview ? (
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
          <Button onClick={confirm} loading={reactivate.isPending} disabled={!preview}>
            {failure ? 'Intentar de nuevo' : 'Reactivar renta'}
          </Button>
        )}
      </Actions>
    </Dialog>
  );
}

type ChargeValues = { concept_reference: string; amount: string; due_date: string };

const chargeStatus = (status: 'pending' | 'overdue') =>
  status === 'overdue' ? 'Vencido' : 'Pendiente';

/**
 * Y-12 Editar cargo adicional sin pagar: concepto, importe o vencimiento. "Revisar cambios" pide la
 * revisión del servidor (antes → después y Estado previsto, FE-36) en el mismo diálogo; se guarda con
 * su `preview_token`. Si el formulario cambia después, hay que revisar otra vez.
 */
export function EditChargeDialog({ payment, open, onClose, onDone }: DialogProps) {
  const events = useInvalidateEvents();
  const previewMutation = usePreviewAdditionalChargeUpdate();
  const update = useUpdateAdditionalCharge();
  const [failure, setFailure] = useState<Failure | null>(null);
  const [review, setReview] = useState<{
    key: string;
    preview: AdditionalChargeUpdatePreview;
    changed: boolean;
  } | null>(null);
  const initial: ChargeValues = {
    concept_reference: payment.concept_reference ?? '',
    amount: formatMoneyInput(payment.amount),
    due_date: payment.due_date,
  };
  const {
    register,
    handleSubmit,
    setError,
    control,
    reset,
    formState: { errors },
  } = useForm<ChargeValues>({ defaultValues: initial });
  const values = useWatch({ control });

  // Solo lo que cambió (al menos uno).
  const concept = (values.concept_reference ?? '').trim();
  const amount = toAmount(values.amount ?? '');
  const changes: AdditionalChargeChanges = {
    ...(concept && concept !== (payment.concept_reference ?? '')
      ? { concept_reference: concept }
      : {}),
    ...(amount > 0 && amount !== Number(payment.amount) ? { amount } : {}),
    ...(values.due_date && values.due_date !== payment.due_date
      ? { due_date: values.due_date }
      : {}),
  };
  const changesKey = JSON.stringify(changes);
  const hasChanges = Object.keys(changes).length > 0;
  // La revisión solo vale para los datos que se revisaron.
  const current = review?.key === changesKey ? review : null;
  const busy = previewMutation.isPending || update.isPending;

  const close = () => {
    setFailure(null);
    setReview(null);
    reset(initial);
    onClose();
  };

  const onFieldOrState = (error: unknown, notSaved: string, uncertain: string) => {
    if (applyFieldErrors(error, setError, chargeFieldMessages)) return;
    const result = failureOf(error, notSaved, uncertain);
    setFailure(result);
    if (result.tone !== 'error') void events.paymentChanged();
  };

  const requestReview = handleSubmit(() => {
    setFailure(null);
    previewMutation.mutate(
      { paymentId: payment.id, changes },
      {
        onSuccess: ({ data }) => setReview({ key: changesKey, preview: data, changed: false }),
        onError: error =>
          onFieldOrState(error, 'No pudimos revisar los cambios', 'No pudimos revisar los cambios'),
      },
    );
  });

  const save = () => {
    if (!current) return;
    setFailure(null);
    update.mutate(
      { paymentId: payment.id, changes, previewToken: current.preview.preview_token },
      {
        onSuccess: ({ data }) => {
          close();
          onDone({
            title: 'Cargo actualizado',
            body: `${data.concept_reference ?? 'El cargo'} ahora es de ${formatMoney(data.amount)}, vence el ${formatDateWithYear(data.due_date)} y quedó ${data.status === 'overdue' ? 'Vencido' : 'Pendiente'}.`,
          });
          void events.paymentChanged();
        },
        onError: error => {
          if (isAppError(error) && error.code === 'PREVIEW_CHANGED' && error.details?.preview) {
            // Nada se guardó: se muestra la revisión nueva y se confirma otra vez.
            setReview({
              key: changesKey,
              preview: error.details.preview as AdditionalChargeUpdatePreview,
              changed: true,
            });
            return;
          }
          onFieldOrState(
            error,
            'No pudimos guardar los cambios',
            'No sabemos si se guardaron los cambios',
          );
        },
      },
    );
  };

  const before = current?.preview.before;
  const after = current?.preview.after;

  return (
    <Dialog open={open} title="Editar cargo" onClose={close} busy={update.isPending}>
      <Header payment={payment} />
      <Fields>
        <TextField
          label="Concepto"
          autoComplete="off"
          maxLength={150}
          disabled={busy}
          error={errors.concept_reference?.message}
          {...register('concept_reference', conceptRules)}
        />
        <TextField
          label="Importe"
          format="money"
          prefix="$"
          autoComplete="off"
          disabled={busy}
          error={errors.amount?.message}
          {...register('amount', {
            validate: value => toAmount(value) > 0 || 'Escribe un importe mayor a cero.',
          })}
        />
        <TextField
          label="Vencimiento"
          type="date"
          help="Puede ser una fecha pasada, de hoy o futura."
          disabled={busy}
          error={errors.due_date?.message}
          {...register('due_date', {
            validate: value =>
              /^\d{4}-\d{2}-\d{2}$/.test(value) || 'Elige la fecha de vencimiento.',
          })}
        />
      </Fields>
      {current?.changed ? (
        <Notice tone="warning" title="La revisión cambió">
          Algo cambió mientras revisabas. Revisa los cambios otra vez y guarda de nuevo.
        </Notice>
      ) : null}
      {before && after ? (
        <Facts aria-label="Revisa los cambios">
          {before.concept_reference !== after.concept_reference ? (
            <div>
              <dt>Concepto</dt>
              <dd>
                {before.concept_reference ?? 'Cargo adicional'} → {after.concept_reference}
              </dd>
            </div>
          ) : null}
          {before.amount !== after.amount ? (
            <div>
              <dt>Importe</dt>
              <dd>
                {formatMoney(before.amount)} → {formatMoney(after.amount)}
              </dd>
            </div>
          ) : null}
          {before.due_date !== after.due_date ? (
            <div>
              <dt>Vencimiento</dt>
              <dd>
                {formatDateWithYear(before.due_date)} → {formatDateWithYear(after.due_date)}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Estado previsto</dt>
            <dd>
              {before.status === after.status
                ? `Sigue ${chargeStatus(after.status)}`
                : `${chargeStatus(before.status)} → ${chargeStatus(after.status)}`}
            </dd>
          </div>
        </Facts>
      ) : null}
      <Actions failure={failure} onClose={close} busy={update.isPending}>
        {current ? (
          <Button onClick={save} loading={update.isPending}>
            {failure ? 'Intentar de nuevo' : 'Guardar cambios'}
          </Button>
        ) : (
          <Button
            onClick={() => void requestReview()}
            loading={previewMutation.isPending}
            loadingLabel="Revisando…"
            disabled={!hasChanges}
          >
            Revisar cambios
          </Button>
        )}
      </Actions>
    </Dialog>
  );
}
