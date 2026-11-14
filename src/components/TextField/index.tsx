import {
  useId,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type FocusEvent,
  type ReactNode,
} from 'react';
import { formatMoneyInput, maskCaret, sanitizeDigits, sanitizePhone } from '@lib/numericInput';
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
   * phone: teléfono de México, máximo 10 dígitos con máscara "55 12 34 56 78".
   * digits: solo números (cantidad, número inicial, código postal, día); el largo, con maxLength.
   */
  format?: 'money' | 'phone' | 'digits';
};

const INPUT_MODES = { money: 'decimal', phone: 'tel', digits: 'numeric' } as const;

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
    const input = event.currentTarget;
    const caret = input.selectionStart ?? input.value.length;
    const before = input.value;
    if (format === 'phone') {
      // La máscara agrega espacios; el cursor se queda junto al mismo dígito.
      const pasted = (event.nativeEvent as InputEvent).inputType === 'insertFromPaste';
      input.value = sanitizePhone(before, pasted);
      const stripped = before.replace(/\D/g, '').length - input.value.replace(/\D/g, '').length;
      const digitsBefore =
        before.slice(0, caret).replace(/\D/g, '').length - (pasted ? stripped : 0);
      const position = maskCaret(input.value, Math.min(digitsBefore, 10));
      input.setSelectionRange(position, position);
    } else if (format === 'digits') {
      // Letras y símbolos no entran (también al pegar); el cursor se queda junto al mismo dígito.
      const digitsBefore = before.slice(0, caret).replace(/\D/g, '').length;
      input.value = sanitizeDigits(before);
      input.setSelectionRange(digitsBefore, digitsBefore);
    } else if (format === 'money') {
      // Separador de miles mientras se escribe; el cursor sigue junto al mismo dígito.
      input.value = formatMoneyInput(before);
      const usefulBefore = before.slice(0, caret).replace(/[^\d.]/g, '').length;
      const position = maskCaret(input.value, usefulBefore, /[\d.]/);
      input.setSelectionRange(position, position);
    }
    onChange?.(event);
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
          onFocus={onFocus}
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
