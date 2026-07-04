import { registerAs } from '@nestjs/config';

export default registerAs(
    'telegram',
    (): Record<string, unknown> => ({
        botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
        alertsEnabled: process.env.TELEGRAM_ALERTS_ENABLED !== 'false',
        miniAppUrl: process.env.TELEGRAM_MINI_APP_URL ?? '',
        usePolling: process.env.TELEGRAM_USE_POLLING === 'true',
        webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET ?? '',
        initDataMaxAgeSec: process.env.TELEGRAM_INIT_DATA_MAX_AGE_SEC
            ? Number.parseInt(process.env.TELEGRAM_INIT_DATA_MAX_AGE_SEC, 10)
            : 86_400,
    }),
);
