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
import { NotFoundPage } from '@/pages/error';

// Page imports
import { LoginPage } from '@/pages/auth';
import { DashboardPage } from '@/pages/dashboard';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';
import { AuditLogPage } from '@/pages/admin/AuditLogPage';
import { MailSettingsPage } from '@/pages/admin/MailSettingsPage';
import { ApprovalChainConfigPage } from '@/pages/approval/ApprovalChainConfigPage';
import { ApprovalListPage } from '@/pages/approval/ApprovalListPage';
import { ProjectCreatePage, ProjectEditPage, ProjectListPage, ProjectViewPage, } from '@/pages/projects';
import { QuotationCreatePage, QuotationDetailPage, QuotationEditPage, QuotationListPage, } from '@/pages/quotations';
import { CompanyDetailPage, CompanyEditPage, CompanyListPage, CreateCompanyPage } from '@/pages/companies';
import { ItemsPage } from '@/pages/items';
import { ProcurementPage } from '@/pages/procurement';
import { DeliveriesPage, DeliveryCreatePage, DeliveryDetailPage } from '@/pages/deliveries';
import { InvoiceCreatePage, InvoiceDetailPage, InvoiceSelectProjectPage, InvoicesPage, } from '@/pages/invoices';
import { ARReportPage } from '@/pages/reports';

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
        <Route path="/deliveries" element={<DeliveriesPage />} />
        <Route path="/deliveries/:id" element={<DeliveryDetailPage />} />
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
        <Route path="/quotations" element={<QuotationListPage />} />
        <Route path="/quotations/create" element={<QuotationCreatePage />} />
        <Route path="/quotations/:id" element={<QuotationDetailPage />} />
        <Route path="/quotations/:id/edit" element={<QuotationEditPage />} />

        {/* Project quotation sub-routes */}
        <Route path="/projects/:projectId/quotations/create" element={<QuotationCreatePage />} />
        <Route path="/projects/:projectId/quotations/:id" element={<QuotationDetailPage />} />
        <Route path="/projects/:projectId/quotations/:id/edit" element={<QuotationEditPage />} />

        {/* Companies */}
        <Route path="/companies" element={<CompanyListPage />} />
        <Route path="/companies/:id" element={<CompanyDetailPage />} />
      </Route>

      {/* ========== FINANCE/ADMIN ROUTES ========== */}
      <Route element={<RoleProtectedLayout requiredRoles={['ROLE_ADMIN', 'ROLE_FINANCE']} />}>
        {/* Delivery management */}
        <Route path="/projects/:projectId/deliveries/create" element={<DeliveryCreatePage />} />

        {/* Companies */}
        <Route path="/companies/new" element={<CreateCompanyPage />} />
        <Route path="/companies/:id/edit" element={<CompanyEditPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/procurement" element={<ProcurementPage />} />

        {/* Invoices */}
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/create" element={<InvoiceSelectProjectPage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="/projects/:projectId/invoices/create" element={<InvoiceCreatePage />} />

        {/* Reports */}
        <Route path="/reports" element={<ARReportPage />} />
        <Route path="/reports/ar" element={<ARReportPage />} />
      </Route>

      {/* ========== ADMIN ONLY ROUTES ========== */}
      <Route element={<RoleProtectedLayout requiredRole="ROLE_ADMIN" />}>
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/audit" element={<AuditLogPage />} />
        <Route path="/admin/approval-chains" element={<ApprovalChainConfigPage />} />
        <Route path="/admin/settings/mail" element={<MailSettingsPage />} />
      </Route>

      {/* ========== CATCH-ALL ========== */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
