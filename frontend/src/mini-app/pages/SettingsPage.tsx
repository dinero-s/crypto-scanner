import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { fetchSubscription } from '../api/telegramApi';
import type { Exchange } from '../api/types';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ErrorState } from '../components/ui/StateBlocks';
import { useSettings } from '../context/SettingsProvider';
import { useTelegram } from '../context/TelegramProvider';
import {
  settingsSchema,
  type SettingsFormValues,
} from '../schemas/settings.schema';
import { getHumanError } from '../../utils/format';
import styles from './SettingsPage.module.css';

const ALL_EXCHANGES: Exchange[] = ['binance', 'bybit', 'okx', 'gate', 'kucoin', 'kraken'];

export function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { user, isAuthenticated, authError } = useTelegram();
  const [saved, setSaved] = useState(false);

  const subscriptionQuery = useQuery({
    queryKey: ['mini-app', 'subscription'],
    queryFn: fetchSubscription,
    retry: false,
    enabled: isAuthenticated,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });

  const allowedExchanges = watch('allowedExchanges');

  const toggleExchange = (exchange: Exchange) => {
    const current = allowedExchanges ?? [];
    const next = current.includes(exchange)
      ? current.filter((e) => e !== exchange)
      : [...current, exchange];
    setValue('allowedExchanges', next, { shouldValidate: true });
  };

  const onSubmit = (values: SettingsFormValues) => {
    updateSettings(values);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const subscriptionStatus = subscriptionQuery.data?.status ?? 'free';

  return (
    <div className={styles.page}>
      <div className={styles.subscriptionCard}>
        <div>
          <p className={styles.subscriptionLabel}>Подписка</p>
          <p className={styles.subscriptionValue}>{subscriptionStatus}</p>
          {user && (
            <p className={styles.hint}>
              {user.firstName ?? 'User'} {user.lastName ?? ''}
            </p>
          )}
        </div>
        <Badge variant={subscriptionStatus === 'premium' ? 'accent' : 'neutral'}>
          {subscriptionStatus === 'free' ? 'Mock free' : subscriptionStatus}
        </Badge>
      </div>

      {authError && (
        <Card title="Telegram auth">
          <p className={styles.hint}>{authError}</p>
        </Card>
      )}

      {subscriptionQuery.error && isAuthenticated && (
        <ErrorState message={getHumanError(subscriptionQuery.error)} />
      )}

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="minNetYieldAlert">
            Порог net yield для alert (%)
          </label>
          <input
            id="minNetYieldAlert"
            type="number"
            step="0.01"
            {...register('minNetYieldAlert', { valueAsNumber: true })}
          />
          {errors.minNetYieldAlert && (
            <span className={styles.error}>{errors.minNetYieldAlert.message}</span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="minFundingAlert">
            Порог funding rate для alert (доля, 0.0001 = 0.01%)
          </label>
          <input
            id="minFundingAlert"
            type="number"
            step="0.0001"
            {...register('minFundingAlert', { valueAsNumber: true })}
          />
          {errors.minFundingAlert && (
            <span className={styles.error}>{errors.minFundingAlert.message}</span>
          )}
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Разрешённые биржи</span>
          <div className={styles.checkboxGrid}>
            {ALL_EXCHANGES.map((exchange) => (
              <label key={exchange} className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  checked={allowedExchanges?.includes(exchange) ?? false}
                  onChange={() => toggleExchange(exchange)}
                />
                {exchange}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="symbolWhitelist">
            Whitelist символов (через запятую)
          </label>
          <textarea
            id="symbolWhitelist"
            rows={3}
            placeholder="BTCUSDT, ETHUSDT"
            {...register('symbolWhitelist')}
          />
          <p className={styles.hint}>Пусто = все символы. Применяется к спискам opportunities.</p>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          Сохранить настройки
        </button>

        {saved && <p className={styles.savedMsg}>Настройки сохранены локально</p>}
      </form>
    </div>
  );
}
