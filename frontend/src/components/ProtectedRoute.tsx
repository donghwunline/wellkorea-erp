/**
 * ProtectedRoute component for role-based route protection.
 *
 * Features:
 * - Requires authentication
 * - Optional role-based access control
 * - Redirects to login if not authenticated (preserves original location)
 * - Shows "Access Denied" if authenticated but lacks required role
 * - Tailwind-styled UI consistent with the rest of the app
 *
 * Usage:
 * ```typescript
 * // Requires authentication only
 * <Route path="/projects" element={
 *   <ProtectedRoute>
 *     <ProjectListPage />
 *   </ProtectedRoute>
 * } />
 *
 * // Requires Admin role
 * <Route path="/admin/users" element={
 *   <ProtectedRoute requiredRole="ADMIN">
 *     <UserManagementPage />
 *   </ProtectedRoute>
 * } />
 *
 * // Requires any of specified roles
 * <Route path="/quotations" element={
 *   <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_FINANCE', 'ROLE_SALES']}>
 *     <QuotationListPage />
 *   </ProtectedRoute>
 * } />
 * ```
 *
 * Note: Use either `requiredRole` OR `requiredRoles`, not both.
 * If both are provided, `requiredRole` takes precedence.
 */

import type { ReactNode } from 'react';
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { RoleName } from '@/types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Single role requirement */
  requiredRole?: RoleName;
  /** Multiple roles (any one of them is sufficient) */
  requiredRoles?: RoleName[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredRoles,
}) => {
  const { isAuthenticated, isLoading, hasRole, hasAnyRole } = useAuth();
  const location = useLocation();

  // Warn if both role props are provided (use only one)
  // if (process.env.NODE_ENV === 'development' && requiredRole && requiredRoles) {
  //   console.warn(
  //     'ProtectedRoute: Both requiredRole and requiredRoles provided. Using requiredRole.'
  //   );
  // }

  // 1) Loading state - checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-steel-950">
        <div className="text-center">
          <svg className="mx-auto h-10 w-10 animate-spin text-copper-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="mt-4 text-steel-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // 2) Not authenticated - redirect to login (preserving original location)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3) Check single role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-steel-950">
        <div className="rounded-xl border border-steel-800/50 bg-steel-900/60 p-8 max-w-md w-full text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-steel-400 mb-4">You do not have permission to access this page.</p>
          <p className="text-sm text-steel-500">
            Required role: <span className="font-mono text-copper-400">{requiredRole}</span>
          </p>
          <a href="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-copper-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-copper-600">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // 4) Check multiple roles requirement (any one is sufficient)
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-steel-950">
        <div className="rounded-xl border border-steel-800/50 bg-steel-900/60 p-8 max-w-md w-full text-center backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-steel-400 mb-4">You do not have permission to access this page.</p>
          <p className="text-sm text-steel-500">
            Required roles: <span className="font-mono text-copper-400">{requiredRoles.join(', ')}</span>
          </p>
          <a href="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-copper-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-copper-600">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // 5) All checks passed - render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
