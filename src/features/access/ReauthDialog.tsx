import { useState } from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { Button, Dialog, PasswordField, TextField } from '@components';
import { useLogin } from '@hooks/querys/auth';
import { startSession } from '@session/session';
import { useAuth } from '@stores';
import { describeLoginError, PASSWORD_RULES } from './loginErrors';

const Text = styled.p`
  margin: 0 0 16px;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral700};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

type ReauthValues = { password: string };

type ReauthDialogProps = {
  /** Se llama tras volver a entrar con la misma cuenta. */
  onReturned: () => void;
};

/**
 * G-03: la sesión ya no puede renovarse. El contenido queda inerte detrás; solo se pide la
 * contraseña y el correo se muestra como contexto no editable. Sin Cancelar: no hay otra salida segura.
 */
export function ReauthDialog({ onReturned }: ReauthDialogProps) {
  const status = useAuth(state => state.status);
  const account = useAuth(state => state.account);
  const [failure, setFailure] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    resetField,
    setFocus,
    formState: { errors },
  } = useForm<ReauthValues>({ defaultValues: { password: '' } });
  const loginMutation = useLogin();

  if (status !== 'expired' || !account) return null;

  const submit = handleSubmit(({ password }) => {
    setFailure(null);
    loginMutation.mutate(
      { email: account.email, password },
      {
        onSuccess: ({ data }) => {
          resetField('password');
          startSession(data.account, data.session);
          onReturned();
        },
        onError: error => {
          setFailure(describeLoginError(error).message);
          resetField('password');
          setTimeout(() => setFocus('password'), 0);
        },
      },
    );
  });

  return (
    <Dialog open centered dismissible={false} title="Tu sesión terminó" onClose={() => undefined}>
      <Text>
        Por seguridad, vuelve a escribir tu contraseña. Si vuelves a entrar con esta cuenta, lo que
        capturaste sigue aquí; podrás revisarlo antes de guardar.
      </Text>
      <Form noValidate onSubmit={submit}>
        <TextField label="Cuenta" value={account.email} readOnly />
        <PasswordField
          data-initial-focus
          disabled={loginMutation.isPending}
          error={errors.password?.message ?? failure ?? undefined}
          {...register('password', PASSWORD_RULES)}
        />
        <Button type="submit" fullWidth loading={loginMutation.isPending} loadingLabel="Entrando…">
          Volver a entrar
        </Button>
      </Form>
    </Dialog>
  );
}
