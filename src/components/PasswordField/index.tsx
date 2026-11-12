import { useId, useState, type ComponentPropsWithRef } from 'react';
import styled from 'styled-components';
import { Icon } from '../Icon';
import { Control, ErrorText, FieldRoot, Input, Label } from '../TextField/styles';

const ToggleButton = styled.button`
  height: 44px;
  margin-right: -10px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.color.primary600};
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.color.primary50};
  }
`;

type PasswordFieldProps = Omit<ComponentPropsWithRef<'input'>, 'type'> & {
  label?: string;
  error?: string;
};

/** Contraseña de F-03: oculta por defecto, Mostrar/Ocultar de 44 px con aria-pressed. Nunca se guarda. */
export function PasswordField({
  label = 'Contraseña',
  error,
  id,
  ...inputProps
}: PasswordFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const [visible, setVisible] = useState(false);

  return (
    <FieldRoot>
      <Label htmlFor={inputId}>{label}</Label>
      <Control $invalid={Boolean(error)}>
        <Input
          autoComplete="current-password"
          {...inputProps}
          id={inputId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
        />
        <ToggleButton
          type="button"
          aria-pressed={visible}
          aria-controls={inputId}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          onClick={() => setVisible(current => !current)}
        >
          {visible ? 'Ocultar' : 'Mostrar'}
        </ToggleButton>
      </Control>
      {error ? (
        <ErrorText id={errorId}>
          <Icon name="alert" size={16} strokeWidth={2.4} />
          {error}
        </ErrorText>
      ) : null}
    </FieldRoot>
  );
}
