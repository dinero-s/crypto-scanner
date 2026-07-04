import { registerAs } from '@nestjs/config';

export default registerAs(
    'database',
    (): Record<string, unknown> => ({
        uri:
            process.env?.DATABASE_URI ??
            process.env?.MONGODB_URI ??
            'mongodb://localhost:27017',

        debug: process.env.DATABASE_DEBUG === 'true',
        timeoutOptions: {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 10000,
            heartbeatFrequencyMS: 30000,
        },
    })
);
