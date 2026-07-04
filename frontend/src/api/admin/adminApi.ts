import { adminFetch } from './adminHttpClient';
import type {
  AdminAuditLogDetail,
  AdminAuditLogRow,
  AdminListParams,
  AdminUserDetail,
  AdminUserRow,
  PaginatedResponse,
} from './adminTypes';
import { mapUserStatus } from '../../utils/format';

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

type RawUser = {
  _id?: string;
  id?: string;
  email?: string;
  fullName?: string;
  role?: string;
  isBlocked?: boolean;
  isDisabled?: boolean;
  createdAt?: string;
  registrationDate?: string;
  lastLoginAt?: string;
  phone?: string;
  city?: string;
  isEmailConfirmed?: boolean;
  blockReason?: string;
};

type RawAuditRow = {
  id: string;
  type?: string;
  date?: string;
  action?: string;
  email?: string;
  userIp?: string;
  reason?: string;
  user?: { _id?: string };
};

type RawAuditDetail = {
  id: string;
  createdAt?: string;
  adminEmail?: string;
  action?: string;
  objectName?: string;
  entityId?: string;
  summary?: string;
  reason?: string;
  status?: string;
  executionResult?: string;
  category?: string;
};

function mapUser(row: RawUser): AdminUserRow {
  const id = row.id ?? row._id ?? '';
  return {
    id,
    email: row.email ?? '',
    name: row.fullName ?? '',
    role: row.role ?? 'user',
    status: mapUserStatus(row),
    createdAt: row.createdAt ?? row.registrationDate,
    lastLoginAt: row.lastLoginAt,
  };
}

function mapUserDetail(row: RawUser): AdminUserDetail {
  return {
    ...mapUser(row),
    phone: row.phone,
    city: row.city,
    isEmailConfirmed: row.isEmailConfirmed,
    blockReason: row.blockReason,
  };
}

function mapAuditRow(row: RawAuditRow): AdminAuditLogRow {
  return {
    id: row.id,
    createdAt: row.date ?? '',
    actorEmail: row.email ?? '',
    action: row.action ?? '',
    entityType: row.type ?? '',
    entityId: row.user?._id,
    message: row.action ?? '',
    reason: row.reason,
    userIp: row.userIp,
  };
}

function mapAuditDetail(row: RawAuditDetail): AdminAuditLogDetail {
  return {
    id: row.id,
    createdAt: row.createdAt ?? '',
    actorEmail: row.adminEmail ?? '',
    action: row.action ?? '',
    entityType: row.category ?? row.objectName ?? '',
    entityId: row.entityId,
    message: row.summary ?? '',
    reason: row.reason,
    status: row.status,
    executionResult: row.executionResult,
  };
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

export async function getAdminUsers(params?: AdminListParams) {
  const response = await adminFetch<PaginatedResponse<RawUser>>(`/users${buildQuery(params)}`);
  return {
    ...response,
    data: response.data.map(mapUser),
  };
}

export async function getAdminUserById(id: string) {
  const response = await adminFetch<RawUser>(`/users/${id}`);
  return mapUserDetail(response);
}

export async function blockAdminUser(id: string, reason: string) {
  return adminFetch(`/users/${id}/block`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  });
}

export async function unblockAdminUser(id: string) {
  return adminFetch(`/users/${id}/unblock`, { method: 'PUT' });
}

export async function getAdminAuditLogs(params?: AdminListParams) {
  const response = await adminFetch<PaginatedResponse<RawAuditRow>>(
    `/audit-log${buildQuery(params)}`,
  );
  return {
    ...response,
    data: response.data.map(mapAuditRow),
  };
}

export async function getAdminAuditLogById(id: string) {
  const response = await adminFetch<RawAuditDetail>(`/audit-log/${id}`);
  return mapAuditDetail(response);
}