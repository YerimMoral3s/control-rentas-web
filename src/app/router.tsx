import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppErrorScreen } from '@features/pending/AppErrorScreen';
import { MorePage } from '@features/pending/MorePage';
import { PendingScreen } from '@features/pending/PendingScreen';
import { LoginPage } from '@features/access/LoginPage';
import { ContractDetailPage } from '@features/contracts/ContractDetailPage';
import { ContractsPage } from '@features/contracts/ContractsPage';
import { ExpenseDetailPage } from '@features/expenses/ExpenseDetailPage';
import { HomePage } from '@features/home/HomePage';
import { MovementsPage } from '@features/movements/MovementsPage';
import { PaymentDetailPage } from '@features/payments/PaymentDetailPage';
import { PropertiesPage } from '@features/properties/PropertiesPage';
import { PropertyDetailPage } from '@features/properties/PropertyDetailPage';
import { UnitDetailPage } from '@features/properties/UnitDetailPage';
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
      { path: 'movimientos', element: <MovementsPage /> },
      { path: 'gastos/:expenseId', element: <ExpenseDetailPage /> },
      { path: 'propiedades', element: <PropertiesPage /> },
      { path: 'propiedades/:propertyId', element: <PropertyDetailPage /> },
      { path: 'contratos', element: <ContractsPage /> },
      { path: 'cobros/:paymentId', element: <PaymentDetailPage /> },
      { path: 'contratos/:contractId', element: <ContractDetailPage /> },
      { path: 'unidades/:unitId', element: <UnitDetailPage /> },
      { path: 'mas', element: <MorePage /> },
      ...devRoutes,
      { path: '*', element: <PendingScreen title="No encontramos esta página" /> },
    ],
  },
]);
