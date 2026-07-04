import {
    Controller,
    Get,
    Param,
    Query,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
} from '@nestjs/swagger';
import { AuditLogService } from '../services/audit-log.service';
import { FilterAuditLogDto } from '../dto/filter-audit-log.dto';
import { AuditLogDetailDto } from '../dto/audit-log-detail.dto';
import { Roles } from 'src/modules/admin-users/decorators/roles.decorator';
import { ADMIN_ROLES_FINANCE } from 'src/modules/admin-users/enums/roles.enum';

/** Админ-контроллер для просмотра аудита действий (TZ п.2, п.7) */
@ApiTags('Аудит действий администраторов')
@Roles(...ADMIN_ROLES_FINANCE)
@ApiBearerAuth('accessToken')
@Controller('audit-log')
export class AuditLogAdminController {
    constructor(private readonly auditLogService: AuditLogService) {}

    @Get()
    @ApiOperation({ summary: 'Получить все записи аудита с фильтрацией (таблица: дата, кто, категория, объект, действие, статус, описание)' })
    @ApiResponse({
        status: 200,
        description: 'Список записей аудита получен успешно',
    })
    async findAll(@Query() filterDto: FilterAuditLogDto) {
        return await this.auditLogService.findAll(filterDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Получить запись аудита по ID (детали: полный объект, changedFields, причина, результат)' })
    @ApiResponse({
        status: 200,
        description: 'Запись аудита найдена',
        type: AuditLogDetailDto,
    })
    @ApiParam({ name: 'id', description: 'ID записи аудита' })
    async findOne(@Param('id') id: string) {
        return await this.auditLogService.findOne(id);
    }
}
