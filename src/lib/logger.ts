/**
 * Registro solo para desarrollo y pruebas. Nunca recibe contraseñas, tokens ni datos personales:
 * quien llama solo envía pantalla, acción, endpoint, código, estado y requestId.
 */
type LogContext = Record<string, string | number | boolean | null | undefined>;

const isEnabled = import.meta.env.DEV;

export const logger = {
  warn(event: string, context?: LogContext) {
    if (isEnabled) console.warn(`[Rentario] ${event}`, context ?? {});
  },
  error(event: string, context?: LogContext) {
    if (isEnabled) console.error(`[Rentario] ${event}`, context ?? {});
  },
};
