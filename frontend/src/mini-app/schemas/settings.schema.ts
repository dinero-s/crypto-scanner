import { z } from 'zod';

const exchangeSchema = z.enum([
  'binance',
  'bybit',
  'okx',
  'gate',
  'kucoin',
  'kraken',
]);

export const settingsSchema = z.object({
  minNetYieldAlert: z
    .number({ error: 'Укажите число' })
    .min(0, 'Минимум 0')
    .max(100, 'Максимум 100'),
  minFundingAlert: z
    .number({ error: 'Укажите число' })
    .min(0, 'Минимум 0')
    .max(1, 'Максимум 1 (100%)'),
  allowedExchanges: z.array(exchangeSchema),
  symbolWhitelist: z.string(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export const defaultSettings: SettingsFormValues = {
  minNetYieldAlert: 0.1,
  minFundingAlert: 0.0001,
  allowedExchanges: ['binance', 'bybit', 'okx'],
  symbolWhitelist: '',
};

export function parseSymbolWhitelist(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}
