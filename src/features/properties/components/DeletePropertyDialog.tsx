import { useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { isAppError } from '@api/errors';
import type { Property } from '@api/properties';
import { Button, Dialog, DialogActions, Notice } from '@components';
import { useDeactivateProperty } from '@hooks/querys/properties';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { withResult } from '@lib/useResultNotice';
import { unitCountLabel } from '../propertyText';

const Text = styled.p`
  margin: 0 0 8px;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

type DeletePropertyDialogProps = {
  property: Property;
  open: boolean;
  onClose: () => void;
};

/**
 * P-15 Eliminar propiedad (baja lógica) con sus unidades. Confirmación con Cancelar enfocado; si
 * alguien la renta hoy, el servidor la bloquea (409) y se muestra el bloqueo sin otra confirmación.
 */
export function DeletePropertyDialog({ property, open, onClose }: DeletePropertyDialogProps) {
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const deactivate = useDeactivateProperty();
  const [blocked, setBlocked] = useState(false);
  const [failure, setFailure] = useState<{
    title: string;
    uncertain: boolean;
    requestId?: string;
  } | null>(null);
  const total = property.unit_counts.total;

  const close = () => {
    setFailure(null);
    setBlocked(false);
    onClose();
  };

  const confirm = () => {
    setFailure(null);
    deactivate.mutate(property.id, {
      onSuccess: () => {
        void events.propertyDeactivated();
        void navigate('/propiedades', {
          replace: true,
          state: withResult({ title: `${property.name} se eliminó` }),
        });
      },
      onError: error => {
        if (isAppError(error) && error.code === 'PROPERTY_HAS_CURRENT_OCCUPANCIES') {
          setBlocked(true);
          return;
        }
        const uncertain = isAppError(error) && error.type === 'uncertain';
        setFailure({
          uncertain,
          title: uncertain
            ? 'No pudimos confirmar si se eliminó. Revisa la lista de propiedades antes de intentarlo otra vez.'
            : `No eliminamos ${property.name}. ${isAppError(error) ? error.safeMessage : 'Inténtalo de nuevo.'}`,
          requestId: isAppError(error) ? error.requestId : undefined,
        });
      },
    });
  };

  return (
    <Dialog
      open={open}
      title={
        blocked ? `No puedes eliminar ${property.name} todavía` : `¿Eliminar ${property.name}?`
      }
      onClose={close}
      busy={deactivate.isPending}
    >
      {blocked ? (
        <>
          <Text>Alguien renta una de sus unidades. Primero termina y desocupa su contrato.</Text>
          <DialogActions>
            <Button variant="neutral" onClick={close} data-initial-focus>
              Cerrar
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <Text>
            Dejará de aparecer en Propiedades y en las búsquedas
            {total === 1
              ? ', junto con su unidad'
              : total > 1
                ? `, junto con sus ${unitCountLabel(total)}`
                : ''}
            . Se conservan sus gastos, notas y contratos anteriores.
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
              Eliminar propiedad
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
