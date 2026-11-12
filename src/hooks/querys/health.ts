import { getHealth } from '@api/health';
import { QueryStaleTime, useBaseQuery } from './queryBase';

export const HealthQueryKeys = {
  root: ['health'] as const,
};

export const useHealth = () =>
  useBaseQuery(HealthQueryKeys.root, signal => getHealth(signal), QueryStaleTime.operational, {
    retry: false,
  });
