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
import { useAuth } from '@/entities/auth';
import type { RoleName } from '@/entities/user';
import { Spinner } from '@/shared/ui';
import { AccessDeniedPage } from '@/pages/error';

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
          <Spinner size="xl" variant="copper" label="Checking authentication" className="mx-auto" />
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
    return <AccessDeniedPage requiredRoles={[requiredRole]} />;
  }

  // 4) Check multiple roles requirement (any one is sufficient)
  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <AccessDeniedPage requiredRoles={requiredRoles} />;
  }

  // 5) All checks passed - render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
