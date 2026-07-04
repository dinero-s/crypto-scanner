import { registerAs } from '@nestjs/config';
import bytes from 'bytes';
import ms from 'ms';

function parseCorsAllowOrigins(raw: string | undefined): string[] {
    if (!raw?.trim()) {
        return ['http://localhost:5173', 'http://localhost:4001'];
    }

    return raw
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
}

export default registerAs(
    'middleware',
    (): Record<string, unknown> => ({
        body: {
            json: {
                maxFileSize: bytes('1gb'), // 100kb
            },
            raw: {
                maxFileSize: bytes('1gb'), // 100kb
            },
            text: {
                maxFileSize: bytes('1gb'), // 100kb
            },
            urlencoded: {
                maxFileSize: bytes('1gb'), // 100kb
            },
        },
        timeout: ms('30s'), // 30s based on ms module
        cors: {
            allowMethod: ['GET', 'DELETE', 'PUT', 'PATCH', 'POST'],
            allowOrigins: parseCorsAllowOrigins(process.env.CORS_ALLOW_ORIGINS),
            allowHeader: [
                'Accept',
                'Accept-Language',
                'Content-Language',
                'Content-Type',
                'Origin',
                'Authorization',
                'Access-Control-Request-Method',
                'Access-Control-Request-Headers',
                'Access-Control-Allow-Headers',
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Credentials',
                'Access-Control-Expose-Headers',
                'Access-Control-Max-Age',
                'Referer',
                'Host',
                'X-Requested-With',
                'x-custom-lang',
                'x-timestamp',
                'x-api-key',
                'x-timezone',
                'x-request-id',
                'x-version',
                'x-repo-version',
                'X-Response-Time',
                'user-agent',
            ],
        },
        throttle: {
            ttl: ms('500'), // 0.5 secs
            limit: 10, // max request per reset time
        },
    })
);
