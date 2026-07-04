import { registerAs } from '@nestjs/config';

export default registerAs(
    'redis',
    (): Record<string, unknown> => ({
        host: process.env.REDIS_HOST ?? 'localhost',
        port: process.env.REDIS_PORT
            ? Number.parseInt(process.env.REDIS_PORT, 10)
            : 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB ? Number.parseInt(process.env.REDIS_DB, 10) : 0,
    })
);
