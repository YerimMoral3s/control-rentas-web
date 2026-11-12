import { QueryClient } from '@tanstack/react-query';
import { isAppError } from '@api/errors';

const MAX_QUERY_RETRIES = 1;

/** Solo se reintenta una lectura por fallas de red o servidor. Las escrituras nunca se repiten. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) =>
        failureCount < MAX_QUERY_RETRIES &&
        isAppError(error) &&
        (error.type === 'network' || error.type === 'server'),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
