const AUDIT_POLL_STEPS_MS = [5000, 10000, 15000, 30000] as const;

/** Интервал polling статуса аудита с backoff */
export function getAuditPollingInterval(dataUpdatedAt: number): number | false {
  const elapsedMs = Date.now() - dataUpdatedAt;
  if (elapsedMs < 60_000) return AUDIT_POLL_STEPS_MS[0];
  if (elapsedMs < 180_000) return AUDIT_POLL_STEPS_MS[1];
  if (elapsedMs < 600_000) return AUDIT_POLL_STEPS_MS[2];
  return AUDIT_POLL_STEPS_MS[3];
}

/** refetchInterval для React Query при AUDIT_RUNNING */
export function auditStatusRefetchInterval(query: {
  state: { dataUpdatedAt: number };
}): number | false {
  if (typeof document !== 'undefined' && document.hidden) return false;
  return getAuditPollingInterval(query.state.dataUpdatedAt);
}
