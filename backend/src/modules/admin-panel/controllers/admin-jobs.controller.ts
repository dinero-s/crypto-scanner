import { Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from 'src/modules/admin-users/decorators/roles.decorator';
import { ADMIN_ROLES_ALL } from 'src/modules/admin-users/enums/roles.enum';
import {
    AdminWrite,
    AdminWriteAction,
} from '../decorators/admin-write.decorator';
import { FilterAdminJobsDto } from '../dto/admin-job.dto';
import { AdminJobsService } from '../services/admin-jobs.service';
import { getAdminAuditContext } from '../utils/admin-request.util';

@ApiTags('Admin — Jobs')
@Roles(...ADMIN_ROLES_ALL)
@ApiBearerAuth('accessToken')
@Controller('jobs')
export class AdminJobsController {
    constructor(private readonly jobsService: AdminJobsService) {}

    @Get()
    @ApiOperation({ summary: 'Список sync jobs' })
    findAll(@Query() filter: FilterAdminJobsDto) {
        return this.jobsService.findAll(filter);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Детали job' })
    findOne(@Param('id') id: string) {
        return this.jobsService.findOne(id);
    }

    @Post(':id/retry')
    @AdminWrite(AdminWriteAction.MANAGE_JOB)
    @ApiOperation({ summary: 'Retry failed job' })
    retry(@Param('id') id: string, @Req() req: Request) {
        return this.jobsService.retry(id, getAdminAuditContext(req));
    }

    @Post(':id/cancel')
    @AdminWrite(AdminWriteAction.MANAGE_JOB)
    @ApiOperation({ summary: 'Cancel waiting/delayed job' })
    cancel(@Param('id') id: string, @Req() req: Request) {
        return this.jobsService.cancel(id, getAdminAuditContext(req));
    }
}
