/**
 * Application Providers - Consolidates all context providers.
 *
 * Provider order (outermost to innermost):
 * 1. ErrorBoundary - Catch React errors at the top level
 * 2. QueryProvider - TanStack Query for data fetching
 * 3. BrowserRouter - React Router for navigation
 *
 * This component should wrap the entire application to ensure
 * all providers are available throughout the component tree.
 */

import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { QueryProvider } from './QueryProvider';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Consolidated provider wrapper for the application.
 *
 * Usage in main.tsx:
 * ```typescript
 * createRoot(document.getElementById('root')!).render(
 *   <StrictMode>
 *     <AppProviders>
 *       <App />
 *     </AppProviders>
 *   </StrictMode>
 * );
 * ```
 */
export function AppProviders({ children }: Readonly<AppProvidersProps>) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryProvider>
    </ErrorBoundary>
  );
}
