import { registerAs } from '@nestjs/config';

export default registerAs(
    'alerts',
    (): Record<string, unknown> => ({
        defaultCooldownSec: process.env.ALERT_DEFAULT_COOLDOWN_SEC
            ? Number.parseInt(process.env.ALERT_DEFAULT_COOLDOWN_SEC, 10)
            : 3600,
        dedupEnabled: process.env.ALERT_DEDUP_ENABLED !== 'false',
    }),
);
