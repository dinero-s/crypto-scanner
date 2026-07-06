import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchOpportunityById } from '../api/arbitrageApi';
import { Badge } from '../components/ui/Badge';
import { MetricRow } from '../components/ui/MetricRow';
import { RiskBadge } from '../components/ui/RiskBadge';
import { VerdictBadge } from '../components/ui/VerdictBadge';
import { SkeletonPage } from '../components/ui/Skeleton';
import { ErrorState, RiskDisclaimer } from '../components/ui/StateBlocks';
import { useTelegram } from '../context/TelegramProvider';
import {
  estimateProfitUsd,
  formatExchange,
  formatPair,
  formatPercent,
  formatPrice,
  formatRate,
  formatTimestamp,
  formatUsd,
} from '../utils/format';
import { getRiskFactors } from '../utils/risk';
import { readTotalNetPercent, readTradeVerdict } from '../utils/tradeVerdict';
import { getHumanError } from '../../utils/format';
import styles from './OpportunityDetailPage.module.css';

function readMetaNumber(
  metadata: Record<string, number | string | boolean> | undefined,
  key: string,
): number | undefined {
  const value = metadata?.[key];
  return typeof value === 'number' ? value : undefined;
}

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { haptic, isAuthenticated } = useTelegram();
  const [positionSize, setPositionSize] = useState('10000');
  const [alertCreated, setAlertCreated] = useState(false);

  const query = useQuery({
    queryKey: ['mini-app', 'opportunity', id],
    queryFn: () => fetchOpportunityById(id ?? ''),
    enabled: Boolean(id),
  });

  if (query.isLoading) {
    return <SkeletonPage />;
  }

  if (query.error || !query.data) {
    return (
      <ErrorState
        message={getHumanError(query.error ?? new Error('Не найдено'))}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const item = query.data;
  const isFunding = item.type === 'funding';
  const feesPercent = readMetaNumber(item.metadata, 'estimatedFeesPercent') ?? 0;
  const slippagePercent = readMetaNumber(item.metadata, 'estimatedSlippagePercent') ?? 0;
  const spreadPercent = readMetaNumber(item.metadata, 'spotPerpSpreadPercent');
  const netFundingPercent = readMetaNumber(item.metadata, 'netFundingPercent');
  const entrySpreadImpact = readMetaNumber(item.metadata, 'entrySpreadImpactPercent');
  const grossYieldPercent = readMetaNumber(item.metadata, 'grossYieldPercent');
  const totalNetPercent = readTotalNetPercent(
    item.totalNetAfterEntryPercent ?? item.netYieldPercent ?? 0,
    item.metadata,
  );
  const tradeVerdict = readTradeVerdict(totalNetPercent, item.metadata);
  const positionUsd = Number(positionSize) || 0;
  const totalProfitUsd = estimateProfitUsd(positionUsd, totalNetPercent);
  const riskFactors = getRiskFactors(item.riskScore);
  const isProfitable = totalNetPercent > 0.05;
  const isUnprofitable = totalNetPercent < -0.05;

  const handleCreateAlert = () => {
    haptic('medium');
    setAlertCreated(true);
  };

  return (
    <div className={styles.page}>
      <RiskDisclaimer />

      <div className={styles.section}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.pairTitle}>{formatPair(item.baseAsset, item.quoteAsset)}</h2>
            <p className={styles.typeLabel}>
              {isFunding ? 'Funding Rate' : 'Cash & Carry'} · score {String(item.opportunityScore)}
            </p>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <VerdictBadge verdict={tradeVerdict} />
              <RiskBadge score={item.riskScore} />
            </div>
          </div>
          <div className={styles.yieldHero}>
            <div
              className={[
                styles.yieldValue,
                isProfitable ? styles.yieldPositive : '',
                isUnprofitable ? styles.yieldNegative : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {formatPercent(totalNetPercent)}
            </div>
            <div className={styles.yieldHint}>итого за 1 интервал</div>
            <div className={styles.yieldHint}>{formatUsd(totalProfitUsd)} на ${String(positionUsd || 10000)}</div>
            {item.annualizedApr != null && (
              <div className={styles.yieldHint}>
                {item.metadata?.isTheoreticalApr ? 'theoretical APR' : 'annualized APR'}{' '}
                {formatPercent(item.annualizedApr)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Итоговый расчёт</h3>
        {isFunding && grossYieldPercent !== undefined && (
          <MetricRow label="Funding (gross)" value={formatPercent(grossYieldPercent)} />
        )}
        {!isFunding && item.basisPercent !== undefined && (
          <MetricRow label="Basis (gross)" value={formatPercent(item.basisPercent)} />
        )}
        <MetricRow label="Комиссии" value={`−${formatPercent(feesPercent)}`} negative />
        <MetricRow label="Slippage" value={`−${formatPercent(slippagePercent)}`} negative />
        {isFunding && netFundingPercent !== undefined && (
          <MetricRow
            label="Net funding"
            value={formatPercent(netFundingPercent)}
            hint="доход только от funding"
          />
        )}
        {isFunding && entrySpreadImpact !== undefined && (
          <MetricRow
            label="Спред при входе"
            value={formatPercent(entrySpreadImpact)}
            positive={entrySpreadImpact > 0}
            negative={entrySpreadImpact < 0}
          />
        )}
        <div className={styles.divider} />
        <MetricRow
          label="Итого"
          value={formatPercent(totalNetPercent)}
          positive={isProfitable}
          negative={isUnprofitable}
          hint="funding/basis − fees − slippage ± спред при входе"
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Spot leg</h3>
        <MetricRow label="Биржа" value={formatExchange(item.spotExchange)} />
        <MetricRow label="Символ" value={item.spotSymbol} mono />
        <MetricRow label="Цена (ask)" value={formatPrice(item.spotPrice)} mono />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Futures / Perp leg</h3>
        <MetricRow label="Биржа" value={formatExchange(item.futuresExchange)} />
        <MetricRow label="Символ" value={item.futuresSymbol} mono />
        <MetricRow label="Цена (bid)" value={formatPrice(item.futuresPrice)} mono />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          {isFunding ? 'Funding' : 'Basis'}
        </h3>
        {isFunding && item.fundingRate !== undefined && (
          <MetricRow
            label="Funding rate"
            value={formatRate(item.fundingRate)}
            hint="за интервал funding"
          />
        )}
        {item.predictedFundingRate != null && (
          <MetricRow label="Predicted FR" value={formatRate(item.predictedFundingRate)} />
        )}
        {!isFunding && item.basisPercent !== undefined && (
          <MetricRow label="Basis" value={formatPercent(item.basisPercent)} />
        )}
        {item.nextFundingTime !== undefined && (
          <MetricRow label="Next funding" value={formatTimestamp(item.nextFundingTime)} />
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Fees & spread</h3>
        <MetricRow
          label="Est. fees"
          value={formatPercent(feesPercent)}
          hint="net after estimated fees"
        />
        <MetricRow label="Est. slippage" value={formatPercent(slippagePercent)} />
        {spreadPercent !== undefined && (
          <MetricRow label="Spot-perp spread" value={formatPercent(spreadPercent)} />
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Прибыль на вашу позицию</h3>
        <div className={styles.positionInput}>
          <label className={styles.typeLabel} htmlFor="position-size">
            Размер позиции (USD)
          </label>
          <input
            id="position-size"
            type="number"
            min="1"
            step="100"
            value={positionSize}
            onChange={(e) => setPositionSize(e.target.value)}
          />
        </div>
        <div className={styles.divider} />
        <MetricRow
          label="Итого за интервал"
          value={formatUsd(totalProfitUsd)}
          positive={isProfitable}
          negative={isUnprofitable}
          hint="оценка, не гарантирована"
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Risk factors</h3>
        <ul className={styles.riskList}>
          {riskFactors.map((factor) => (
            <li key={factor}>{factor}</li>
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Timestamps</h3>
        <MetricRow label="Calculated at" value={formatTimestamp(item.calculatedAt)} />
        {item.expiresAt !== undefined && (
          <MetricRow label="Expires at" value={formatTimestamp(item.expiresAt)} />
        )}
      </div>

      <button
        type="button"
        className={styles.alertBtn}
        onClick={handleCreateAlert}
        disabled={alertCreated}
      >
        {alertCreated ? 'Alert сохранён (mock)' : 'Создать alert'}
      </button>
      <p className={styles.alertNote}>
        {isAuthenticated
          ? 'Alert будет отправлен при достижении порогов из настроек.'
          : 'Авторизация через Telegram initData — заглушка. Структура alert API готова.'}
      </p>
      {alertCreated && (
        <Badge variant="success">Mock alert создан для {item.spotSymbol}</Badge>
      )}
    </div>
  );
}
