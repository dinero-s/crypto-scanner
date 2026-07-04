import { Navigate, Outlet } from 'react-router-dom';
import { isAdminAuthenticated } from '../../api/admin/adminAuthStorage';

export function AdminProtectedRoute() {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}
