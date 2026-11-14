import { useLocation, useNavigate } from 'react-router';

/** F-08: resultado de una acción que se muestra en la pantalla de destino hasta cerrarlo. */
export type ResultMessage = { title: string; body?: string };

type StateWithResult = { result?: ResultMessage } | null;

/** Para navegar con un resultado: `navigate(to, { state: withResult({...}) })`. */
export const withResult = (result: ResultMessage) => ({ result });

/**
 * Lee el resultado que trajo la navegación. Permanece hasta cerrarlo o salir de la pantalla;
 * al cerrar se quita del historial para que no reaparezca al volver.
 */
export const useResultNotice = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = (location.state as StateWithResult)?.result;
  const dismiss = () => {
    const rest = { ...((location.state as Record<string, unknown> | null) ?? {}) };
    delete rest.result;
    void navigate(`${location.pathname}${location.search}`, { replace: true, state: rest });
  };
  return { result, dismiss };
};
