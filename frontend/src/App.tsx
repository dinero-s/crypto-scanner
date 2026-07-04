import { lazy, Suspense, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DocumentTitle } from './components/DocumentTitle';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminProtectedRoute } from './components/auth/AdminProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingState } from './components/ui/StateBlocks';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { LoginPage } from './pages/LoginPage';

const DashboardPage = lazy(() =>
  import('./pages/ozon/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const AlertsPage = lazy(() =>
  import('./pages/ozon/AlertsPage').then((m) => ({ default: m.AlertsPage })),
);
const AuditPage = lazy(() =>
  import('./pages/ozon/AuditPage').then((m) => ({ default: m.AuditPage })),
);
const ProfitAuditPage = lazy(() =>
  import('./pages/ozon/ProfitAuditPage').then((m) => ({ default: m.ProfitAuditPage })),
);
const IssueDetailPage = lazy(() =>
  import('./pages/ozon/IssueDetailPage').then((m) => ({ default: m.IssueDetailPage })),
);
const CompetitorsPage = lazy(() =>
  import('./pages/ozon/CompetitorsPage').then((m) => ({ default: m.CompetitorsPage })),
);
const ConnectionsPage = lazy(() =>
  import('./pages/ozon/ConnectionsPage').then((m) => ({ default: m.ConnectionsPage })),
);
const ProductDetailPage = lazy(() =>
  import('./pages/ozon/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })),
);
const ProductsPage = lazy(() =>
  import('./pages/ozon/ProductsPage').then((m) => ({ default: m.ProductsPage })),
);
const AdminLayout = lazy(() =>
  import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })),
);
const AdminOverviewPage = lazy(() =>
  import('./pages/admin/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage })),
);
const AdminUsersPage = lazy(() =>
  import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
);
const AdminUserDetailPage = lazy(() =>
  import('./pages/admin/AdminUserDetailPage').then((m) => ({ default: m.AdminUserDetailPage })),
);
const AdminConnectionsPage = lazy(() =>
  import('./pages/admin/AdminConnectionsPage').then((m) => ({ default: m.AdminConnectionsPage })),
);
const AdminConnectionDetailPage = lazy(() =>
  import('./pages/admin/AdminConnectionDetailPage').then((m) => ({
    default: m.AdminConnectionDetailPage,
  })),
);
const AdminJobsPage = lazy(() =>
  import('./pages/admin/AdminJobsPage').then((m) => ({ default: m.AdminJobsPage })),
);
const AdminJobDetailPage = lazy(() =>
  import('./pages/admin/AdminJobDetailPage').then((m) => ({ default: m.AdminJobDetailPage })),
);
const AdminCompliancePage = lazy(() =>
  import('./pages/admin/AdminCompliancePage').then((m) => ({ default: m.AdminCompliancePage })),
);
const AdminComplianceDetailPage = lazy(() =>
  import('./pages/admin/AdminComplianceDetailPage').then((m) => ({
    default: m.AdminComplianceDetailPage,
  })),
);
const AdminAuditPage = lazy(() =>
  import('./pages/admin/AdminAuditPage').then((m) => ({ default: m.AdminAuditPage })),
);
const AdminAuditDetailPage = lazy(() =>
  import('./pages/admin/AdminAuditDetailPage').then((m) => ({ default: m.AdminAuditDetailPage })),
);
const AdminAlertsPage = lazy(() =>
  import('./pages/admin/AdminAlertsPage').then((m) => ({ default: m.AdminAlertsPage })),
);
const AdminAlertDetailPage = lazy(() =>
  import('./pages/admin/AdminAlertDetailPage').then((m) => ({ default: m.AdminAlertDetailPage })),
);
const AdminRecommendationsPage = lazy(() =>
  import('./pages/admin/AdminRecommendationsPage').then((m) => ({
    default: m.AdminRecommendationsPage,
  })),
);
const AdminRecommendationDetailPage = lazy(() =>
  import('./pages/admin/AdminRecommendationDetailPage').then((m) => ({
    default: m.AdminRecommendationDetailPage,
  })),
);
const AdminHealthPage = lazy(() =>
  import('./pages/admin/AdminHealthPage').then((m) => ({ default: m.AdminHealthPage })),
);
const AdminFeatureFlagsPage = lazy(() =>
  import('./pages/admin/AdminFeatureFlagsPage').then((m) => ({
    default: m.AdminFeatureFlagsPage,
  })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function LazyPage({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminAuthProvider>
          <BrowserRouter>
            <DocumentTitle />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/admin/login"
                element={
                  <LazyPage>
                    <AdminLoginPage />
                  </LazyPage>
                }
              />

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Navigate to="/ozon/dashboard" replace />} />
                <Route element={<AppLayout />}>
                  <Route
                    path="/ozon/dashboard"
                    element={
                      <LazyPage>
                        <DashboardPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/ozon/connections"
                    element={
                      <LazyPage>
                        <ConnectionsPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/ozon/products"
                    element={
                      <LazyPage>
                        <ProductsPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/ozon/products/:id"
                    element={
                      <LazyPage>
                        <ProductDetailPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/ozon/competitors"
                    element={
                      <LazyPage>
                        <CompetitorsPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/ozon/alerts"
                    element={
                      <LazyPage>
                        <AlertsPage />
                      </LazyPage>
                    }
                  />
                  <Route path="/ozon/recommendations" element={<Navigate to="/ozon/audit" replace />} />
                  <Route
                    path="/ozon/audit"
                    element={
                      <LazyPage>
                        <ProfitAuditPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/ozon/issues/:id"
                    element={
                      <LazyPage>
                        <IssueDetailPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/ozon/connections/:id/audit"
                    element={
                      <LazyPage>
                        <AuditPage />
                      </LazyPage>
                    }
                  />
                </Route>
              </Route>

              <Route element={<AdminProtectedRoute />}>
                <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
                <Route
                  element={
                    <LazyPage>
                      <AdminLayout />
                    </LazyPage>
                  }
                >
                  <Route
                    path="/admin/overview"
                    element={
                      <LazyPage>
                        <AdminOverviewPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <LazyPage>
                        <AdminUsersPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/admin/users/:id"
                    element={
                      <LazyPage>
                        <AdminUserDetailPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/admin/connections"
                    element={
                      <LazyPage>
                        <AdminConnectionsPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/admin/connections/:id"
                    element={
                      <LazyPage>
                        <AdminConnectionDetailPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/admin/jobs"
                    element={
                      <LazyPage>
                        <AdminJobsPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/admin/jobs/:id"
                    element={
                      <LazyPage>
                        <AdminJobDetailPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/admin/compliance"
                    element={
                      <LazyPage>
                        <AdminCompliancePage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/admin/compliance/:id"
                    element={
                      <LazyPage>
                        <AdminComplianceDetailPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/admin/audit"
                    element={
                      <LazyPage>
                        <AdminAuditPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/admin/audit/:id"
                    element={
                      <LazyPage>
                        <AdminAuditDetailPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/admin/alerts"
                    element={
                      <LazyPage>
                        <AdminAlertsPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/admin/alerts/:id"
                    element={
                      <LazyPage>
                        <AdminAlertDetailPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/admin/recommendations"
                    element={
                      <LazyPage>
                        <AdminRecommendationsPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/admin/recommendations/:id"
                    element={
                      <LazyPage>
                        <AdminRecommendationDetailPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/admin/health"
                    element={
                      <LazyPage>
                        <AdminHealthPage />
                      </LazyPage>
                    }
                  />
                  <Route
                    path="/admin/feature-flags"
                    element={
                      <LazyPage>
                        <AdminFeatureFlagsPage />
                      </LazyPage>
                    }
                  />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
