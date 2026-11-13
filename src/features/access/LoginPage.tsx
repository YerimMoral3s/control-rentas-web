import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router';
import styled from 'styled-components';
import { Button, Logo, Notice, PasswordField, TextField } from '@components';
import { useLogin } from '@hooks/querys/auth';
import { startSession } from '@session/session';
import { useAuth } from '@stores';
import { media, theme } from '@styles/theme';
import { describeLoginError, EMAIL_RULES, PASSWORD_RULES, type LoginFailure } from './loginErrors';

const Page = styled.div`
  min-height: 100dvh;
  background: ${({ theme }) => theme.color.neutral50};

  ${media.desktop} {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
  }
`;

const Card = styled.main`
  padding: 96px 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;

  ${media.desktop} {
    width: 440px;
    padding: 40px;
    gap: 28px;
    background: ${({ theme }) => theme.color.white};
    border: 1px solid ${({ theme }) => theme.color.neutral200};
    border-radius: ${({ theme }) => theme.radius.panel};
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
  }
`;

const Heading = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LogoSlot = styled.div`
  margin-bottom: 16px;

  .logo-desktop {
    display: none;
  }

  ${media.desktop} {
    .logo-mobile {
      display: none;
    }
    .logo-desktop {
      display: block;
    }
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  line-height: 34px;
  font-weight: 700;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 22px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

type LoginValues = { email: string; password: string };

/** G-01 / G-02: acceso con correo y contraseña. Abre vacío, sin credenciales precargadas. */
export function LoginPage() {
  const status = useAuth(state => state.status);
  const navigate = useNavigate();
  const [failure, setFailure] = useState<LoginFailure | null>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const {
    register,
    handleSubmit,
    resetField,
    setFocus,
    formState: { errors },
  } = useForm<LoginValues>({ defaultValues: { email: '', password: '' } });
  const loginMutation = useLogin();

  // En computadora el foco inicia en Correo electrónico (G-01); en celular no se abre el teclado solo.
  useEffect(() => {
    if (window.matchMedia(`(min-width: ${theme.breakpoint.desktop})`).matches) setFocus('email');
  }, [setFocus]);

  // G-02: con datos incorrectos el foco va a Contraseña; sin conexión, a Intentar de nuevo.
  useEffect(() => {
    if (failure?.kind === 'credentials') setFocus('password');
    if (failure?.kind === 'connection') retryRef.current?.focus();
  }, [failure, setFocus]);

  if (status === 'authenticated') return <Navigate to="/" replace />;

  const submit = handleSubmit(values => {
    setFailure(null);
    loginMutation.mutate(values, {
      onSuccess: ({ data }) => {
        startSession(data.account, data.session);
        navigate('/', { replace: true });
      },
      onError: error => {
        const result = describeLoginError(error);
        // Se conserva el correo; la contraseña se vacía (el foco se mueve en el efecto de abajo).
        if (result.kind === 'credentials') resetField('password');
        setFailure(result);
      },
    });
  });

  const saving = loginMutation.isPending;

  return (
    <Page>
      <Card>
        <Heading>
          <LogoSlot>
            <span className="logo-mobile">
              <Logo width={190} />
            </span>
            <span className="logo-desktop">
              <Logo width={220} />
            </span>
          </LogoSlot>
          <Title>Entrar</Title>
          <Subtitle>Escribe tu correo y contraseña para ver tus rentas.</Subtitle>
        </Heading>

        <Form noValidate onSubmit={submit}>
          {failure && failure.kind !== 'credentials' ? (
            <Notice
              tone="error"
              title={failure.message}
              action={
                failure.kind === 'connection' ? (
                  <Button ref={retryRef} variant="neutral" onClick={() => void submit()}>
                    Intentar de nuevo
                  </Button>
                ) : undefined
              }
            />
          ) : null}

          <TextField
            label="Correo electrónico"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            disabled={saving}
            error={errors.email?.message}
            {...register('email', EMAIL_RULES)}
          />
          <PasswordField
            disabled={saving}
            error={
              errors.password?.message ??
              (failure?.kind === 'credentials' ? failure.message : undefined)
            }
            {...register('password', PASSWORD_RULES)}
          />

          <Button type="submit" fullWidth loading={saving} loadingLabel="Entrando…">
            Iniciar sesión
          </Button>
        </Form>
      </Card>
    </Page>
  );
}
