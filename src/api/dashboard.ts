import { apiRequest } from './http';

/** Contrato: apis/dashboard_api_control_rentas.txt */

export type Dashboard = {
  period: { month: string; label: string; from: string; to: string };
  money_summary: {
    expected_income: string;
    collected_income: string;
    pending_income: string;
    overdue_income: string;
    expenses: string;
    net: string;
    collection_rate: number;
  };
  rental_summary: {
    properties_active: number;
    units_total: number;
    units_occupied: number;
    units_available: number;
    units_maintenance: number;
    tenants_active: number;
    contracts_active: number;
    contracts_expiring_soon: number;
  };
  alerts: {
    total: number;
    overdue_payments: number;
    contracts_expiring_soon: number;
    units_in_maintenance: number;
  };
};

/** GET /v1/dashboard/summary — mes operativo actual si no se indica `month`. */
export const getDashboardSummary = (signal?: AbortSignal) =>
  apiRequest<Dashboard>({
    method: 'GET',
    url: '/dashboard/summary',
    signal,
    operation: 'dashboard_summary',
  });
