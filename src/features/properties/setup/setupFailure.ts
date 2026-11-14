import { isAppError } from '@api/errors';

export type SetupFailure = {
  title: string;
  body?: string;
  tone: 'error' | 'uncertain';
  requestId?: string;
};

/** Mensajes propios por código de dominio (nunca el texto del backend). */
const CODE_MESSAGES: Record<string, string> = {
  UNIT_NAME_ALREADY_EXISTS: 'Ya hay una unidad con ese nombre en esta propiedad. Usa otro número.',
  UNIT_TYPE_NOT_ALLOWED: 'Este tipo de propiedad no admite ese tipo de unidad.',
  PROPERTY_SINGLE_UNIT_REQUIRED: 'Este tipo de propiedad tiene una sola unidad.',
  PROPERTY_BULK_UNITS_NOT_ALLOWED: 'Este tipo de propiedad tiene una sola unidad.',
  PROPERTY_CONFIGURATION_INCOMPLETE: 'Aún hay unidades sin revisar.',
};

/**
 * Un guardado del recorrido que falló. Si no sabemos si terminó, no se repite solo: se pide
 * revisar primero cómo quedó.
 */
export const setupFailure = (
  error: unknown,
  notSaved: string,
  markedFields = false,
): SetupFailure => {
  if (!isAppError(error))
    return { tone: 'error', title: notSaved, body: 'Lo que escribiste sigue aquí.' };
  if (error.type === 'uncertain')
    return {
      tone: 'uncertain',
      title: 'No pudimos confirmar si se guardó',
      body: 'Revisa cómo quedó la propiedad antes de intentarlo otra vez, para no repetirlo.',
      requestId: error.requestId,
    };
  if (markedFields)
    return {
      tone: 'error',
      title: notSaved,
      body: 'Revisa los datos marcados. Lo que escribiste sigue aquí.',
    };
  return {
    tone: 'error',
    title: notSaved,
    body: `${CODE_MESSAGES[error.code] ?? error.safeMessage} Lo que escribiste sigue aquí.`,
  };
};
