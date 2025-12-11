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
 *   <ProtectedRoute requiredRoles={['ADMIN', 'FINANCE', 'SALES']}>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-gray-600">Checking authentication...</p>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow rounded-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You do not have permission to access this page.</p>
          <p className="text-sm text-gray-500">
            Required role: <span className="font-mono">{requiredRole}</span>
          </p>
        </div>
      </div>
    );
  }

  // 4) Check multiple roles requirement (any one is sufficient)
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white shadow rounded-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You do not have permission to access this page.</p>
          <p className="text-sm text-gray-500">
            Required roles: <span className="font-mono">{requiredRoles.join(', ')}</span>
          </p>
        </div>
      </div>
    );
  }

  // 5) All checks passed - render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
