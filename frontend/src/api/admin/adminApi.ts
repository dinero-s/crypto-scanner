import { adminFetch } from './adminHttpClient';
import type {
  AdminAlert,
  AdminAuditLog,
  AdminComplianceLog,
  AdminConnection,
  AdminConnectionDetail,
  AdminFeatureFlags,
  AdminHealth,
  AdminJob,
  AdminListParams,
  AdminOverview,
  AdminRecommendation,
  AdminUser,
  AdminUserDetail,
  PaginatedResponse,
} from './adminTypes';

function buildQuery(params?: AdminListParams): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function adminLogin(payload: {
  email: string;
  password: string;
}): Promise<{
  token: string;
  refresh_token: string;
  admin: { email: string; role: string };
}> {
  const response = await fetch('/api/admin/admin-users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Неверный email или пароль');
  }
  return response.json() as Promise<{
    token: string;
    refresh_token: string;
    admin: { email: string; role: string };
  }>;
}

export const getAdminOverview = () => adminFetch<AdminOverview>('/overview');

export const getAdminUsers = (params?: AdminListParams) =>
  adminFetch<PaginatedResponse<AdminUser>>(`/users${buildQuery(params)}`);

export const getAdminUserById = (id: string) =>
  adminFetch<AdminUserDetail>(`/users/${id}`);

export const blockAdminUser = (id: string, reason: string) =>
  adminFetch(`/users/${id}/block`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });

export const unblockAdminUser = (id: string) =>
  adminFetch(`/users/${id}/unblock`, { method: 'PATCH' });

export const changeAdminUserRole = (id: string, role: string) =>
  adminFetch(`/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });

export const getAdminConnections = (params?: AdminListParams) =>
  adminFetch<PaginatedResponse<AdminConnection>>(`/connections${buildQuery(params)}`);

export const getAdminConnectionById = (id: string) =>
  adminFetch<AdminConnectionDetail>(`/connections/${id}`);

export const runAdminConnectionHealth = (id: string) =>
  adminFetch(`/connections/${id}/health`, { method: 'POST' });

export const runAdminConnectionSync = (id: string) =>
  adminFetch(`/connections/${id}/sync`, { method: 'POST' });

export const pauseAdminConnection = (id: string) =>
  adminFetch(`/connections/${id}/pause`, { method: 'PATCH' });

export const resumeAdminConnection = (id: string) =>
  adminFetch(`/connections/${id}/resume`, { method: 'PATCH' });

export const deleteAdminConnection = (id: string) =>
  adminFetch(`/connections/${id}`, { method: 'DELETE' });

export const getAdminJobs = (params?: AdminListParams) =>
  adminFetch<PaginatedResponse<AdminJob>>(`/jobs${buildQuery(params)}`);

export const getAdminJobById = (id: string) => adminFetch<AdminJob>(`/jobs/${id}`);

export const retryAdminJob = (id: string) =>
  adminFetch(`/jobs/${id}/retry`, { method: 'POST' });

export const cancelAdminJob = (id: string) =>
  adminFetch(`/jobs/${id}/cancel`, { method: 'POST' });

export const getAdminComplianceLogs = (params?: AdminListParams) =>
  adminFetch<PaginatedResponse<AdminComplianceLog> & { summary?: { blockedLast24h: number; allowedLast24h: number } }>(
    `/compliance-logs${buildQuery(params)}`,
  );

export const getAdminComplianceLogById = (id: string) =>
  adminFetch<AdminComplianceLog>(`/compliance-logs/${id}`);

export const getAdminAuditLogs = (params?: AdminListParams) =>
  adminFetch<PaginatedResponse<AdminAuditLog>>(`/audit-logs${buildQuery(params)}`);

export const getAdminAuditLogById = (id: string) =>
  adminFetch<AdminAuditLog>(`/audit-logs/${id}`);

export const getAdminAlerts = (params?: AdminListParams) =>
  adminFetch<PaginatedResponse<AdminAlert>>(`/alerts${buildQuery(params)}`);

export const getAdminAlertById = (id: string) =>
  adminFetch<AdminAlert>(`/alerts/${id}`);

export const getAdminRecommendations = (params?: AdminListParams) =>
  adminFetch<PaginatedResponse<AdminRecommendation>>(`/recommendations${buildQuery(params)}`);

export const getAdminRecommendationById = (id: string) =>
  adminFetch<AdminRecommendation>(`/recommendations/${id}`);

export const getAdminHealth = () => adminFetch<AdminHealth>('/health');

export const getAdminFeatureFlags = () => adminFetch<AdminFeatureFlags>('/feature-flags');
