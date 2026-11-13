import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { ThemeProvider } from 'styled-components';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@api/errors';
import { useAuth } from '@stores';
import { theme } from '@styles/theme';
import { LoginPage } from './LoginPage';

const login = vi.hoisted(() => vi.fn());
vi.mock('@api/auth', () => ({ login, logout: vi.fn(), refreshTokens: vi.fn() }));

// MemoryRouter (sin router de datos): en jsdom el router de datos crea Request de Node con un
// AbortSignal de jsdom y falla al navegar. Para estas pruebas basta la navegación básica.
const renderLogin = () =>
  render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/acceso']}>
          <Routes>
            <Route path="/acceso" element={<LoginPage />} />
            <Route path="/" element={<p>Inicio de la cuenta</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );

beforeEach(() => {
  login.mockReset();
  useAuth.getState().reset();
});

describe('LoginPage', () => {
  it('abre vacío y no envía nada si faltan datos', async () => {
    renderLogin();

    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('');

    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Escribe tu correo.')).toBeInTheDocument();
    expect(screen.getByText('Escribe tu contraseña.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('con datos incorrectos conserva el correo, vacía la contraseña y le da el foco', async () => {
    login.mockRejectedValue(new AppError({ type: 'authentication', code: 'INVALID_CREDENTIALS' }));
    renderLogin();

    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'cliente@rentario.test');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Incorrecta#1');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(
      await screen.findByText('No pudimos iniciar sesión. Revisa tu correo y contraseña.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Correo electrónico')).toHaveValue('cliente@rentario.test');
    const password = screen.getByLabelText('Contraseña');
    expect(password).toHaveValue('');
    await waitFor(() => expect(password).toHaveFocus());
  });

  it('con datos correctos inicia la sesión de esa cuenta y abre Inicio', async () => {
    login.mockResolvedValue({
      data: {
        account: { id: 'a', email: 'cliente@rentario.test' },
        session: {
          access_token: 'acc',
          refresh_token: 'ref',
          token_type: 'Bearer',
          expires_in: 900,
          session_expires_at: new Date(Date.now() + 7_200_000).toISOString(),
        },
      },
      meta: { request_id: 'r' },
    });
    renderLogin();

    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'cliente@rentario.test');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Correcta#1');
    await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Inicio de la cuenta')).toBeInTheDocument();
    expect(useAuth.getState()).toMatchObject({ status: 'authenticated', accessToken: 'acc' });
    expect(sessionStorage.getItem('rentario-session')).not.toContain('Correcta#1');
  });
});
