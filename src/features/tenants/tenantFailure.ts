import { isAppError } from '@api/errors';

export type SubmitFailure = {
  title: string;
  body?: string;
  tone: 'error' | 'uncertain';
  requestId?: string;
};

/**
 * Resultado de un guardado que falló. Si no sabemos si se guardó, no se reintenta solo: se pide
 * revisar antes (y se ofrece la referencia de ayuda).
 */
export const tenantFailure = (
  error: unknown,
  action: 'create' | 'update',
  markedFields: boolean,
): SubmitFailure => {
  const notSaved = action === 'create' ? 'No creamos el inquilino.' : 'No guardamos los cambios.';
  if (!isAppError(error))
    return { tone: 'error', title: notSaved, body: 'Lo que escribiste se conserva.' };
  if (error.type === 'uncertain') {
    return {
      tone: 'uncertain',
      title:
        action === 'create'
          ? 'No pudimos confirmar si se creó el inquilino'
          : 'No pudimos confirmar si se guardaron los cambios',
      body:
        action === 'create'
          ? 'Revisa la lista de inquilinos antes de intentarlo otra vez, para no repetirlo.'
          : 'Revisa el detalle del inquilino antes de intentarlo otra vez.',
      requestId: error.requestId,
    };
  }
  if (markedFields)
    return {
      tone: 'error',
      title: notSaved,
      body: 'Revisa los datos marcados. Lo que escribiste se conserva.',
    };
  return {
    tone: 'error',
    title: notSaved,
    body: `${error.safeMessage} Lo que escribiste se conserva.`,
  };
};
