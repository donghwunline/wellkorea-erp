/**
 * Main Application Component with React Router
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';

// Placeholder components for Phase 2
const LoginPage = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Login Page</h1>
      <p className="text-gray-600">Login UI will be implemented in Phase 3 (US9)</p>
    </div>
  </div>
);

const DashboardPage = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">WellKorea ERP Dashboard</h1>
    <p className="text-gray-600">Dashboard will be populated with features in upcoming phases</p>
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Projects (US1)</h2>
        <p className="text-gray-600">Phase 4</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Quotations (US2)</h2>
        <p className="text-gray-600">Phase 5</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Products (US3)</h2>
        <p className="text-gray-600">Phase 6</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Production (US4)</h2>
        <p className="text-gray-600">Phase 7</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Delivery (US5)</h2>
        <p className="text-gray-600">Phase 8</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Invoices (US6)</h2>
        <p className="text-gray-600">Phase 9</p>
      </div>
    </div>
  </div>
);

const NotFoundPage = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-4">Page Not Found</p>
      <a href="/" className="text-blue-600 hover:underline">
        Return to Dashboard
      </a>
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

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
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
