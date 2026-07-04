import { registerAs } from '@nestjs/config';

export default registerAs(
    'doc',
    (): Record<string, unknown> => ({
        enable: process.env.DOC_ENABLE === 'true',
        name: `${process.env.APP_NAME} API`,
        description: 'NestJS Backend API',
        version: '1.0',
        prefix: '/api/docs',
    })
);
