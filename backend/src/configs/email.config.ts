import { registerAs } from '@nestjs/config';

export default registerAs(
    'email',
    (): Record<string, unknown> => ({
        fromEmail: 'noreply@mail.com',
    })
);
