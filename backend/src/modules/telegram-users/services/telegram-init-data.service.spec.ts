import { createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { TelegramInitDataService } from './telegram-init-data.service';

function buildInitData(botToken: string, user: Record<string, unknown>, authDate: number): string {
    const userJson = JSON.stringify(user);
    const params = new URLSearchParams({
        auth_date: String(authDate),
        user: userJson,
    });

    const dataCheckString = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
    const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    params.set('hash', hash);
    return params.toString();
}

describe('TelegramInitDataService', () => {
    const botToken = '123456:ABC-DEF';
    const configService = {
        get: jest.fn((key: string) => {
            if (key === 'telegram.botToken') {
                return botToken;
            }
            if (key === 'telegram.initDataMaxAgeSec') {
                return 86_400;
            }
            return undefined;
        }),
    } as unknown as ConfigService;

    const service = new TelegramInitDataService(configService);

    it('валидирует корректный initData', () => {
        const authDate = Math.floor(Date.now() / 1000);
        const initData = buildInitData(botToken, { id: 42, first_name: 'Test' }, authDate);

        const result = service.validateInitData(initData);

        expect(result.user.id).toBe(42);
        expect(result.authDate).toBe(authDate);
    });

    it('отклоняет initData с неверным hash', () => {
        expect(() => service.validateInitData('auth_date=1&user=%7B%22id%22%3A1%7D&hash=deadbeef')).toThrow(
            'initData: неверная подпись',
        );
    });

    it('tryValidateInitData возвращает null при ошибке', () => {
        expect(service.tryValidateInitData('invalid')).toBeNull();
    });
});
