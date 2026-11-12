import type { IconName } from '@components';

export type Destination = {
  path: string;
  label: string;
  icon: IconName;
};

/** Orden fijo de F-10. En celular, Contratos vive dentro de Más (F-09, G-04). */
export const DESTINATIONS: readonly Destination[] = [
  { path: '/', label: 'Inicio', icon: 'home' },
  { path: '/inquilinos', label: 'Inquilinos', icon: 'tenants' },
  { path: '/movimientos', label: 'Movimientos', icon: 'movements' },
  { path: '/propiedades', label: 'Propiedades', icon: 'properties' },
  { path: '/contratos', label: 'Contratos', icon: 'contracts' },
];

export const MOBILE_PRIMARY = DESTINATIONS.slice(0, 4);
export const MOBILE_MORE = DESTINATIONS.slice(4);

export const isActivePath = (current: string, path: string) =>
  path === '/' ? current === '/' : current === path || current.startsWith(`${path}/`);
