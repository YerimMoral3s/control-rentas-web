import { useAuth } from '@stores';

declare global {
  interface Window {
    rentarioDev?: {
      /** Solo desarrollo: adelanta el fin de la sesión para probar G-03 sin esperar 2 horas. */
      expireSessionIn: (seconds: number) => void;
    };
  }
}

/**
 * Herramienta de desarrollo (no existe en producción). Cambia solo la hora límite que conoce
 * esta pestaña; el backend conserva su propio plazo.
 */
export const installDevTools = () => {
  window.rentarioDev = {
    expireSessionIn: seconds => {
      useAuth.setState({ sessionExpiresAt: new Date(Date.now() + seconds * 1000).toISOString() });
    },
  };
};
