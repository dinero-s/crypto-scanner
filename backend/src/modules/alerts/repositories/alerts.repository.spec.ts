import { Types } from 'mongoose';
import { ArbitrageTypeEnum } from 'src/modules/arbitrage/enums/arbitrage-type.enum';
import { AlertDeliveryStatusEnum } from '../enums/alert-type.enum';
import { AlertsRepository } from './alerts.repository';

describe('AlertsRepository dedup/cooldown', () => {
    const userId = new Types.ObjectId();

    const createRepository = (sentDocs: unknown[]) => {
        const settingsModel = {
            findOne: jest.fn(),
            create: jest.fn(),
            findOneAndUpdate: jest.fn(),
            find: jest.fn(),
        };

        const sentModel = {
            findOne: jest.fn(({ fingerprint, opportunityType, symbolKey, sentAt }) => {
                const match = (sentDocs as Array<Record<string, unknown>>).find((doc) => {
                    if (fingerprint && doc.fingerprint !== fingerprint) {
                        return false;
                    }
                    if (opportunityType && doc.opportunityType !== opportunityType) {
                        return false;
                    }
                    if (symbolKey && doc.symbolKey !== symbolKey) {
                        return false;
                    }
                    if (sentAt?.$gte && (doc.sentAt as Date).getTime() < sentAt.$gte) {
                        return false;
                    }
                    return doc.status === AlertDeliveryStatusEnum.SENT;
                });
                return {
                    select: () => ({
                        lean: () => ({
                            exec: async () => (match ? { _id: '1' } : null),
                        }),
                    }),
                };
            }),
            create: jest.fn(),
            findOneAndUpdate: jest.fn(),
        };

        return new AlertsRepository(
            settingsModel as never,
            sentModel as never,
        );
    };

    it('hasSentFingerprint возвращает true при совпадении fingerprint', async () => {
        const repo = createRepository([
            {
                fingerprint: 'funding|BTC|USDT|binance|bybit|0.0395|1700000000000',
                status: AlertDeliveryStatusEnum.SENT,
                sentAt: new Date(),
            },
        ]);

        const exists = await repo.hasSentFingerprint(
            userId,
            'funding|BTC|USDT|binance|bybit|0.0395|1700000000000',
        );

        expect(exists).toBe(true);
    });

    it('isInCooldown возвращает true при недавней отправке', async () => {
        const repo = createRepository([
            {
                opportunityType: ArbitrageTypeEnum.FUNDING,
                symbolKey: 'BTC/USDT',
                status: AlertDeliveryStatusEnum.SENT,
                sentAt: new Date(Date.now() - 60_000),
            },
        ]);

        const inCooldown = await repo.isInCooldown(
            userId,
            ArbitrageTypeEnum.FUNDING,
            'BTC/USDT',
            3600,
        );

        expect(inCooldown).toBe(true);
    });

    it('isInCooldown возвращает false если cooldown истёк', async () => {
        const repo = createRepository([
            {
                opportunityType: ArbitrageTypeEnum.FUNDING,
                symbolKey: 'BTC/USDT',
                status: AlertDeliveryStatusEnum.SENT,
                sentAt: new Date(Date.now() - 7_200_000),
            },
        ]);

        const inCooldown = await repo.isInCooldown(
            userId,
            ArbitrageTypeEnum.FUNDING,
            'BTC/USDT',
            3600,
        );

        expect(inCooldown).toBe(false);
    });
});
