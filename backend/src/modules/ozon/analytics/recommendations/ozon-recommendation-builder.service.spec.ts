import { OzonRecommendationBuilderService } from './ozon-recommendation-builder.service';
import {
    OzonAuditActionType,
    OzonAuditRecommendationStatus,
    OzonAuditSeverity,
    OzonDetectedIssueType,
    OzonLossCalculationConfidence,
} from '../../constants/ozon.enums';
import { Types } from 'mongoose';
import { OzonDetectedIssueDoc } from '../entities/ozon-detected-issue.entity';
import { buildRecommendationKey } from '../utils/audit-key.utils';

function mockIssue(type: OzonDetectedIssueType): OzonDetectedIssueDoc {
    const userId = new Types.ObjectId();
    const integrationId = new Types.ObjectId();
    return {
        _id: new Types.ObjectId(),
        userId,
        integrationId,
        type,
        severity: OzonAuditSeverity.HIGH,
        confidence: 0.8,
        title: 'Test issue',
        summary: 'Test summary',
        evidence: [],
        productId: 'p1',
        offerId: 'o1',
        sku: 'SKU-1',
        issueKey: buildRecommendationKey(
            userId.toString(),
            integrationId.toString(),
            'o1',
            'p1',
            type,
        ),
        lossCalculationConfidence: OzonLossCalculationConfidence.MEDIUM,
    } as OzonDetectedIssueDoc;
}

describe('OzonRecommendationBuilderService', () => {
    const userId = new Types.ObjectId().toString();
    const integrationId = new Types.ObjectId().toString();
    const auditRunId = new Types.ObjectId().toString();
    const periodFrom = new Date('2026-01-01T00:00:00.000Z');
    const periodTo = new Date('2026-01-31T00:00:00.000Z');

    let findExecMock: jest.Mock;
    let bulkWriteMock: jest.Mock;
    let builder: OzonRecommendationBuilderService;

    beforeEach(() => {
        findExecMock = jest.fn().mockResolvedValue([]);
        bulkWriteMock = jest.fn().mockResolvedValue({});

        builder = new OzonRecommendationBuilderService(
            {
                find: jest.fn().mockReturnValue({ exec: findExecMock }),
                bulkWrite: bulkWriteMock,
            } as never,
            {} as never,
        );
    });

    it('строит рекомендацию STOCKOUT_RISK', () => {
        const result = builder.buildFromIssue(mockIssue(OzonDetectedIssueType.STOCKOUT_RISK));
        expect(result.actionType).toBe(OzonAuditActionType.CHECK_STOCK);
        expect(result.steps.length).toBeGreaterThanOrEqual(3);
    });

    it('строит рекомендацию ADS_WASTE', () => {
        const result = builder.buildFromIssue(mockIssue(OzonDetectedIssueType.ADS_WASTE));
        expect(result.actionType).toBe(OzonAuditActionType.REDUCE_AD_SPEND);
        expect(result.title).toContain('реклам');
    });

    it('строит рекомендацию PRICE_LEAK', () => {
        const result = builder.buildFromIssue(mockIssue(OzonDetectedIssueType.PRICE_LEAK));
        expect(result.actionType).toBe(OzonAuditActionType.CHECK_PRICE);
    });

    it('не создаёт дубль active recommendation — обновляет NEW', async () => {
        const issue = mockIssue(OzonDetectedIssueType.STOCKOUT_RISK);
        const existingRec = {
            _id: new Types.ObjectId(),
            recommendationKey: buildRecommendationKey(
                userId,
                integrationId,
                issue.offerId,
                issue.productId,
                issue.type,
            ),
            status: OzonAuditRecommendationStatus.NEW,
            title: 'Старое название',
            issueId: undefined as Types.ObjectId | undefined,
        };

        findExecMock
            .mockResolvedValueOnce([existingRec])
            .mockResolvedValueOnce([existingRec]);

        const result = await builder.buildForIssues(
            userId,
            integrationId,
            [issue],
            auditRunId,
            periodFrom,
            periodTo,
        );

        expect(bulkWriteMock).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    updateOne: expect.objectContaining({
                        filter: { _id: existingRec._id },
                    }),
                }),
            ]),
            { ordered: false },
        );
        expect(result).toHaveLength(1);
    });

    it('создаёт новую recommendation если активной нет', async () => {
        const issue = mockIssue(OzonDetectedIssueType.ADS_WASTE);
        const newRec = { _id: new Types.ObjectId() };

        findExecMock.mockResolvedValueOnce([]).mockResolvedValueOnce([newRec]);

        const result = await builder.buildForIssues(
            userId,
            integrationId,
            [issue],
            auditRunId,
            periodFrom,
            periodTo,
        );

        expect(bulkWriteMock).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    updateOne: expect.objectContaining({
                        upsert: true,
                    }),
                }),
            ]),
            { ordered: false },
        );
        expect(result).toHaveLength(1);
    });

    it('обновляет VIEWED recommendation вместо создания дубля', async () => {
        const issue = mockIssue(OzonDetectedIssueType.PRICE_LEAK);
        const existingRec = {
            _id: new Types.ObjectId(),
            recommendationKey: buildRecommendationKey(
                userId,
                integrationId,
                issue.offerId,
                issue.productId,
                issue.type,
            ),
            status: OzonAuditRecommendationStatus.VIEWED,
            description: 'старое описание',
        };

        findExecMock
            .mockResolvedValueOnce([existingRec])
            .mockResolvedValueOnce([existingRec]);

        await builder.buildForIssues(
            userId,
            integrationId,
            [issue],
            auditRunId,
            periodFrom,
            periodTo,
        );

        expect(bulkWriteMock).toHaveBeenCalled();
    });
});
