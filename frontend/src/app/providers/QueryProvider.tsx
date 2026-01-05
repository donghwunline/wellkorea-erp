/**
 * TanStack Query Provider configuration.
 *
 * Provides QueryClient with sensible defaults for the ERP application:
 * - 5 minute stale time (data considered fresh)
 * - 30 minute garbage collection time
 * - Single retry on failure
 * - No refetch on window focus (manual control preferred)
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

/**
 * QueryClient instance with ERP-optimized defaults.
 *
 * These defaults are tuned for an internal ERP application where:
 * - Data doesn't change frequently (5 min stale time)
 * - Memory usage should be reasonable (30 min GC)
 * - User experience over network efficiency (single retry)
 * - Manual refresh preferred over auto-refresh
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - cache retention
      retry: 1, // Single retry on failure
      refetchOnWindowFocus: false, // Manual control preferred
      refetchOnReconnect: true, // Refetch when network reconnects
    },
    mutations: {
      retry: 0, // No retry for mutations (user should retry manually)
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Query provider wrapper for the application.
 *
 * Includes ReactQueryDevtools in development mode for debugging
 * query cache, mutations, and data flow.
 */
export function QueryProvider({ children }: Readonly<QueryProviderProps>) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
