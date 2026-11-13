import {
  useId,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type FocusEvent,
  type ReactNode,
} from 'react';
import { formatMoneyInput, sanitizeMoney, sanitizePhone } from '@lib/numericInput';
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
  /**
   * money: solo dígitos y punto (2 decimales), con separador de miles al salir del campo.
   * phone: solo dígitos y espacios.
   */
  format?: 'money' | 'phone';
};

const SANITIZERS = { money: sanitizeMoney, phone: sanitizePhone } as const;
const INPUT_MODES = { money: 'decimal', phone: 'tel' } as const;

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
  format,
  onChange,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helpId = help ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  // Se limpia el valor del propio input antes de avisar al formulario (funciona también con react-hook-form).
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (format) event.currentTarget.value = SANITIZERS[format](event.currentTarget.value);
    onChange?.(event);
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    if (format === 'money') event.currentTarget.value = sanitizeMoney(event.currentTarget.value);
    onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (format === 'money') event.currentTarget.value = formatMoneyInput(event.currentTarget.value);
    onBlur?.(event);
  };

  return (
    <FieldRoot>
      <Label htmlFor={inputId}>{label}</Label>
      <Control $invalid={Boolean(error)} $readOnly={readOnly}>
        {prefix ? <Prefix aria-hidden="true">{prefix}</Prefix> : null}
        <Input
          inputMode={format ? INPUT_MODES[format] : undefined}
          {...inputProps}
          id={inputId}
          readOnly={readOnly}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
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
