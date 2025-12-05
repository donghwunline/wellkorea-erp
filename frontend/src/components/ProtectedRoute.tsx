/**
 * ProtectedRoute component for role-based route protection.
 *
 * Features:
 * - Requires authentication
 * - Optional role-based access control
 * - Redirects to login if not authenticated
 * - Shows "Access Denied" if authenticated but lacks required role
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
 */

import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RoleName } from '@/types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: RoleName;
  requiredRoles?: RoleName[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredRoles,
}) => {
  const { isAuthenticated, isLoading, hasRole, hasAnyRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
        <p>Required role: {requiredRole}</p>
      </div>
    );
  }

  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Access Denied</h1>
        <p>You do not have permission to access this page.</p>
        <p>Required roles: {requiredRoles.join(', ')}</p>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
