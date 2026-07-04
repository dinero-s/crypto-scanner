import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { OzonAuditService } from './ozon-audit.service';
import {
    OzonAuditRecommendationStatus,
    OzonDetectedIssueStatus,
} from '../../constants/ozon.enums';
import { OzonDetectedIssueDoc } from '../entities/ozon-detected-issue.entity';

describe('OzonAuditService — syncRecommendationStatus', () => {
    const userId = new Types.ObjectId().toString();
    const issueId = new Types.ObjectId();

    let issueSaveMock: jest.Mock;
    let recommendationUpdateOneMock: jest.Mock;
    let issueFindOneMock: jest.Mock;
    let service: OzonAuditService;

    beforeEach(() => {
        issueSaveMock = jest.fn().mockResolvedValue(undefined);
        recommendationUpdateOneMock = jest.fn().mockResolvedValue({ modifiedCount: 1 });
        issueFindOneMock = jest.fn();

        const issueModel = {
            findOne: issueFindOneMock,
        };

        const recommendationModel = {
            updateOne: recommendationUpdateOneMock,
        };

        service = new OzonAuditService(
            {} as never,
            issueModel as never,
            recommendationModel as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
            {} as never,
        );
    });

    function mockIssue(status: OzonDetectedIssueStatus): OzonDetectedIssueDoc {
        return {
            _id: issueId,
            userId: new Types.ObjectId(userId),
            status,
            save: issueSaveMock,
        } as unknown as OzonDetectedIssueDoc;
    }

    it('FIXED → recommendation DONE', async () => {
        const issue = mockIssue(OzonDetectedIssueStatus.NEW);
        issueFindOneMock.mockResolvedValue(issue);

        await service.updateIssueStatus(
            userId,
            String(issueId),
            OzonDetectedIssueStatus.FIXED,
        );

        expect(issue.status).toBe(OzonDetectedIssueStatus.FIXED);
        expect(recommendationUpdateOneMock).toHaveBeenCalledWith(
            {
                userId: new Types.ObjectId(userId),
                issueId,
            },
            { status: OzonAuditRecommendationStatus.DONE },
        );
    });

    it('IGNORED → recommendation IGNORED', async () => {
        const issue = mockIssue(OzonDetectedIssueStatus.VIEWED);
        issueFindOneMock.mockResolvedValue(issue);

        await service.updateIssueStatus(
            userId,
            String(issueId),
            OzonDetectedIssueStatus.IGNORED,
        );

        expect(recommendationUpdateOneMock).toHaveBeenCalledWith(
            {
                userId: new Types.ObjectId(userId),
                issueId,
            },
            { status: OzonAuditRecommendationStatus.IGNORED },
        );
    });

    it('VIEWED → recommendation VIEWED только если была NEW', async () => {
        const issue = mockIssue(OzonDetectedIssueStatus.NEW);
        issueFindOneMock.mockResolvedValue(issue);

        await service.updateIssueStatus(
            userId,
            String(issueId),
            OzonDetectedIssueStatus.VIEWED,
        );

        expect(recommendationUpdateOneMock).toHaveBeenCalledWith(
            {
                userId: new Types.ObjectId(userId),
                issueId,
                status: OzonAuditRecommendationStatus.NEW,
            },
            { status: OzonAuditRecommendationStatus.VIEWED },
        );
    });

    it('бросает NotFoundException если issue не найдена', async () => {
        issueFindOneMock.mockResolvedValue(null);

        await expect(
            service.updateIssueStatus(
                userId,
                String(issueId),
                OzonDetectedIssueStatus.VIEWED,
            ),
        ).rejects.toThrow(NotFoundException);
    });
});
