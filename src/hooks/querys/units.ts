import { getDashboardUnits } from '@api/units';
import { QueryStaleTime, useBaseQuery } from './queryBase';

export const UnitsQueryKeys = {
  root: ['units'] as const,
  dashboard: (status: 'available' | 'maintenance') => ['units', 'dashboard', status] as const,
};

/** H-05: solo se pide para nombrar la unidad cuando hay una sola en ese estado. */
export const useSingleDashboardUnit = (status: 'available' | 'maintenance', enabled: boolean) =>
  useBaseQuery(
    UnitsQueryKeys.dashboard(status),
    signal => getDashboardUnits(status, 1, signal),
    QueryStaleTime.operational,
    {
      enabled,
    },
  );
