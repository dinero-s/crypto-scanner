import { ThrottlerAsyncOptions } from '@nestjs/throttler';

export const throttlerOptions: ThrottlerAsyncOptions = {
    useFactory: () => ({
        throttlers: [
            {
                name: 'login',
                ttl: 60 * 1000,
                limit: 5,
            },
        ],
    }),
};
