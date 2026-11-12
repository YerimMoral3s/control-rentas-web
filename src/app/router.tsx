import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppErrorScreen } from '@features/pending/AppErrorScreen';
import { MorePage } from '@features/pending/MorePage';
import { PendingScreen } from '@features/pending/PendingScreen';
import { AppShell } from './AppShell';

const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: 'dev/fundamentos',
        lazy: async () => {
          const { FundamentalsPage } = await import('@features/fundamentals/FundamentalsPage');
          return { Component: FundamentalsPage };
        },
      },
    ]
  : [];

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <AppErrorScreen />,
    // La galería de desarrollo se carga en diferido; mientras tanto no se muestra nada extra.
    HydrateFallback: () => null,
    children: [
      { index: true, element: <PendingScreen title="Inicio" /> },
      { path: 'inquilinos', element: <PendingScreen title="Inquilinos" /> },
      { path: 'movimientos', element: <PendingScreen title="Movimientos" /> },
      { path: 'propiedades', element: <PendingScreen title="Propiedades" /> },
      { path: 'contratos', element: <PendingScreen title="Contratos" /> },
      { path: 'mas', element: <MorePage /> },
      ...devRoutes,
      { path: '*', element: <PendingScreen title="No encontramos esta página" /> },
    ],
  },
]);
