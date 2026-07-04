import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Query,
    Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from 'src/modules/admin-users/decorators/roles.decorator';
import { ADMIN_ROLES_ALL } from 'src/modules/admin-users/enums/roles.enum';
import { UsersService } from 'src/modules/users/services/users.service';
import { AuditAction } from 'src/modules/audit-log/enums/audit-action.enum';
import {
    AdminWrite,
    AdminWriteAction,
} from '../decorators/admin-write.decorator';
import {
    ChangeAdminUserRoleDto,
    FilterAdminUsersDto,
} from '../dto/admin-user.dto';
import { AdminUsersPanelService } from '../services/admin-users-panel.service';
import { AdminAuditWriterService } from '../services/admin-audit-writer.service';
import { getAdminAuditContext } from '../utils/admin-request.util';
import { BlockUserDto } from 'src/modules/users/dtos/block-user.dto';

@ApiTags('Admin — Users')
@Roles(...ADMIN_ROLES_ALL)
@ApiBearerAuth('accessToken')
@Controller('users')
export class AdminUsersPanelController {
    constructor(
        private readonly usersPanelService: AdminUsersPanelService,
        private readonly usersService: UsersService,
        private readonly auditWriter: AdminAuditWriterService,
    ) {}

    @Get()
    @ApiOperation({ summary: 'Список пользователей платформы' })
    findAll(@Query() filter: FilterAdminUsersDto) {
        return this.usersPanelService.findAll(filter);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Детали пользователя' })
    async findOne(@Param('id') id: string, @Req() req: Request) {
        const detail = await this.usersPanelService.findOne(id);
        await this.auditWriter.log(
            getAdminAuditContext(req),
            AuditAction.ADMIN_VIEWED_USER,
            'users',
            id,
            `Admin просмотрел пользователя ${detail.email}`,
        );
        return detail;
    }

    @Patch(':id/block')
    @AdminWrite(AdminWriteAction.BLOCK_USER)
    @ApiOperation({ summary: 'Заблокировать пользователя' })
    async blockUser(
        @Param('id') id: string,
        @Body() dto: BlockUserDto,
        @Req() req: Request,
    ) {
        const result = await this.usersService.blockUser(id, dto.reason);
        await this.auditWriter.log(
            getAdminAuditContext(req),
            AuditAction.ADMIN_BLOCKED_USER,
            'users',
            id,
            `Admin заблокировал пользователя: ${dto.reason}`,
        );
        return result;
    }

    @Patch(':id/unblock')
    @AdminWrite(AdminWriteAction.UNBLOCK_USER)
    @ApiOperation({ summary: 'Разблокировать пользователя' })
    async unblockUser(@Param('id') id: string, @Req() req: Request) {
        const result = await this.usersService.unblockUser(id);
        await this.auditWriter.log(
            getAdminAuditContext(req),
            AuditAction.ADMIN_UNBLOCKED_USER,
            'users',
            id,
            'Admin разблокировал пользователя',
        );
        return result;
    }

    @Patch(':id/role')
    @AdminWrite(AdminWriteAction.CHANGE_USER_ROLE)
    @ApiOperation({ summary: 'Изменить роль пользователя' })
    async changeRole(
        @Param('id') id: string,
        @Body() dto: ChangeAdminUserRoleDto,
        @Req() req: Request,
    ) {
        const result = await this.usersService.updateAdmin(id, { role: dto.role });
        await this.auditWriter.log(
            getAdminAuditContext(req),
            AuditAction.ADMIN_CHANGED_USER_ROLE,
            'users',
            id,
            `Admin изменил роль на ${dto.role}`,
        );
        return result;
    }
}
