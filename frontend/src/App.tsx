/**
 * Main Application Component with React Router
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';

const NotFoundPage = () => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-steel-950">
    {/* Background Grid */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `
          linear-gradient(to right, #829ab1 1px, transparent 1px),
          linear-gradient(to bottom, #829ab1 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }}
    />

    <div className="relative text-center">
      <div className="mb-6 font-mono text-8xl font-bold text-steel-700">404</div>
      <h1 className="text-2xl font-semibold text-white">Page Not Found</h1>
      <p className="mt-2 text-steel-400">The page you're looking for doesn't exist.</p>
      <a
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-copper-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-copper-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Return to Dashboard
      </a>
    </div>
  </div>
);

/** Placeholder for future pages */
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="min-h-screen bg-steel-950 p-8">
    <div className="rounded-xl border border-steel-800/50 bg-steel-900/60 p-12 text-center backdrop-blur-sm">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-steel-400">This feature will be implemented in a future phase.</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes with AppLayout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Main module routes (placeholders) */}
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PlaceholderPage title="Projects" />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/quotations"
              element={
                <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_FINANCE', 'ROLE_SALES']}>
                  <AppLayout>
                    <PlaceholderPage title="Quotations" />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_FINANCE', 'ROLE_SALES']}>
                  <AppLayout>
                    <PlaceholderPage title="Products" />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/production"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PlaceholderPage title="Production" />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/delivery"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <PlaceholderPage title="Delivery" />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_FINANCE']}>
                  <AppLayout>
                    <PlaceholderPage title="Invoices" />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_FINANCE']}>
                  <AppLayout>
                    <PlaceholderPage title="AR/AP Reports" />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="ROLE_ADMIN">
                  <AppLayout>
                    <UserManagementPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute requiredRole="ROLE_ADMIN">
                  <AppLayout>
                    <AuditLogPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
