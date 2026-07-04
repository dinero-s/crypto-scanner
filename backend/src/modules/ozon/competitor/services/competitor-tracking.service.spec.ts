import { Types } from 'mongoose';
import { CompetitorProductStatus } from '../../constants/ozon.enums';
import { CompetitorTrackingService } from './competitor-tracking.service';

describe('CompetitorTrackingService — fanOutCompetitorSyncJobs', () => {
    it('ставит отдельный job на каждого активного конкурента', async () => {
        const userId = new Types.ObjectId().toString();
        const competitorIds = [new Types.ObjectId(), new Types.ObjectId()];

        const enqueueCompetitorSync = jest.fn().mockResolvedValue(undefined);
        const findExec = jest.fn().mockResolvedValue(
            competitorIds.map((id) => ({ _id: id })),
        );

        const service = new CompetitorTrackingService(
            {
                find: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({ exec: findExec }),
                }),
            } as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            { enqueueCompetitorSync } as never,
        );

        const queued = await service.fanOutCompetitorSyncJobs(userId);

        expect(queued).toBe(2);
        expect(enqueueCompetitorSync).toHaveBeenCalledTimes(2);
        expect(enqueueCompetitorSync).toHaveBeenCalledWith(
            String(competitorIds[0]),
            userId,
        );
        expect(enqueueCompetitorSync).toHaveBeenCalledWith(
            String(competitorIds[1]),
            userId,
        );
        expect(findExec).toHaveBeenCalled();
    });

    it('фильтрует по connectionId при fan-out', async () => {
        const userId = new Types.ObjectId().toString();
        const connectionId = new Types.ObjectId().toString();
        const findMock = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([]),
            }),
        });

        const service = new CompetitorTrackingService(
            { find: findMock } as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            { enqueueCompetitorSync: jest.fn() } as never,
        );

        await service.fanOutCompetitorSyncJobs(userId, connectionId);

        expect(findMock).toHaveBeenCalledWith({
            userId: new Types.ObjectId(userId),
            status: CompetitorProductStatus.ACTIVE,
            connectionId: new Types.ObjectId(connectionId),
        });
    });
});
