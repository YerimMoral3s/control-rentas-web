import type { ComponentPropsWithRef, ReactNode } from 'react';
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
