export type AvailabilityStatus =
  | 'AVAILABLE'
  | 'PARTIAL'
  | 'NOT_AVAILABLE_VIA_OFFICIAL_API'
  | 'API_ERROR'
  | 'PENDING';

export type ConnectionStatus =
  | 'ACTIVE'
  | 'ERROR'
  | 'DELETED'
  | 'CHECKING'
  | 'active'
  | 'invalid'
  | 'revoked'
  | 'error';

export type RecommendationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'low' | 'medium' | 'high' | 'critical';

export type RecommendationStatus =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'IGNORED'
  | 'open'
  | 'resolved'
  | 'dismissed';

export type RecommendationType =
  | 'PRICE'
  | 'STOCK'
  | 'ADS'
  | 'COMPETITOR'
  | 'FINANCE'
  | 'COMPLIANCE'
  | 'DATA_UNAVAILABLE'
  | string;

export type AlertChannel = 'EMAIL' | 'TELEGRAM';

export type AlertStatus = 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED' | 'pending' | 'sent' | 'failed' | 'skipped';

export interface OzonConnection {
  id: string;
  sellerName: string;
  clientId: string;
  status: ConnectionStatus;
  permissions?: string[];
  lastSyncAt?: string;
  telegramChatId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OzonProduct {
  id?: string;
  productId: string;
  offerId?: string;
  sku?: string;
  title?: string;
  price?: number;
  stockPresent?: number;
  stockReserved?: number;
  lastSyncedAt?: string;
  updatedAt?: string;
  connectionId?: string;
  minCompetitorPrice?: number;
  availabilityStatus?: AvailabilityStatus;
  recommendationsCount?: number;
  alertsCount?: number;
}

export interface OzonCompetitor {
  id: string;
  connectionId: string;
  url?: string;
  marketplace?: string;
  externalProductId?: string;
  productId?: string;
  sku?: string;
  offerId?: string;
  urlReference?: string;
  name?: string;
  title?: string;
  sellerName?: string;
  brand?: string;
  category?: string;
  status: string;
  lastPrice?: number;
  lastOldPrice?: number;
  lastRating?: number;
  lastReviewsCount?: number;
  lastAvailability?: string;
  lastSyncedAt?: string;
  lastError?: string;
  price?: number;
  rating?: number;
  reviewsCount?: number;
  availabilityStatus?: AvailabilityStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface OzonCompetitorSnapshot {
  id?: string;
  date?: string;
  collectedAt?: string;
  price?: number;
  oldPrice?: number;
  discountPercent?: number;
  rating?: number;
  reviewsCount?: number;
  availability?: string;
  sellerName?: string;
  rawAvailableFields?: string[];
}

export interface OzonAlert {
  id: string;
  type: string;
  severity: RecommendationSeverity;
  status: AlertStatus;
  channel?: AlertChannel;
  message: string;
  productId?: string;
  recommendationId?: string;
  competitorProductId?: string;
  payload?: Record<string, unknown>;
  sentAt?: string;
  createdAt?: string;
  deliveryError?: string;
}

export interface OzonAuditLog {
  id: string;
  action: string;
  status: string;
  message?: string;
  summary?: string;
  requestHost?: string;
  endpoint?: string;
  complianceDecision?: string;
  errorCode?: string;
  ipAddress?: string;
  createdAt?: string;
}

export interface OzonDashboardSummary {
  productsCount: number;
  activeCompetitorsCount: number;
  recommendationsCount: number;
  criticalAlertsCount: number;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  complianceStatus: 'ok' | 'warning' | 'error';
  unavailableMetrics: string[];
}

export interface CreateConnectionPayload {
  sellerName: string;
  clientId: string;
  apiKey: string;
}

export interface CreateCompetitorPayload {
  connectionId: string;
  productId?: string;
  sku?: string;
  offerId?: string;
  url?: string;
}

export interface ProductsQueryParams {
  connectionId?: string;
  search?: string;
  hasRecommendations?: boolean;
  hasAlerts?: boolean;
  noStock?: boolean;
  priceAboveCompetitor?: boolean;
  priceBelowCompetitor?: boolean;
  partialCompetitorData?: boolean;
  sortBy?: 'price' | 'stock' | 'updatedAt' | 'severity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductsListResponse {
  items: OzonProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditQueryParams {
  status?: string;
  complianceDecision?: string;
  errorCode?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ProductAnalytics {
  product?: OzonProduct;
  snapshots?: Array<Record<string, unknown>>;
  competitors?: OzonCompetitor[];
  alerts?: OzonAlert[];
  salesData?: Record<string, unknown>;
  availabilityStatus?: AvailabilityStatus;
}

/** Типы Profit Audit (backend) */
export type OzonDetectedIssueType =
  | 'STOCKOUT_RISK'
  | 'OVERSTOCK'
  | 'ADS_WASTE'
  | 'PRICE_LEAK'
  | 'RETURN_SPIKE';

export type OzonAuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type OzonDetectedIssueStatus = 'NEW' | 'VIEWED' | 'FIXED' | 'IGNORED';

export type OzonAiReportType = 'INITIAL_AUDIT' | 'DAILY_CEO_REPORT';

export type OzonAuditRunStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'PARTIAL_DATA';

export type OzonAuditRunProgressStep =
  | 'QUEUED'
  | 'SYNC'
  | 'METRICS_BUILD'
  | 'DATA_QUALITY'
  | 'ISSUES_DETECT'
  | 'RECOMMENDATIONS_BUILD'
  | 'AI_REPORT'
  | 'DONE'
  | 'FAILED';

export type OzonAuditDataQualityState = 'READY' | 'PARTIAL_DATA' | 'INSUFFICIENT_DATA';

export type OzonLossCalculationConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type OzonDetectorAvailabilityStatus = 'READY' | 'PARTIAL' | 'NOT_AVAILABLE';

export type OzonDetectorKey =
  | 'stockoutRisk'
  | 'overstock'
  | 'adsWaste'
  | 'priceLeak'
  | 'returnSpike';

export interface IssueEvidence {
  metric: string;
  value: number | string | boolean | null;
  threshold?: number | string | null;
  period?: string;
  description?: string;
}

export interface OzonDetectedIssue {
  id: string;
  userId?: string;
  integrationId?: string;
  productId?: string;
  offerId?: string;
  sku?: string;
  type: OzonDetectedIssueType;
  severity: OzonAuditSeverity;
  confidence: number;
  estimatedLossMin?: number;
  estimatedLossMax?: number;
  lossCalculationConfidence?: OzonLossCalculationConfidence;
  lossExplanation?: string;
  title: string;
  summary: string;
  evidence: IssueEvidence[];
  status: OzonDetectedIssueStatus;
  periodFrom?: string;
  periodTo?: string;
  detectedAt?: string;
  createdAt?: string;
}

export type OzonAuditRecommendationStatus = 'NEW' | 'VIEWED' | 'DONE' | 'IGNORED';

export interface OzonAuditRecommendation {
  id: string;
  issueId: string;
  productId?: string;
  offerId?: string;
  sku?: string;
  priority: number;
  actionType: string;
  title: string;
  description: string;
  steps: string[];
  expectedEffectMin?: number;
  expectedEffectMax?: number;
  estimatedLossMin?: number;
  estimatedLossMax?: number;
  lossCalculationConfidence?: OzonLossCalculationConfidence;
  lossExplanation?: string;
  confidence: number;
  status: OzonAuditRecommendationStatus;
  periodFrom?: string;
  periodTo?: string;
  createdAt?: string;
}

export interface OzonAiReport {
  id: string;
  auditRunId?: string;
  integrationId?: string;
  periodFrom?: string;
  periodTo?: string;
  type: OzonAiReportType;
  facts?: Record<string, unknown>;
  aiText: string;
  modelName?: string;
  promptVersion?: string;
  createdAt?: string;
}

export interface AuditSummary {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  estimatedLossMin: number;
  estimatedLossMax: number;
  lossCalculationConfidence?: OzonLossCalculationConfidence;
}

export type OzonAuditMissingDataType =
  | 'PRODUCTS'
  | 'PRICES'
  | 'STOCKS'
  | 'SALES'
  | 'FINANCE'
  | 'ADS'
  | 'RETURNS';

export interface OzonAuditMissingDataItem {
  type: OzonAuditMissingDataType;
  title: string;
  description: string;
  impact: string;
}

export interface OzonDetectorAvailabilityItem {
  status: OzonDetectorAvailabilityStatus;
  reason?: string;
}

export interface OzonDetectorAvailability {
  stockoutRisk: OzonDetectorAvailabilityItem;
  overstock: OzonDetectorAvailabilityItem;
  adsWaste: OzonDetectorAvailabilityItem;
  priceLeak: OzonDetectorAvailabilityItem;
  returnSpike: OzonDetectorAvailabilityItem;
}

export interface OzonAuditDataQuality {
  score: number;
  state: OzonAuditDataQualityState;
  hasProductsData: boolean;
  hasPriceData: boolean;
  hasStockData: boolean;
  hasSalesData: boolean;
  hasFinanceData: boolean;
  hasAdsData: boolean;
  hasReturnsData: boolean;
  missingData: OzonAuditMissingDataItem[];
  warnings: string[];
  detectorAvailability: OzonDetectorAvailability;
  checkedDetectorsCount: number;
  availableDetectorsCount: number;
  partialDetectorsCount: number;
  unavailableDetectorsCount: number;
}

export type OzonAuditUiState =
  | 'NO_CONNECTION'
  | 'CONNECTED_NOT_AUDITED'
  | 'AUDIT_RUNNING'
  | 'AUDIT_READY'
  | 'AUDIT_FAILED'
  | 'PARTIAL_DATA';

export interface OzonAuditRunView {
  id: string;
  status: OzonAuditRunStatus | string;
  progressStep: OzonAuditRunProgressStep | string;
  periodFrom: string;
  periodTo: string;
  periodDays: number;
  dataQualityScore?: number;
  dataQualityState?: OzonAuditDataQualityState | string;
  issuesCount?: number;
  criticalIssuesCount?: number;
  highIssuesCount?: number;
  recommendationsCount?: number;
  estimatedLossMin?: number;
  estimatedLossMax?: number;
  lossCalculationConfidence?: OzonLossCalculationConfidence | string;
  startedAt?: string;
  finishedAt?: string;
  errorMessage?: string;
}

export interface AuditStatusResponse {
  state: OzonAuditUiState;
  auditRun?: OzonAuditRunView;
  latestReportId?: string;
}

export interface RunAuditResponse {
  auditRunId: string;
  status: OzonAuditRunStatus | string;
  progressStep: OzonAuditRunProgressStep | string;
}

export interface LatestAuditReportResponse {
  report?: OzonAiReport;
  auditRun?: OzonAuditRunView;
  dataQuality?: OzonAuditDataQuality;
  topIssues: OzonDetectedIssue[];
  topRecommendations: OzonAuditRecommendation[];
  empty?: boolean;
  message?: string;
}

export interface IssuesListResponse {
  items: OzonDetectedIssue[];
  total: number;
}

export interface IssueDetailResponse {
  issue: OzonDetectedIssue;
  recommendation: OzonAuditRecommendation | null;
}

export interface IssuesQueryParams {
  connectionId?: string;
  status?: OzonDetectedIssueStatus;
  type?: OzonDetectedIssueType;
  severity?: OzonAuditSeverity;
  limit?: number;
  page?: number;
  excludeResolved?: boolean;
}

export interface RunAuditPayload {
  connectionId?: string;
  periodDays?: 30 | 60 | 90;
}
