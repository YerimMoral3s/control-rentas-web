const MAX_OPERATION_LENGTH = 40;

/**
 * Identificador por petición para rastrear errores con el backend
 * (control-rentas-api/docs/error_tracking_and_debugging.md).
 * Formato: req_front_<operacion>_<uuid>. Nunca incluye datos personales ni tokens.
 */
export const createRequestId = (operation = 'request'): string => {
  const safeOperation =
    operation
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, MAX_OPERATION_LENGTH) || 'request';

  return `req_front_${safeOperation}_${crypto.randomUUID().replace(/-/g, '')}`;
};
