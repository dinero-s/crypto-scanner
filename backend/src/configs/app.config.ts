import { registerAs } from '@nestjs/config';
import { version } from 'package.json';
import {
    ENUM_APP_ENVIRONMENT,
    ENUM_APP_TIMEZONE,
} from 'src/app/constants/app.enum.constant';

export default registerAs(
    'app',
    (): Record<string, unknown> => ({
        name: process.env.APP_NAME ?? 'nestjs-backend',
        env: process.env.APP_ENV ?? ENUM_APP_ENVIRONMENT.DEVELOPMENT,
        timezone: process.env.APP_TIMEZONE ?? ENUM_APP_TIMEZONE.ASIA_ALMATY,
        repoVersion: version,
        SERVER_URL: process.env.SERVER_URL ?? 'http://localhost:4001',
        globalPrefix: '/api',
        debug: process.env.APP_DEBUG === 'true',
        redisHost: process.env.REDIS_HOST ?? 'localhost',
        jobEnable: process.env.JOB_ENABLE === 'true',
        /** Throttle: в production всегда включён; в dev — только при THROTTLE_ENABLE=true */
        throttleEnable:
            (process.env.APP_ENV ?? ENUM_APP_ENVIRONMENT.DEVELOPMENT) ===
            ENUM_APP_ENVIRONMENT.PRODUCTION
                ? true
                : process.env.THROTTLE_ENABLE === 'true',
        http: {
            enable: process.env.HTTP_ENABLE === 'true',
            host: process.env.HTTP_HOST ?? 'localhost',
            port: process.env.HTTP_PORT
                ? Number.parseInt(process.env.HTTP_PORT, 10)
                : 4001,
        },
        urlVersion: {
            enable: process.env.URL_VERSIONING_ENABLE === 'true',
            prefix: 'v',
            version: process.env.URL_VERSION ?? '1',
        },
        tokenSecretAdmin: process.env.TOKEN_SECRET_ADMIN,
        tokenSecretMobile: process.env.TOKEN_SECRET_USER,
    })
);
