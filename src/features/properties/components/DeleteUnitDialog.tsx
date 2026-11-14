import { useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { isAppError } from '@api/errors';
import type { Unit } from '@api/units';
import { Button, ButtonLink, Dialog, DialogActions, Notice } from '@components';
import { useDeactivateUnit } from '@hooks/querys/units';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { withResult } from '@lib/useResultNotice';

const Text = styled.p`
  margin: 0 0 8px;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

type DeleteUnitDialogProps = {
  unit: Unit;
  open: boolean;
  onClose: () => void;
};

/**
 * P-15 Eliminar unidad (baja lógica). Si alguien la renta (contrato Activo o Vencido) se muestra el
 * bloqueo sin confirmación. Al eliminar vuelve a su propiedad con el resultado.
 */
export function DeleteUnitDialog({ unit, open, onClose }: DeleteUnitDialogProps) {
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const deactivate = useDeactivateUnit();
  const [serverBlocked, setServerBlocked] = useState(false);
  const [failure, setFailure] = useState<{
    title: string;
    uncertain: boolean;
    requestId?: string;
  } | null>(null);
  const blocked = serverBlocked || Boolean(unit.current_contract);

  const close = () => {
    setFailure(null);
    setServerBlocked(false);
    onClose();
  };

  const confirm = () => {
    setFailure(null);
    deactivate.mutate(unit.id, {
      onSuccess: () => {
        void navigate(`/propiedades/${unit.property.id}`, {
          replace: true,
          state: withResult({ title: `${unit.name} se eliminó` }),
        });
        void events.unitChanged();
      },
      onError: error => {
        if (isAppError(error) && error.code === 'UNIT_HAS_CURRENT_OCCUPANCY') {
          setServerBlocked(true);
          void events.unitChanged();
          return;
        }
        const uncertain = isAppError(error) && error.type === 'uncertain';
        setFailure({
          uncertain,
          title: uncertain
            ? 'No pudimos confirmar si se eliminó. Revisa la propiedad antes de intentarlo otra vez.'
            : `No eliminamos ${unit.name}. ${isAppError(error) ? error.safeMessage : 'Inténtalo de nuevo.'}`,
          requestId: isAppError(error) ? error.requestId : undefined,
        });
      },
    });
  };

  return (
    <Dialog
      open={open}
      title={blocked ? `No puedes eliminar ${unit.name} todavía` : `¿Eliminar ${unit.name}?`}
      onClose={close}
      busy={deactivate.isPending}
    >
      {blocked ? (
        <>
          <Text>
            {unit.current_contract?.status === 'expired'
              ? 'Alguien la renta hoy. Su contrato está Vencido, pero todavía es el contrato actual. Primero termina y desocupa el contrato.'
              : 'Alguien la renta hoy. Primero termina y desocupa su contrato.'}
          </Text>
          <DialogActions>
            {unit.current_contract ? (
              <ButtonLink variant="secondary" to={`/contratos/${unit.current_contract.id}`}>
                Ver contrato actual
              </ButtonLink>
            ) : null}
            <Button variant="neutral" onClick={close} data-initial-focus>
              Cerrar
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <Text>
            Dejará de aparecer en {unit.property.name} y en las búsquedas. Se conservan sus
            contratos anteriores, gastos y notas.
          </Text>
          {failure ? (
            <Notice
              tone={failure.uncertain ? 'uncertain' : 'error'}
              title={failure.title}
              requestId={failure.requestId}
            />
          ) : null}
          <DialogActions>
            <Button
              variant="danger"
              loading={deactivate.isPending}
              loadingLabel="Eliminando…"
              onClick={confirm}
              disabled={failure?.uncertain}
            >
              Eliminar unidad
            </Button>
            <Button
              variant="neutral"
              disabled={deactivate.isPending}
              onClick={close}
              data-initial-focus
            >
              Cancelar
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
