import { useState } from 'react';
import styled from 'styled-components';
import { isAppError } from '@api/errors';
import type { Unit } from '@api/units';
import { Button, Dialog, DialogActions, Notice } from '@components';
import { useUpdateUnit } from '@hooks/querys/units';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';

const List = styled.ul`
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 4px;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

const COPY = {
  maintenance: {
    title: (name: string) => `¿Enviar ${name} a mantenimiento?`,
    points: [
      'Dejará de estar Disponible.',
      'No podrá recibir un contrato mientras esté En mantenimiento.',
      'Se conservan su historial, gastos y notas.',
    ],
    action: 'Enviar a mantenimiento',
    result: (name: string) => ({
      title: `${name} está En mantenimiento`,
      body: 'Cuando esté lista, usa Marcar como disponible.',
    }),
  },
  available: {
    title: (name: string) => `¿Marcar ${name} como disponible?`,
    points: [
      'Quedará Disponible.',
      'Podrá recibir un nuevo contrato.',
      'Se conservan su historial, gastos y notas.',
    ],
    action: 'Marcar como disponible',
    result: (name: string) => ({
      title: `${name} está Disponible`,
      body: 'Ya puedes crear su contrato.',
    }),
  },
} as const;

type UnitStatusDialogProps = {
  unit: Unit;
  /** Nombre como se muestra (casa o bodega: el de la propiedad). */
  name: string;
  target: 'maintenance' | 'available' | null;
  onClose: () => void;
  onDone: (result: { title: string; body: string }) => void;
};

/** U-04 Enviar a mantenimiento y U-05 Marcar como disponible: confirmación y resultado. */
export function UnitStatusDialog({ unit, name, target, onClose, onDone }: UnitStatusDialogProps) {
  const update = useUpdateUnit();
  const events = useInvalidateEvents();
  const [failure, setFailure] = useState<{
    title: string;
    uncertain: boolean;
    requestId?: string;
  } | null>(null);
  const copy = target ? COPY[target] : null;

  const close = () => {
    setFailure(null);
    onClose();
  };

  const confirm = () => {
    if (!target || !copy) return;
    setFailure(null);
    update.mutate(
      { unitId: unit.id, changes: { status: target } },
      {
        onSuccess: () => {
          void events.unitChanged();
          onDone(copy.result(name));
          onClose();
        },
        onError: error => {
          const uncertain = isAppError(error) && error.type === 'uncertain';
          setFailure({
            uncertain,
            title: uncertain
              ? 'No pudimos confirmar si se guardó. Revisa la unidad antes de intentarlo otra vez.'
              : isAppError(error) && error.code === 'UNIT_HAS_CURRENT_OCCUPANCY'
                ? `${name} tiene un contrato actual: no puede cambiar de estado.`
                : `No cambiamos el estado de ${name}. ${isAppError(error) ? error.safeMessage : 'Inténtalo de nuevo.'}`,
            requestId: isAppError(error) ? error.requestId : undefined,
          });
        },
      },
    );
  };

  return (
    <Dialog
      open={target !== null}
      title={copy?.title(name) ?? ''}
      onClose={close}
      busy={update.isPending}
    >
      {copy ? (
        <>
          <List>
            {copy.points.map(point => (
              <li key={point}>{point}</li>
            ))}
          </List>
          {failure ? (
            <Notice
              tone={failure.uncertain ? 'uncertain' : 'error'}
              title={failure.title}
              requestId={failure.requestId}
            />
          ) : null}
          <DialogActions>
            <Button loading={update.isPending} onClick={confirm} disabled={failure?.uncertain}>
              {copy.action}
            </Button>
            <Button
              variant="neutral"
              disabled={update.isPending}
              onClick={close}
              data-initial-focus
            >
              Cancelar
            </Button>
          </DialogActions>
        </>
      ) : null}
    </Dialog>
  );
}
