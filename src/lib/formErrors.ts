import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { isAppError } from '@api/errors';

/** Texto amable por campo; puede variar según el código del campo (por ejemplo IS_DIFFERENT_FROM). */
export type FieldMessage = string | ({ default: string } & Record<string, string>);

const messageFor = (message: FieldMessage, code: string) =>
  typeof message === 'string' ? message : (message[code] ?? message.default);

/**
 * Lleva los errores por campo de un 422 a react-hook-form con textos propios y amables
 * (nunca el mensaje del backend). Devuelve true si marcó algún campo.
 */
export const applyFieldErrors = <TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
  messages: Partial<Record<Path<TValues>, FieldMessage>>,
) => {
  if (!isAppError(error)) return false;
  let applied = false;
  for (const item of error.fields) {
    const message = messages[item.field as Path<TValues>];
    if (!message) continue;
    setError(
      item.field as Path<TValues>,
      { type: 'server', message: messageFor(message, item.code) },
      { shouldFocus: !applied },
    );
    applied = true;
  }
  return applied;
};
