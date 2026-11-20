import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { isAppError } from '@api/errors';
import type { Contract, TerminationPreview } from '@api/contracts';
import { Button, ButtonLink, Dialog, DialogActions, Notice, Skeleton } from '@components';
import { usePreviewTermination, useTerminateContract } from '@hooks/querys/contracts';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatDateWithYear, monthName } from '@lib/dates';
import { formatMoney } from '@lib/format';
import { shortPlaceName } from '@lib/place';
import { withResult } from '@lib/useResultNotice';
import { cancelledText, chargeDue, monthTitle, retainedText } from './terminationText';

const List = styled.ul`
  margin: 0 0 12px;
  padding-left: 20px;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

const Text = styled.p`
  margin: 0 0 12px;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

const Cancelled = styled.section`
  margin: 0 0 16px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radius.card};
  background: ${({ theme }) => theme.color.neutral50};
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 15px;
  line-height: 22px;

  h3,
  h4,
  p {
    margin: 0;
  }

  h3 {
    font-size: 16px;
  }

  h4 {
    font-size: 14px;
    color: ${({ theme }) => theme.color.neutral600};
  }

  ul {
    margin: 0;
    padding-left: 20px;
  }
`;

type Failure = { tone: 'error' | 'uncertain'; title: string; body: string; requestId?: string };

/**
 * C-17 Terminar y desocupar (F-07). La revisión de BACK (FE-33) dice qué cobros se cancelarán y
 * qué adeudo se conserva; se confirma con su `preview_token`.
 */
