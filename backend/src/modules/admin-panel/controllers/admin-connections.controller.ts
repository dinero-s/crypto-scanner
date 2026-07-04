import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from 'src/modules/admin-users/decorators/roles.decorator';
import { ADMIN_ROLES_ALL } from 'src/modules/admin-users/enums/roles.enum';
import {
    AdminWrite,
    AdminWriteAction,
} from '../decorators/admin-write.decorator';
import { FilterAdminConnectionsDto } from '../dto/admin-connection.dto';
import { AdminConnectionsService } from '../services/admin-connections.service';
import { getAdminAuditContext } from '../utils/admin-request.util';

@ApiTags('Admin — Connections')
@Roles(...ADMIN_ROLES_ALL)
@ApiBearerAuth('accessToken')
@Controller('connections')
export class AdminConnectionsController {
    constructor(private readonly connectionsService: AdminConnectionsService) {}

    @Get()
    @ApiOperation({ summary: 'Список marketplace-подключений' })
    findAll(@Query() filter: FilterAdminConnectionsDto) {
        return this.connectionsService.findAll(filter);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Детали подключения' })
    findOne(@Param('id') id: string, @Req() req: Request) {
        return this.connectionsService.findOne(id, getAdminAuditContext(req));
    }

    @Post(':id/health')
    @AdminWrite(AdminWriteAction.MANAGE_CONNECTION)
    @ApiOperation({ summary: 'Health check подключения' })
    runHealth(@Param('id') id: string, @Req() req: Request) {
        return this.connectionsService.runHealth(id, getAdminAuditContext(req));
    }

    @Post(':id/sync')
    @AdminWrite(AdminWriteAction.MANAGE_CONNECTION)
    @ApiOperation({ summary: 'Запуск sync job' })
    runSync(@Param('id') id: string, @Req() req: Request) {
        return this.connectionsService.runSync(id, getAdminAuditContext(req));
    }

    @Patch(':id/pause')
    @AdminWrite(AdminWriteAction.MANAGE_CONNECTION)
    @ApiOperation({ summary: 'Приостановить подключение' })
    pause(@Param('id') id: string, @Req() req: Request) {
        return this.connectionsService.pause(id, getAdminAuditContext(req));
    }

    @Patch(':id/resume')
    @AdminWrite(AdminWriteAction.MANAGE_CONNECTION)
    @ApiOperation({ summary: 'Возобновить подключение' })
    resume(@Param('id') id: string, @Req() req: Request) {
        return this.connectionsService.resume(id, getAdminAuditContext(req));
    }

    @Delete(':id')
    @AdminWrite(AdminWriteAction.DELETE_CONNECTION)
    @ApiOperation({ summary: 'Soft delete подключения' })
    softDelete(@Param('id') id: string, @Req() req: Request) {
        return this.connectionsService.softDelete(id, getAdminAuditContext(req));
    }
}
