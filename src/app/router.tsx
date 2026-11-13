import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppErrorScreen } from '@features/pending/AppErrorScreen';
import { MorePage } from '@features/pending/MorePage';
import { PendingScreen } from '@features/pending/PendingScreen';
import { LoginPage } from '@features/access/LoginPage';
import { HomePage } from '@features/home/HomePage';
import { TenantDetailPage } from '@features/tenants/TenantDetailPage';
import { TenantsPage } from '@features/tenants/TenantsPage';
import { ProtectedLayout } from './ProtectedLayout';

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
  { path: 'acceso', element: <LoginPage />, errorElement: <AppErrorScreen /> },
  {
    element: <ProtectedLayout />,
    errorElement: <AppErrorScreen />,
    // La galería de desarrollo se carga en diferido; mientras tanto no se muestra nada extra.
    HydrateFallback: () => null,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'inquilinos', element: <TenantsPage /> },
      { path: 'inquilinos/:tenantId', element: <TenantDetailPage /> },
      { path: 'movimientos', element: <PendingScreen title="Movimientos" /> },
      { path: 'propiedades', element: <PendingScreen title="Propiedades" /> },
      { path: 'contratos', element: <PendingScreen title="Contratos" /> },
      { path: 'cobros/:paymentId', element: <PendingScreen title="Detalle del cobro" /> },
      { path: 'contratos/:contractId', element: <PendingScreen title="Detalle del contrato" /> },
      { path: 'unidades/:unitId', element: <PendingScreen title="Detalle de la unidad" /> },
      { path: 'mas', element: <MorePage /> },
      ...devRoutes,
      { path: '*', element: <PendingScreen title="No encontramos esta página" /> },
    ],
  },
]);
