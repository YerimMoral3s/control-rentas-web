import { getDashboardSummary } from '@api/dashboard';
import { QueryStaleTime, useBaseQuery } from './queryBase';

export const DashboardQueryKeys = {
  root: ['dashboard'] as const,
  summary: ['dashboard', 'summary'] as const,
};

export const useDashboardSummary = () =>
  useBaseQuery(
    DashboardQueryKeys.summary,
    signal => getDashboardSummary(signal),
    QueryStaleTime.operational,
  );
