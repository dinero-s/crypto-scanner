export type AdminRole =
  | 'super_admin'
  | 'main_admin'
  | 'admin'
  | 'support'
  | 'compliance'
  | 'readonly'
  | 'content_manager';

export type HealthServiceStatus = 'OK' | 'DEGRADED' | 'DOWN' | 'UNKNOWN';

export type AdminJobStatus =
  | 'WAITING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'DELAYED'
  | 'CANCELLED';

export type ComplianceDecision = 'ALLOWED' | 'BLOCKED' | 'SKIPPED' | 'UNKNOWN';

export type AvailabilityStatus =
  | 'AVAILABLE'
  | 'PARTIAL'
  | 'NOT_AVAILABLE_VIA_OFFICIAL_API'
  | 'API_ERROR'
  | 'PENDING';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalOzonConnections: number;
  activeOzonConnections: number;
  failedOzonConnections: number;
  deletedOzonConnections: number;
  syncJobs24h: number;
  failedSyncJobs24h: number;
  complianceBlocks24h: number;
  alertsSent24h: number;
  alertsFailed24h: number;
  recommendationsTotal: number;
  criticalRecommendations: number;
  lastSyncAt?: string;
  recentErrors: Array<{ id: string; summary: string; createdAt: string }>;
  recentComplianceBlocks: Array<{
    id: string;
    endpoint?: string;
    reason?: string;
    createdAt: string;
  }>;
  recentFailedJobs: Array<{
    id: string;
    jobType: string;
    errorMessage?: string;
    finishedAt?: string;
  }>;
  systemHealth: Record<string, HealthServiceStatus | string>;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt?: string;
  lastLoginAt?: string;
  ozonConnectionsCount: number;
  activeOzonConnectionsCount: number;
  recommendationsCount: number;
  alertsCount: number;
}

export interface AdminUserDetail extends AdminUser {
  marketplaceConnections: Array<{
    id: string;
    name: string;
    status: string;
    lastSyncAt?: string;
  }>;
  recentAuditActions: Array<{ id: string; action: string; summary?: string; createdAt?: string }>;
  recentSyncErrors: Array<{ id: string; action: string; summary?: string; createdAt?: string }>;
  recentAlerts: Array<{ id: string; message: string; status: string; severity: string; createdAt?: string }>;
  recentRecommendations: Array<{ id: string; title: string; severity: string; status: string; createdAt?: string }>;
}

export interface AdminConnection {
  id: string;
  marketplace: string;
  userId: string;
  userEmail: string;
  connectionName: string;
  status: string;
  healthStatus: string;
  lastSyncAt?: string;
  productsCount: number;
  competitorsCount: number;
  recommendationsCount: number;
  alertsCount: number;
  errorsCount: number;
  createdAt?: string;
}

export interface AdminConnectionDetail extends AdminConnection {
  maskedClientId: string;
  user: { id: string; email: string; name: string };
  healthSummary: { lastCheckAt?: string; status?: string };
  lastSyncSummary: { action?: string; status?: string; at?: string };
  productsSyncStatus: { count: number };
  reportsSyncStatus: { available: boolean };
  competitorsSyncStatus: { count: number };
  alertsSummary: { count: number };
  recommendationsSummary: { count: number };
  auditSummary: Array<{ id: string; action: string; status: string; createdAt?: string }>;
  complianceSummary: Array<{ id: string; decision: string; endpoint?: string; blocked: boolean; createdAt?: string }>;
}

export interface AdminJob {
  id: string;
  queue: string;
  marketplace: string;
  userId: string;
  userEmail: string;
  connectionId?: string;
  connectionName?: string;
  jobType: string;
  status: AdminJobStatus;
  attemptsMade: number;
  maxAttempts: number;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  errorMessage?: string;
  sanitizedData?: Record<string, unknown>;
  stacktrace?: string[];
}

export interface AdminComplianceLog {
  id: string;
  createdAt: string;
  marketplace: string;
  userId?: string;
  userEmail?: string;
  connectionId?: string;
  action: string;
  requestHost?: string;
  endpoint?: string;
  method?: string;
  decision: ComplianceDecision;
  reason?: string;
  blocked: boolean;
  errorCode?: string;
}

export interface AdminAuditLog {
  id: string;
  createdAt: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  status?: string;
  message: string;
}

export interface AdminAlert {
  id: string;
  createdAt: string;
  marketplace: string;
  userId: string;
  userEmail: string;
  connectionId?: string;
  channel: string;
  status: string;
  severity: string;
  message: string;
  errorMessage?: string;
  relatedProductId?: string;
  relatedRecommendationId?: string;
}

export interface AdminRecommendation {
  id: string;
  createdAt: string;
  marketplace: string;
  userId: string;
  userEmail: string;
  connectionId?: string;
  productId?: string;
  productName?: string;
  type: string;
  severity: string;
  status: string;
  availabilityStatus: AvailabilityStatus;
  title: string;
  reason: string;
  source: string;
  fullText?: string;
  inputDataSummary?: Record<string, unknown>;
  ruleBasedResult?: Record<string, unknown>;
  llmResult?: Record<string, unknown>;
  userAction?: string;
  resolvedAt?: string;
}

export interface AdminHealth {
  backend: HealthServiceItem;
  mongo: HealthServiceItem;
  redis: HealthServiceItem;
  bullmq: HealthServiceItem;
  mailer: HealthServiceItem;
  telegram: HealthServiceItem;
  sentry: HealthServiceItem;
  llm: HealthServiceItem;
  ozonApi: HealthServiceItem;
}

export interface HealthServiceItem {
  status: HealthServiceStatus;
  message: string;
  checkedAt: string;
  lastSuccessAt?: string;
  lastErrorAt?: string;
}

export interface AdminFeatureFlags {
  OZON_OPERATOR_ENABLED: boolean;
  WB_OPERATOR_ENABLED: boolean;
  LLM_ADVISOR_ENABLED: boolean;
  TELEGRAM_ALERTS_ENABLED: boolean;
  EMAIL_ALERTS_ENABLED: boolean;
  AUTO_SYNC_ENABLED: boolean;
  COMPETITOR_TRACKING_ENABLED: boolean;
}

export interface AdminListParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}
