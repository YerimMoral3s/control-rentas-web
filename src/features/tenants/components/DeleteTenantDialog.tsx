import { useState } from 'react';
import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { isAppError } from '@api/errors';
import type { Tenant } from '@api/tenants';
import { Button, Dialog, DialogActions, Notice } from '@components';
import { useDeactivateTenant } from '@hooks/querys/tenants';
import { useInvalidateEvents } from '@hooks/querys/useInvalidateEvents';
import { formatMoney } from '@lib/format';
import { withResult } from '@lib/useResultNotice';
import { fullName, hasOverdueDebt, placeName } from '../tenantText';

const Text = styled.p`
  margin: 0 0 8px;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

/** "A", "A y B", "A, B y C" */
const joinList = (items: string[]) =>
  items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;

/** T-09 bloqueo: renta unidades actualmente (Activo o Vencido). */
function BlockedContent({ tenant, onClose }: { tenant: Tenant; onClose: () => void }) {
  const units = tenant.current_contracts.map(contract => placeName(contract.unit));
  const expired = tenant.current_contracts.filter(contract => contract.status === 'expired');
  return (
    <>
      <Text>Renta {joinList(units)}.</Text>
      {expired.map(contract => (
        <Text key={contract.id}>
          Aunque el contrato de {contract.unit.name} está Vencido, sigue rentándola.
        </Text>
      ))}
      <Text>Primero termina y desocupa cada contrato.</Text>
      <DialogActions>
        <Button variant="neutral" onClick={onClose} data-initial-focus>
          Cerrar
        </Button>
      </DialogActions>
    </>
  );
}

type DeleteTenantDialogProps = {
  tenant: Tenant;
  open: boolean;
  onClose: () => void;
};

/**
 * T-09: Eliminar inquilino (borrado lógico). Bloqueado mientras rente algo; si el servidor lo
 * bloquea (409) se muestra el mismo mensaje. Al eliminar vuelve a Inquilinos con el resultado.
 */
export function DeleteTenantDialog({ tenant, open, onClose }: DeleteTenantDialogProps) {
  const navigate = useNavigate();
  const events = useInvalidateEvents();
  const deactivate = useDeactivateTenant();
  const [serverBlocked, setServerBlocked] = useState(false);
  const [failure, setFailure] = useState<{
    title: string;
    uncertain: boolean;
    requestId?: string;
  } | null>(null);
  const name = fullName(tenant);
  const blocked = serverBlocked || tenant.current_contracts.length > 0;

  const close = () => {
    setFailure(null);
    setServerBlocked(false);
    onClose();
  };

  const confirm = () => {
    setFailure(null);
    deactivate.mutate(tenant.id, {
      onSuccess: () => {
        void events.tenantDeactivated(tenant.id);
        void navigate('/inquilinos', {
          replace: true,
          state: withResult({
            title: `${name} se eliminó`,
            body: hasOverdueDebt(tenant)
              ? `Eliminar al inquilino no cancela sus cobros. Sus pagos atrasados de ${formatMoney(tenant.overdue_debt.amount)} siguen en Pagos por atender y en sus contratos.`
              : undefined,
          }),
        });
      },
      onError: error => {
        if (isAppError(error) && error.code === 'TENANT_HAS_CURRENT_OCCUPANCY') {
          setServerBlocked(true);
          void events.tenantUpdated(tenant.id);
          return;
        }
        const uncertain = isAppError(error) && error.type === 'uncertain';
        setFailure({
          uncertain,
          title: uncertain
            ? 'No pudimos confirmar si se eliminó. Revisa la lista de inquilinos antes de intentarlo otra vez.'
            : `No eliminamos a ${name}. ${isAppError(error) ? error.safeMessage : 'Inténtalo de nuevo.'}`,
          requestId: isAppError(error) ? error.requestId : undefined,
        });
      },
    });
  };

  return (
    <Dialog
      open={open}
      title={blocked ? `No puedes eliminar a ${name} todavía` : `¿Eliminar a ${name}?`}
      onClose={close}
      busy={deactivate.isPending}
    >
      {blocked ? (
        <BlockedContent tenant={tenant} onClose={close} />
      ) : (
        <>
          <Text>
            Ya no aparecerá en Inquilinos ni en las búsquedas. Sus contratos, cobros y notas se
            conservan.
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
            >
              Eliminar inquilino
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
