import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getConnectionAudit } from '../../api/ozon/ozonApi';
import { LegalNotice } from '../../components/ui/LegalNotice';
import { Badge, Card, PageHeader } from '../../components/ui/Page';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateBlocks';
import { formatDate, getHumanError } from '../../utils/ozon';
import { sanitizeAuditValue } from '../../utils/secrets';
import styles from '../../components/ui/Page.module.css';

export function AuditPage() {
  const { id = '' } = useParams();
  const [status, setStatus] = useState('');
  const [complianceDecision, setComplianceDecision] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['ozon', 'audit', id, status, complianceDecision, errorCode, dateFrom, dateTo],
    queryFn: () =>
      getConnectionAudit(id, {
        status: status || undefined,
        complianceDecision: complianceDecision || undefined,
        errorCode: errorCode || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    enabled: Boolean(id),
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((log) => {
      if (dateFrom && log.createdAt && log.createdAt < dateFrom) return false;
      if (dateTo && log.createdAt && log.createdAt > `${dateTo}T23:59:59`) return false;
      return true;
    });
  }, [data, dateFrom, dateTo]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getHumanError(error)} />;

  return (
    <div>
      <PageHeader title="Audit / Compliance" subtitle={`Подключение ${id}`} />

      <LegalNotice />

      <div className={styles.filters}>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Все статусы</option>
          <option value="success">success</option>
          <option value="failed">failed</option>
        </select>
        <input
          placeholder="complianceDecision"
          value={complianceDecision}
          onChange={(e) => setComplianceDecision(e.target.value)}
        />
        <input placeholder="errorCode" value={errorCode} onChange={(e) => setErrorCode(e.target.value)} />
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>

      {!filtered.length ? (
        <EmptyState title="Записей audit нет" />
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>Message</th>
                  <th>Request host</th>
                  <th>Endpoint</th>
                  <th>Compliance</th>
                  <th>Error code</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.createdAt)}</td>
                    <td>{log.action}</td>
                    <td>
                      <Badge tone={log.status === 'failed' ? 'danger' : 'success'}>
                        {log.status}
                      </Badge>
                    </td>
                    <td>{sanitizeAuditValue('message', log.message ?? log.summary)}</td>
                    <td>{sanitizeAuditValue('requestHost', log.requestHost ?? log.ipAddress)}</td>
                    <td>{sanitizeAuditValue('endpoint', log.endpoint)}</td>
                    <td>{sanitizeAuditValue('complianceDecision', log.complianceDecision)}</td>
                    <td>{sanitizeAuditValue('errorCode', log.errorCode)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
