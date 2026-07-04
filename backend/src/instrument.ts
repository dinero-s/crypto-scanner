import 'dotenv/config';

import { HttpException } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { version } from 'package.json';

import { ENUM_APP_ENVIRONMENT } from 'src/app/constants/app.enum.constant';

const dsn = process.env.SENTRY_DSN;
const env = process.env.APP_ENV ?? ENUM_APP_ENVIRONMENT.DEVELOPMENT;

if (dsn && env !== ENUM_APP_ENVIRONMENT.DEVELOPMENT) {
    Sentry.init({
        dsn,
        environment: env,
        release: `nestjs-backend@${version}`,
        integrations: [nodeProfilingIntegration()],
        tracesSampleRate: env === ENUM_APP_ENVIRONMENT.PRODUCTION ? 0.1 : 0.2,
        profilesSampleRate: env === ENUM_APP_ENVIRONMENT.PRODUCTION ? 0.1 : 0.2,
        beforeSend(event, hint) {
            const original = hint.originalException;
            if (
                original instanceof HttpException &&
                original.getStatus() < 500
            ) {
                return null;
            }
            return event;
        },
    });
}
