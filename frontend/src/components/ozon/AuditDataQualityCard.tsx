import { Badge, Card } from '../ui/Page';
import type { OzonAuditDataQuality, OzonDetectorKey } from '../../types/ozon';
import {
  getDataQualityStateLabel,
  getDetectorAvailabilityLabel,
  getDetectorAvailabilityTone,
  getDetectorLabel,
} from '../../utils/ozon';
import styles from '../ui/Page.module.css';

const DETECTOR_KEYS: OzonDetectorKey[] = [
  'stockoutRisk',
  'overstock',
  'adsWaste',
  'priceLeak',
  'returnSpike',
];

interface AuditDataQualityCardProps {
  dataQuality: OzonAuditDataQuality;
  showPartialWarning?: boolean;
}

/** Карточка качества данных Profit Audit */
export function AuditDataQualityCard({
  dataQuality,
  showPartialWarning = false,
}: AuditDataQualityCardProps) {
  const tone =
    dataQuality.score >= 80 ? 'success' : dataQuality.score >= 40 ? 'warning' : 'danger';

  return (
    <Card title="Качество данных">
      {showPartialWarning && dataQuality.state !== 'READY' && (
        <div className={styles.warningBox}>
          Аудит частичный: не все данные доступны. Некоторые направления не проверены.
        </div>
      )}

      <div className={`${styles.flexWrapCenter} ${styles.mbMd}`}>
        <Badge tone={tone}>{dataQuality.score}/100</Badge>
        <Badge tone={tone === 'success' ? 'success' : 'warning'}>
          {getDataQualityStateLabel(dataQuality.state)}
        </Badge>
        <span className={styles.muted}>
          Детекторов: {dataQuality.availableDetectorsCount}/{dataQuality.checkedDetectorsCount} готовы
        </span>
      </div>

      <div className={`${styles.tableWrap} ${styles.mbMd}`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Направление</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {DETECTOR_KEYS.map((key) => {
              const item = dataQuality.detectorAvailability[key];
              return (
                <tr key={key}>
                  <td>{getDetectorLabel(key)}</td>
                  <td>
                    <Badge tone={getDetectorAvailabilityTone(item.status)}>
                      {getDetectorAvailabilityLabel(item.status)}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dataQuality.warnings.length > 0 && (
        <ul className={styles.listSecondary}>
          {dataQuality.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      {dataQuality.missingData.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Отсутствует</th>
                <th>Влияние</th>
              </tr>
            </thead>
            <tbody>
              {dataQuality.missingData.map((item) => (
                <tr key={item.type}>
                  <td>{item.title}</td>
                  <td>{item.impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
