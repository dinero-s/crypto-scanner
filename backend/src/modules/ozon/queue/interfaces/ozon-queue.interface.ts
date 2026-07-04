/** Данные job синхронизации Ozon */
export interface OzonSyncJobData {
    connectionId: string;
    userId: string;
    syncType?: 'full' | 'products' | 'prices' | 'stocks' | 'orders';
}

/** Данные job синхронизации всех конкурентов */
export interface OzonCompetitorsBulkSyncJobData {
    userId: string;
    connectionId?: string;
}

/** Данные job Profit Audit pipeline */
export interface OzonAuditPipelineJobData {
    connectionId: string;
    userId: string;
    auditRunId: string;
    periodFrom: string;
    periodTo: string;
    periodDays: 30 | 60 | 90;
    reportType?: 'INITIAL_AUDIT' | 'DAILY_CEO_REPORT';
    skipSync?: boolean;
}

/** Данные job одного шага Profit Audit */
export interface OzonAuditStepJobData extends OzonAuditPipelineJobData {
    step: string;
}

/** Данные job синхронизации конкурента */
export interface OzonCompetitorSyncJobData {
    competitorId: string;
    userId: string;
}
