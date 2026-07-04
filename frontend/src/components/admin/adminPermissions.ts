import type { AdminRole } from '../../api/admin/adminTypes';

export function canAdminWrite(role: string | null): boolean {
  return role !== 'readonly' && role !== null;
}

export function canAdminBlockUsers(role: string | null): boolean {
  return canAdminWrite(role) && role !== 'compliance';
}

export function canAdminChangeUserRole(role: string | null): boolean {
  return role === 'super_admin' || role === 'main_admin' || role === 'admin';
}

export function isAdminRole(role: string | null): role is AdminRole {
  return Boolean(role);
}
