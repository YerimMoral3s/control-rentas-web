import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { Icon } from '../Icon';
import {
  Control,
  ErrorText,
  FieldRoot,
  Help,
  Input,
  Label,
  Prefix,
  Suffix,
  TrailingIcon,
} from './styles';

type TextFieldProps = Omit<ComponentPropsWithRef<'input'>, 'prefix'> & {
  label: string;
  help?: string;
  /** Mensaje amable que explica cómo corregir; la captura se conserva. */
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
};

/**
 * Campo de F-03. La etiqueta siempre visible; ayuda y error debajo.
 * Solo lectura (protegido) usa borde punteado y candado.
 */
export function TextField({
  label,
  help,
  error,
  prefix,
  suffix,
  readOnly,
  id,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helpId = help ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  return (
    <FieldRoot>
      <Label htmlFor={inputId}>{label}</Label>
      <Control $invalid={Boolean(error)} $readOnly={readOnly}>
        {prefix ? <Prefix aria-hidden="true">{prefix}</Prefix> : null}
        <Input
          {...inputProps}
          id={inputId}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {suffix ? <Suffix>{suffix}</Suffix> : null}
        {readOnly ? (
          <TrailingIcon>
            <Icon name="lock" size={18} />
          </TrailingIcon>
        ) : null}
      </Control>
      {error ? (
        <ErrorText id={errorId}>
          <Icon name="alert" size={16} strokeWidth={2.4} />
          {error}
        </ErrorText>
      ) : null}
      {help ? <Help id={helpId}>{help}</Help> : null}
    </FieldRoot>
  );
}
