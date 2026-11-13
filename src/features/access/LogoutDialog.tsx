import { useNavigate } from 'react-router';
import styled from 'styled-components';
import { Button, Dialog, DialogActions } from '@components';
import { useLogout } from '@hooks/querys/auth';
import { clearSessionData } from '@session/session';
import { broadcastSession } from '@session/sessionChannel';
import { useAuth } from '@stores';

const Text = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

type LogoutDialogProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * G-05: confirma antes de salir. Al confirmar se invalida la sesión de esta cuenta, se retiran
 * sus datos locales y se abre el acceso vacío. Cancelar conserva la sesión y la tarea.
 */
export function LogoutDialog({ open, onClose }: LogoutDialogProps) {
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  const confirm = () => {
    const accountId = useAuth.getState().account?.id;
    // Aunque falle la conexión, esta pestaña deja de usar la sesión.
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        clearSessionData();
        if (accountId) broadcastSession({ type: 'logout', accountId });
        navigate('/acceso', { replace: true });
      },
    });
  };

  return (
    <Dialog open={open} title="Cerrar sesión" onClose={onClose} busy={logoutMutation.isPending}>
      <Text>
        Saldrás de Rentario en este dispositivo. Para volver necesitarás tu correo y contraseña. Lo
        que no hayas guardado se descartará.
      </Text>
      <DialogActions>
        <Button
          loading={logoutMutation.isPending}
          loadingLabel="Cerrando sesión…"
          onClick={confirm}
        >
          Cerrar sesión
        </Button>
        <Button variant="neutral" disabled={logoutMutation.isPending} onClick={onClose}>
          Cancelar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
