import { useSyncExternalStore } from 'react';

/** true mientras la consulta de medios se cumple; se actualiza al cambiar el tamaño de la ventana. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    onChange => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
