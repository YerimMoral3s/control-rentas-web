import { useNavigate, useSearchParams } from 'react-router';
import { withResult } from '@lib/useResultNotice';
import type { SetupStep } from './setupText';

/**
 * Rutas del recorrido. `?desde=inicio` (H-10 Configurar mis rentas) se conserva en cada paso:
 * solo cambia el regreso final (P-12).
 */
export const useSetupNavigation = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fromHome = params.get('desde') === 'inicio';
  const suffix = fromHome ? '?desde=inicio' : '';

  const stepPath = (propertyId: string, step: SetupStep | 'listo') =>
    `/propiedades/${propertyId}/configurar/${step}${suffix}`;

  return {
    fromHome,
    stepPath,
    /** P-10: renta actual de una unidad marcada Rentada. */
    rentPath: (propertyId: string, unitId: string) =>
      `/propiedades/${propertyId}/configurar/renta/${unitId}${suffix}`,
    goToStep: (propertyId: string, step: SetupStep | 'listo', replace = false) =>
      void navigate(stepPath(propertyId, step), { replace }),
    /** Guardar y salir (P-13): todo ya está guardado; vuelve a Propiedades con el aviso. */
    exit: () =>
      void navigate('/propiedades', {
        state: withResult({
          title: 'Guardamos tu avance.',
          body: 'Continúa cuando quieras desde Propiedades.',
        }),
      }),
    cancel: () => void navigate(fromHome ? '/' : '/propiedades'),
  };
};
