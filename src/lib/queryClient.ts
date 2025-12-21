import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * Used for caching and managing server state
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Garbage collection time - 10 minutes
      gcTime: 10 * 60 * 1000,
      
      // Retry failed requests
      retry: 1,
      
      // Refetch on window focus
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Retry failed mutations
      retry: false,
    },
  },
});
