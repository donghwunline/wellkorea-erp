/**
 * Application Router - Centralized route definitions.
 *
 * Uses React Router v6 layout routes to reduce boilerplate:
 * - Public routes (login) have no wrapper
 * - Protected routes use ProtectedRoute + AppLayout via Outlet
 * - Role-based routes group by required permissions
 */

import { Outlet, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../layouts';
import { NotFoundPage } from './components/NotFoundPage';
import { PlaceholderPage } from './components/PlaceholderPage';

// Page imports
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { AuditLogPage } from '@/pages/admin/AuditLogPage';
import { ApprovalChainConfigPage } from '@/pages/approval/ApprovalChainConfigPage';
import { ApprovalListPage } from '@/pages/approval/ApprovalListPage';
import { ProjectCreatePage, ProjectEditPage, ProjectListPage, ProjectViewPage, } from '@/pages/projects';
import {
  QuotationCreatePageV2,
  QuotationDetailPageV2,
  QuotationEditPageV2,
  QuotationListPageV2,
} from '@/pages/quotations';
import { CompanyDetailPage, CompanyListPage, CreateCompanyPage } from '@/pages/companies';
import { ItemsPage } from '@/pages/items';
import { ProcurementPage } from '@/pages/procurement';

/**
 * Layout wrapper for protected routes.
 * Combines ProtectedRoute + AppLayout with Outlet for nested routes.
 */
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  );
}

/**
 * Layout wrapper for routes requiring specific roles.
 */
function RoleProtectedLayout({
  requiredRole,
  requiredRoles,
}: Readonly<{
  requiredRole?: 'ROLE_ADMIN' | 'ROLE_FINANCE' | 'ROLE_SALES' | 'ROLE_PRODUCTION';
  requiredRoles?: Array<'ROLE_ADMIN' | 'ROLE_FINANCE' | 'ROLE_SALES' | 'ROLE_PRODUCTION'>;
}>) {
  return (
    <ProtectedRoute requiredRole={requiredRole} requiredRoles={requiredRoles}>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  );
}

/**
 * Application router with all route definitions.
 */
export function AppRouter() {
  return (
    <Routes>
      {/* ========== PUBLIC ROUTES ========== */}
      <Route path="/login" element={<LoginPage />} />

      {/* ========== PROTECTED ROUTES (any authenticated user) ========== */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/projects/:id" element={<ProjectViewPage />} />
        <Route path="/approvals" element={<ApprovalListPage />} />
        <Route path="/production" element={<PlaceholderPage title="Production" />} />
        <Route path="/delivery" element={<PlaceholderPage title="Delivery" />} />
      </Route>

      {/* ========== SALES/FINANCE/ADMIN ROUTES ========== */}
      <Route
        element={
          <RoleProtectedLayout requiredRoles={['ROLE_ADMIN', 'ROLE_FINANCE', 'ROLE_SALES']} />
        }
      >
        {/* Project management */}
        <Route path="/projects/new" element={<ProjectCreatePage />} />
        <Route path="/projects/:id/edit" element={<ProjectEditPage />} />

        {/* Quotations */}
        <Route path="/quotations" element={<QuotationListPageV2 />} />
        <Route path="/quotations/create" element={<QuotationCreatePageV2 />} />
        <Route path="/quotations/:id" element={<QuotationDetailPageV2 />} />
        <Route path="/quotations/:id/edit" element={<QuotationEditPageV2 />} />

        {/* Project quotation sub-routes */}
        <Route path="/projects/:projectId/quotations/create" element={<QuotationCreatePageV2 />} />
        <Route path="/projects/:projectId/quotations/:id" element={<QuotationDetailPageV2 />} />
        <Route path="/projects/:projectId/quotations/:id/edit" element={<QuotationEditPageV2 />} />

        {/* Companies */}
        <Route path="/companies" element={<CompanyListPage />} />
        <Route path="/companies/:id" element={<CompanyDetailPage />} />
      </Route>

      {/* ========== FINANCE/ADMIN ROUTES ========== */}
      <Route element={<RoleProtectedLayout requiredRoles={['ROLE_ADMIN', 'ROLE_FINANCE']} />}>
        <Route path="/companies/new" element={<CreateCompanyPage />} />
        <Route path="/companies/:id/edit" element={<PlaceholderPage title="Edit Company" />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/procurement" element={<ProcurementPage />} />
        <Route path="/invoices" element={<PlaceholderPage title="Invoices" />} />
        <Route path="/reports" element={<PlaceholderPage title="AR/AP Reports" />} />
      </Route>

      {/* ========== ADMIN ONLY ROUTES ========== */}
      <Route element={<RoleProtectedLayout requiredRole="ROLE_ADMIN" />}>
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/audit" element={<AuditLogPage />} />
        <Route path="/admin/approval-chains" element={<ApprovalChainConfigPage />} />
      </Route>

      {/* ========== CATCH-ALL ========== */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
