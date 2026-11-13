import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { login, logout, type LoginRequest, type LoginResponse } from '@api/auth';
import type { AppError } from '@api/errors';
import type { ApiSuccess } from '@api/types';

type LoginMutationOptions = Omit<
  UseMutationOptions<ApiSuccess<LoginResponse>, AppError, LoginRequest>,
  'mutationFn'
>;

/** Iniciar sesión o reautenticar. La contraseña solo viaja en esta petición; nunca se guarda. */
export const useLogin = (options?: LoginMutationOptions) =>
  useMutation({ ...options, retry: false, mutationFn: login });

type LogoutMutationOptions = Omit<
  UseMutationOptions<ApiSuccess<{ logged_out: boolean }>, AppError, void>,
  'mutationFn'
>;

export const useLogout = (options?: LogoutMutationOptions) =>
  useMutation({ ...options, retry: false, mutationFn: () => logout() });
