import { apiFetch } from '../httpClient';
import type {
  AuditQueryParams,
  AuditStatusResponse,
  CreateCompetitorPayload,
  CreateConnectionPayload,
  IssueDetailResponse,
  IssuesListResponse,
  IssuesQueryParams,
  LatestAuditReportResponse,
  OzonAlert,
  OzonAuditLog,
  OzonAuditRecommendation,
  OzonAuditRecommendationStatus,
  OzonCompetitor,
  OzonCompetitorSnapshot,
  OzonConnection,
  OzonDetectedIssue,
  ProductAnalytics,
  ProductsListResponse,
  ProductsQueryParams,
  RecommendationSeverity,
  RunAuditPayload,
  RunAuditResponse,
} from '../../types/ozon';

export { ForbiddenFrontendOzonRequestError } from './errors';

function normalizeId<T extends { _id?: string; id?: string }>(
  row: T,
  fallback = '',
): T & { id: string } {
  return {
    ...row,
    id: row.id ?? (row._id ? String(row._id) : fallback),
  };
}

export function getConnections(): Promise<OzonConnection[]> {
  return apiFetch('/connections');
}

export function createConnection(
  payload: CreateConnectionPayload,
): Promise<OzonConnection> {
  return apiFetch('/connections', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function deleteConnection(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/connections/${id}`, { method: 'DELETE' });
}

export function checkConnectionHealth(
  id: string,
): Promise<{ status: string; message?: string }> {
  return apiFetch(`/connections/${id}/health`);
}

export function syncConnection(id: string): Promise<{ queued: boolean }> {
  return apiFetch(`/connections/${id}/sync`, {
    method: 'POST',
    body: JSON.stringify({ syncType: 'full' }),
  });
}

export function getProducts(
  params: ProductsQueryParams = {},
): Promise<ProductsListResponse> {
  const searchParams = new URLSearchParams();
  if (params.connectionId) searchParams.set('connectionId', params.connectionId);
  if (params.search) searchParams.set('search', params.search);
  if (params.noStock) searchParams.set('noStock', 'true');
  if (params.hasRecommendations) searchParams.set('hasRecommendations', 'true');
  if (params.hasAlerts) searchParams.set('hasAlerts', 'true');
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);
  const query = searchParams.toString();
  return apiFetch(`/products${query ? `?${query}` : ''}`);
}

export function getProductAnalytics(id: string): Promise<ProductAnalytics> {
  return apiFetch(`/products/${id}/analytics`);
}

export function getCompetitors(): Promise<OzonCompetitor[]> {
  return apiFetch<Array<OzonCompetitor & { _id?: string }>>('/competitors').then(
    (rows) => rows.map((row, index) => normalizeId(row, `competitor-${String(index)}`)),
  );
}

export function getCompetitor(id: string): Promise<OzonCompetitor> {
  return apiFetch<OzonCompetitor & { _id?: string }>(`/competitors/${id}`).then((row) =>
    normalizeId(row),
  );
}

export function createCompetitor(
  payload: CreateCompetitorPayload,
): Promise<OzonCompetitor> {
  return apiFetch<OzonCompetitor & { _id?: string }>('/competitors', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((row) => normalizeId(row));
}

export function deleteCompetitor(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/competitors/${id}`, { method: 'DELETE' });
}

export function syncCompetitor(id: string): Promise<{ queued: boolean }> {
  return apiFetch(`/competitors/${id}/sync`, { method: 'POST' });
}

export function syncAllCompetitors(
  connectionId?: string,
): Promise<{ queued: number }> {
  return apiFetch('/competitors/sync', {
    method: 'POST',
    body: JSON.stringify(connectionId ? { connectionId } : {}),
  });
}

export function getCompetitorSnapshots(
  id: string,
  limit = 30,
): Promise<{ items: OzonCompetitorSnapshot[] }> {
  return apiFetch<{ items: Array<OzonCompetitorSnapshot & { _id?: string }> }>(
    `/competitors/${id}/snapshots?limit=${String(limit)}`,
  ).then((data) => ({
    items: data.items.map((item, index) => ({
      ...normalizeId(item, `snapshot-${String(index)}`),
      date: item.date ?? item.collectedAt,
    })),
  }));
}

export function getAlerts(status?: string): Promise<OzonAlert[]> {
  const query = status ? `?status=${status}` : '';
  return apiFetch(`/alerts${query}`);
}

export function sendTestAlert(payload: {
  type: string;
  severity: RecommendationSeverity;
  connectionId?: string;
  message?: string;
}): Promise<OzonAlert> {
  return apiFetch('/alerts/test', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getConnectionAudit(
  connectionId: string,
  params: AuditQueryParams = {},
): Promise<OzonAuditLog[]> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.complianceDecision) {
    searchParams.set('complianceDecision', params.complianceDecision);
  }
  if (params.errorCode) searchParams.set('errorCode', params.errorCode);
  if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.set('dateTo', params.dateTo);
  const query = searchParams.toString();
  return apiFetch<Array<OzonAuditLog & { _id?: string }>>(
    `/connections/${connectionId}/audit${query ? `?${query}` : ''}`,
  ).then((rows) =>
    rows.map((row, index) => ({
      ...normalizeId(row, `${connectionId}-${String(index)}`),
      message: row.message ?? row.summary,
    })),
  );
}

export function runProfitAudit(
  payload: RunAuditPayload = {},
): Promise<RunAuditResponse> {
  return apiFetch('/audit/run', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getAuditStatus(
  connectionId?: string,
): Promise<AuditStatusResponse> {
  const query = connectionId ? `?connectionId=${encodeURIComponent(connectionId)}` : '';
  return apiFetch(`/audit/status${query}`);
}

export async function getLatestAuditReport(
  connectionId?: string,
): Promise<LatestAuditReportResponse> {
  const query = connectionId ? `?connectionId=${encodeURIComponent(connectionId)}` : '';
  const data = await apiFetch<
    LatestAuditReportResponse & {
      report?: LatestAuditReportResponse['report'] & { _id?: string };
      topIssues?: Array<OzonDetectedIssue & { _id?: string }>;
      topRecommendations?: Array<OzonAuditRecommendation & { _id?: string }>;
    }
  >(`/audit/latest${query}`);

  return {
    ...data,
    topIssues: (data.topIssues ?? []).map((item, index) =>
      normalizeId(item, `issue-${String(index)}`),
    ),
    topRecommendations: (data.topRecommendations ?? []).map((item, index) =>
      normalizeId(item, `rec-${String(index)}`),
    ),
    report: data.report ? normalizeId(data.report) : undefined,
  };
}

export function getProfitAuditIssues(
  params: IssuesQueryParams = {},
): Promise<IssuesListResponse> {
  const searchParams = new URLSearchParams();
  if (params.connectionId) searchParams.set('connectionId', params.connectionId);
  if (params.status) searchParams.set('status', params.status);
  if (params.type) searchParams.set('type', params.type);
  if (params.severity) searchParams.set('severity', params.severity);
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  if (params.page !== undefined) searchParams.set('page', String(params.page));
  const query = searchParams.toString();

  return apiFetch<
    IssuesListResponse & {
      items: Array<OzonDetectedIssue & { _id?: string }>;
    }
  >(`/issues${query ? `?${query}` : ''}`).then((data) => ({
    total: data.total,
    items: data.items.map((item, index) => normalizeId(item, `issue-${String(index)}`)),
  }));
}

export function getProfitAuditIssue(id: string): Promise<IssueDetailResponse> {
  return apiFetch<
    IssueDetailResponse & {
      issue: OzonDetectedIssue & { _id?: string };
      recommendation: (IssueDetailResponse['recommendation'] & { _id?: string }) | null;
    }
  >(`/issues/${id}`).then((data) => ({
    issue: normalizeId(data.issue),
    recommendation: data.recommendation ? normalizeId(data.recommendation) : null,
  }));
}

export function updateProfitAuditIssueStatus(
  id: string,
  status: 'VIEWED' | 'FIXED' | 'IGNORED',
): Promise<{ issue: OzonDetectedIssue }> {
  return apiFetch<{ issue: OzonDetectedIssue & { _id?: string } }>(
    `/issues/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  ).then((data) => ({
    issue: normalizeId(data.issue),
  }));
}

export function getAuditRecommendations(
  activeOnly = true,
): Promise<OzonAuditRecommendation[]> {
  const query = activeOnly ? '?activeOnly=true' : '';
  return apiFetch<Array<OzonAuditRecommendation & { _id?: string }>>(
    `/audit/recommendations${query}`,
  ).then((rows) =>
    rows.map((row, index) => normalizeId(row, `audit-rec-${String(index)}`)),
  );
}

export function updateAuditRecommendationStatus(
  id: string,
  status: OzonAuditRecommendationStatus,
): Promise<{ recommendation: OzonAuditRecommendation }> {
  return apiFetch<{ recommendation: OzonAuditRecommendation & { _id?: string } }>(
    `/audit/recommendations/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  ).then((data) => ({
    recommendation: normalizeId(data.recommendation),
  }));
}
