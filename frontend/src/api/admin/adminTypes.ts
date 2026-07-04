export type AdminRole =
  | 'super_admin'
  | 'main_admin'
  | 'admin'
  | 'support'
  | 'compliance'
  | 'readonly'
  | 'content_manager';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AdminUserDetail extends AdminUserRow {
  phone?: string;
  city?: string;
  isEmailConfirmed?: boolean;
  blockReason?: string;
}

export interface AdminAuditLogRow {
  id: string;
  createdAt: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  message: string;
  reason?: string;
  userIp?: string;
}

export interface AdminAuditLogDetail {
  id: string;
  createdAt: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId?: string;
  message: string;
  reason?: string;
  status?: string;
  executionResult?: string;
}

export interface AdminListParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}