export function TerminateContractDialog({
  contract,
  open,
  onClose,
}: {
  contract: Contract;
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const previewMutation = usePreviewTermination();
  const terminate = useTerminateContract();
  const [preview, setPreview] = useState<TerminationPreview | null>(null);
  const [changed, setChanged] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [notCurrent, setNotCurrent] = useState(false);
  const place = shortPlaceName(contract.unit.name, contract.property);
  const name = `${contract.tenant.first_name} ${contract.tenant.last_name}`;
  // Casa o bodega no tienen detalle de unidad propio: se abre la propiedad.
  const single =
    contract.property.property_type === 'house' || contract.property.property_type === 'warehouse';
  const unitPath = single
    ? `/propiedades/${contract.property.id}`
    : `/unidades/${contract.unit.id}`;
  const { mutate: requestPreview } = previewMutation;

  const previewHandlers = {
    onSuccess: ({ data }: { data: TerminationPreview }) => setPreview(data),
    onError: (error: unknown) => {
      if (isAppError(error) && error.code === 'CONTRACT_NOT_CURRENT') {
        setNotCurrent(true);
        return;
      }
      setFailure({
        tone: 'error',
        title: 'No pudimos revisar la salida',
        body: 'No hicimos cambios. Revisa tu conexión e inténtalo de nuevo.',
        requestId: isAppError(error) ? error.requestId : undefined,
      });
    },
  };

  const loadPreview = () => {
    setFailure(null);
    requestPreview(contract.id, previewHandlers);
  };

  // Cada vez que se abre se pide la revisión del servidor (nada se guarda).
  useEffect(() => {
    if (open) requestPreview(contract.id, previewHandlers);
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
    terminate.mutate(
      { contractId: contract.id, previewToken: preview.preview_token },
      {
        onSuccess: ({ data }) => {
          const summary = data.termination_summary;
          const cancelled = cancelledText(summary);
          const overdue = summary.retained_payments.overdue_count;
          void navigate(unitPath, {
            replace: true,
            state: withResult({
              title: `${place} quedó Disponible`,
              body: [
                cancelled
                  ? `El contrato de ${name} quedó Terminado y cancelamos ${cancelled}.`
                  : `El contrato de ${name} quedó Terminado.`,
                overdue > 0
                  ? `${overdue === 1 ? 'Su pago atrasado' : 'Sus pagos atrasados'} de ${formatMoney(summary.retained_payments.overdue_amount)} ${overdue === 1 ? 'sigue' : 'siguen'} en Pagos por atender.`
                  : null,
              ]
                .filter(Boolean)
                .join(' '),
            }),
          });
          void events.contractTerminated();
        },
        onError: error => {
          if (isAppError(error) && error.code === 'PREVIEW_CHANGED' && error.details?.preview) {
            // Nada se guardó: se muestra la revisión nueva y se confirma otra vez.
            setPreview(error.details.preview as TerminationPreview);
            setChanged(true);
            return;
          }
          if (isAppError(error) && error.code === 'CONTRACT_NOT_CURRENT') {
            setNotCurrent(true);
            void events.contractUpdated();
            return;
          }
          const uncertain = isAppError(error) && error.type === 'uncertain';
          setFailure({
            tone: uncertain ? 'uncertain' : 'error',
            title: uncertain
              ? 'No sabemos si se terminó el contrato'
              : 'No pudimos terminar el contrato',
            body: uncertain
              ? `Revisa ${place} antes de intentarlo otra vez.`
              : 'Revisa tu conexión e inténtalo de nuevo.',
            requestId: isAppError(error) ? error.requestId : undefined,
          });
        },
      },
    );
  };

  if (notCurrent)
    return (
      <Dialog open={open} title="Este contrato ya no es el contrato actual" onClose={close}>
        <Text>No hicimos cambios. Abre la unidad para ver qué acciones tiene.</Text>
        <DialogActions>
          <ButtonLink to={unitPath}>Ver {place}</ButtonLink>
          <Button variant="secondary" onClick={close}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    );

  const summary = preview?.termination_summary;
  const asOf = summary?.as_of_date ?? '';

  return (
    <Dialog
      open={open}
      title={`¿Terminar el contrato y desocupar ${place}?`}
      onClose={close}
      busy={terminate.isPending}
    >
      {changed ? (
        <Notice tone="warning" title="La revisión cambió">
          Algo cambió mientras revisabas. Revisa los cobros otra vez y confirma de nuevo.
        </Notice>
      ) : null}
      {summary ? (
        <>
          <List>
            {summary.is_early ? null : (
              <li>Registraremos la salida de hoy, {formatDateWithYear(asOf)}.</li>
            )}
            <li>El contrato quedará Terminado.</li>
            <li>{place} quedará Disponible.</li>
            <li>
              {name}, su historial, {retainedText(summary)}
              {contract.deposit ? ' y el depósito' : ''} se conservan.
              {contract.deposit ? ' Devolver el depósito es otra acción.' : ''}
            </li>
          </List>
          {summary.cancelled_count > 0 ? (
            <Cancelled aria-label="Cobros que se cancelarán">
              <h3>Cobros que se cancelarán</h3>
              {summary.is_early ? (
                <p>
                  La salida es antes del {formatDateWithYear(contract.end_date)}. La renta de{' '}
                  {monthName(Number(asOf.slice(0, 4)), Number(asOf.slice(5, 7)))} se conserva
                  completa.
                </p>
              ) : null}
              <p>Se cancelarán {cancelledText(summary)}.</p>
              {summary.cancelled_rents.length > 0 ? (
                <>
                  <h4>Rentas futuras</h4>
                  <ul>
                    {summary.cancelled_rents.map(rent => (
                      <li key={rent.payment_id}>
                        {monthTitle(rent.period_key)} · {formatMoney(rent.amount)}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
              {summary.cancelled_additional_charges.length > 0 ? (
                <>
                  <h4>Cargos adicionales</h4>
                  <ul>
                    {summary.cancelled_additional_charges.map(charge => (
                      <li key={charge.payment_id}>
                        {charge.concept ?? 'Cargo adicional'} · {chargeDue(charge.due_date, asOf)} ·{' '}
                        {formatMoney(charge.amount)}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </Cancelled>
          ) : (
            <Text>
              No hay cobros futuros que cancelar. Las rentas agregadas y los pagos atrasados se
              conservan.
            </Text>
          )}
        </>
      ) : previewMutation.isPending ? (
        <div aria-busy="true" aria-label="Revisando la salida">
          <Skeleton $height="120px" />
        </div>
      ) : null}
      {failure ? (
        <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
          {failure.body}
        </Notice>
      ) : null}
      <DialogActions>
        {failure?.tone === 'uncertain' ? (
          <ButtonLink to={unitPath}>Ver {place}</ButtonLink>
        ) : failure && !preview ? (
          <Button onClick={loadPreview} loading={previewMutation.isPending}>
            Intentar de nuevo
          </Button>
        ) : (
          <Button
            variant="danger"
            onClick={confirm}
            loading={terminate.isPending}
            disabled={!preview}
          >
            Terminar y desocupar
          </Button>
        )}
        <Button variant="secondary" onClick={close} disabled={terminate.isPending}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
