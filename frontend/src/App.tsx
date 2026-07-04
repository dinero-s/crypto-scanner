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
import { HomePage } from './pages/HomePage';
import { MiniAppRoutes } from './mini-app/MiniAppRoutes';

const AdminLayout = lazy(() =>
  import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const AdminLoginPage = lazy(() =>
  import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })),
);
const AdminUsersPage = lazy(() =>
  import('./pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
);
const AdminUserDetailPage = lazy(() =>
  import('./pages/admin/AdminUserDetailPage').then((m) => ({ default: m.AdminUserDetailPage })),
);
const AdminAuditPage = lazy(() =>
  import('./pages/admin/AdminAuditPage').then((m) => ({ default: m.AdminAuditPage })),
);
const AdminAuditDetailPage = lazy(() =>
  import('./pages/admin/AdminAuditDetailPage').then((m) => ({ default: m.AdminAuditDetailPage })),
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
              <Route path="/mini-app/*" element={<MiniAppRoutes />} />
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
                <Route element={<AppLayout />}>
                  <Route path="/" element={<HomePage />} />
                </Route>
              </Route>

              <Route element={<AdminProtectedRoute />}>
                <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
                <Route
                  element={
                    <LazyPage>
                      <AdminLayout />
                    </LazyPage>
                  }
                >
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
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
