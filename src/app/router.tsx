import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppErrorScreen } from '@features/pending/AppErrorScreen';
import { MorePage } from '@features/pending/MorePage';
import { PendingScreen } from '@features/pending/PendingScreen';
import { LoginPage } from '@features/access/LoginPage';
import { ContinueContractPage } from '@features/contracts/continue/ContinueContractPage';
import { CreateContractPage } from '@features/contracts/create/CreateContractPage';
import { EditContractPage } from '@features/contracts/edit/EditContractPage';
import { RegisterExistingContractPage } from '@features/contracts/existing/RegisterExistingContractPage';
import { ContractDetailPage } from '@features/contracts/ContractDetailPage';
import { ContractsPage } from '@features/contracts/ContractsPage';
import { ExpenseDetailPage } from '@features/expenses/ExpenseDetailPage';
import { NewExpensePage } from '@features/expenses/create/NewExpensePage';
import { EditExpensePage } from '@features/expenses/edit/EditExpensePage';
import { HistoryListPage } from '@features/movements/history/HistoryListPage';
import { SourceHistoryPage } from '@features/movements/history/SourceHistoryPage';
import { HomePage } from '@features/home/HomePage';
import { MovementsPage } from '@features/movements/MovementsPage';
import { PaymentDetailPage } from '@features/payments/PaymentDetailPage';
import { AddChargePage } from '@features/payments/charges/AddChargePage';
import { RefundDepositPage } from '@features/payments/deposits/RefundDepositPage';
import { AddRentPage } from '@features/payments/manualRent/AddRentPage';
import { PropertiesPage } from '@features/properties/PropertiesPage';
import { PropertyDetailPage } from '@features/properties/PropertyDetailPage';
import { PropertyNewPage, PropertySetupPage } from '@features/properties/setup/PropertySetupPage';
import { CurrentRentPage } from '@features/properties/setup/currentRent/CurrentRentPage';
import { AddUnitsPage } from '@features/properties/edit/AddUnitsPage';
import { PropertyEditPage } from '@features/properties/edit/PropertyEditPage';
import { UnitEditPage } from '@features/properties/edit/UnitEditPage';
import { UnitDetailPage } from '@features/properties/UnitDetailPage';
import { TenantDetailPage } from '@features/tenants/TenantDetailPage';
import { TenantCreatePage } from '@features/tenants/TenantCreatePage';
import { TenantEditPage } from '@features/tenants/TenantEditPage';
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
      { path: 'inquilinos/nuevo', element: <TenantCreatePage /> },
      { path: 'inquilinos/:tenantId', element: <TenantDetailPage /> },
      { path: 'inquilinos/:tenantId/editar', element: <TenantEditPage /> },
      { path: 'movimientos', element: <MovementsPage /> },
      { path: 'gastos/nuevo', element: <NewExpensePage /> },
      { path: 'gastos/:expenseId', element: <ExpenseDetailPage /> },
      { path: 'gastos/:expenseId/editar', element: <EditExpensePage /> },
      { path: 'movimientos/historial', element: <HistoryListPage /> },
      {
        path: 'movimientos/historial/:sourceType/:sourceId',
        element: <SourceHistoryPage />,
      },
      { path: 'propiedades', element: <PropertiesPage /> },
      { path: 'propiedades/nueva', element: <PropertyNewPage /> },
      { path: 'propiedades/:propertyId', element: <PropertyDetailPage /> },
      { path: 'propiedades/:propertyId/editar', element: <PropertyEditPage /> },
      { path: 'propiedades/:propertyId/unidades/agregar', element: <AddUnitsPage /> },
      {
        path: 'propiedades/:propertyId/configurar/renta/:unitId',
        element: <CurrentRentPage />,
      },
      { path: 'propiedades/:propertyId/configurar/:step?', element: <PropertySetupPage /> },
      { path: 'contratos', element: <ContractsPage /> },
      { path: 'contratos/nuevo', element: <CreateContractPage /> },
      { path: 'cobros/:paymentId', element: <PaymentDetailPage /> },
      { path: 'contratos/:contractId', element: <ContractDetailPage /> },
      { path: 'contratos/:contractId/devolver-deposito', element: <RefundDepositPage /> },
      { path: 'contratos/:contractId/agregar-cargo', element: <AddChargePage /> },
      { path: 'contratos/:contractId/agregar-renta', element: <AddRentPage /> },
      { path: 'contratos/:contractId/editar', element: <EditContractPage /> },
      { path: 'contratos/:contractId/continuar', element: <ContinueContractPage /> },
      { path: 'unidades/:unitId', element: <UnitDetailPage /> },
      { path: 'unidades/:unitId/editar', element: <UnitEditPage /> },
      { path: 'unidades/:unitId/contrato-existente', element: <RegisterExistingContractPage /> },
      { path: 'mas', element: <MorePage /> },
      ...devRoutes,
      { path: '*', element: <PendingScreen title="No encontramos esta página" /> },
    ],
  },
]);
