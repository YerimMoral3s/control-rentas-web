import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon, type IconName } from '../Icon';
import { Spinner, StyledButton, type ButtonVariant } from './styles';

type ButtonProps = Omit<ComponentPropsWithRef<'button'>, 'children'> & {
  variant?: ButtonVariant;
  icon?: IconName;
  /** Mientras guarda: deshabilita y muestra `loadingLabel` (por defecto "Guardando…"). */
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  icon,
  loading = false,
  loadingLabel = 'Guardando…',
  fullWidth = false,
  disabled,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <StyledButton
      {...rest}
      type={type}
      $variant={variant}
      $fullWidth={fullWidth}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <Spinner aria-hidden="true" />
      ) : icon ? (
        <Icon name={icon} size={18} strokeWidth={2.2} />
      ) : null}
      {loading ? loadingLabel : children}
    </StyledButton>
  );
}

type ButtonLinkProps = Omit<ComponentPropsWithRef<typeof Link>, 'children'> & {
  variant?: ButtonVariant;
  icon?: IconName;
  fullWidth?: boolean;
  children: ReactNode;
};

/** Navegación con aspecto de botón (por ejemplo, "Crear inquilino" o "Editar"). */
export function ButtonLink({
  variant = 'primary',
  icon,
  fullWidth = false,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <StyledButton
      as={Link}
      {...rest}
      $variant={variant}
      $fullWidth={fullWidth}
      style={{ textDecoration: 'none' }}
    >
      {icon ? <Icon name={icon} size={18} strokeWidth={2.2} /> : null}
      {children}
    </StyledButton>
  );
}
