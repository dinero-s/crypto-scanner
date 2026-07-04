import { registerAs } from '@nestjs/config';
import ms from 'ms';

export default registerAs(
    'request',
    (): Record<string, unknown> => ({
        timeout: ms('300000s'), // 30s based on ms module
    })
);


