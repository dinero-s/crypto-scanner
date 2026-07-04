import { Body, Controller, Delete, Get, Param, Put, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { Response } from 'express';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { BlockUserDto } from '../dtos/block-user.dto';
import { Roles } from 'src/modules/admin-users/decorators/roles.decorator';
import {
    ADMIN_ROLES_ALL,
    ADMIN_ROLES_FINANCE,
} from 'src/modules/admin-users/enums/roles.enum';

@ApiTags('Администрация пользователей')
@Roles(...ADMIN_ROLES_ALL)
@Controller('users')
@ApiBearerAuth('accessToken')
export class UsersAdminController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @ApiOperation({ summary: 'Получить список всех пользователей' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество записей на странице' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'fullName', 'email', 'phone'], description: 'Поле для сортировки' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Порядок сортировки' })
    @ApiQuery({ name: 'isBlocked', required: false, type: Boolean, description: 'Фильтр по статусу блокировки' })
    @ApiQuery({ name: 'isDisabled', required: false, type: Boolean, description: 'Фильтр по статусу отключения' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Поиск по ФИО, телефону, email или городу' })
    @ApiQuery({ name: 'registrationDateFrom', required: false, type: String, description: 'Дата регистрации от (ISO)' })
    @ApiQuery({ name: 'registrationDateTo', required: false, type: String, description: 'Дата регистрации до (ISO)' })
    @ApiResponse({ status: 200, description: 'Список пользователей получен' })
    async findAll(
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Query('sortBy') sortBy = 'createdAt',
        @Query('sortOrder') sortOrder = 'desc',
        @Query('isBlocked') isBlocked?: boolean,
        @Query('isDisabled') isDisabled?: boolean,
        @Query('search') search?: string,
        @Query('registrationDateFrom') registrationDateFrom?: string,
        @Query('registrationDateTo') registrationDateTo?: string,
    ) {
        return this.usersService.findAll({
            page,
            limit,
            sortBy,
            sortOrder,
            isBlocked,
            isDisabled,
            search,
            registrationDateFrom,
            registrationDateTo,
        });
    }

    @Get('export/csv')
    @Roles(...ADMIN_ROLES_FINANCE)
    @ApiOperation({ summary: 'Экспорт пользователей в CSV' })
    @ApiResponse({ status: 200, description: 'CSV файл с пользователями' })
    @ApiQuery({ name: 'isBlocked', required: false, type: Boolean, description: 'Фильтр по статусу блокировки' })
    @ApiQuery({ name: 'isDisabled', required: false, type: Boolean, description: 'Фильтр по статусу отключения' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Поиск по ФИО, телефону, email или городу' })
    @ApiQuery({ name: 'registrationDateFrom', required: false, type: String })
    @ApiQuery({ name: 'registrationDateTo', required: false, type: String })
    async exportToCsv(
        @Res() res: Response,
        @Query('isBlocked') isBlocked?: boolean,
        @Query('isDisabled') isDisabled?: boolean,
        @Query('search') search?: string,
        @Query('registrationDateFrom') registrationDateFrom?: string,
        @Query('registrationDateTo') registrationDateTo?: string,
    ) {
        const csv = await this.usersService.exportToCsv({
            page: 1,
            limit: 1000000,
            sortBy: 'registrationDate',
            sortOrder: 'desc',
            isBlocked,
            isDisabled,
            search,
            registrationDateFrom,
            registrationDateTo,
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
        res.send(csv);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Получить пользователя по ID' })
    @ApiResponse({ status: 200, description: 'Пользователь найден' })
    @ApiResponse({ status: 404, description: 'Пользователь не найден' })
    async findOne(@Param('id') id: string) {
        return await this.usersService.findOne(id);
    }

    @Put(':id')
    @Roles(...ADMIN_ROLES_FINANCE)
    @ApiOperation({ summary: 'Обновить пользователя' })
    @ApiResponse({ status: 200, description: 'Пользователь обновлен' })
    @ApiResponse({ status: 404, description: 'Пользователь не найден' })
    async update(@Param('id') id: string, @Body() updateData: UpdateUserDto) {
        return await this.usersService.updateAdmin(id, updateData);
    }

    @Put(':id/block')
    @ApiOperation({ summary: 'Заблокировать пользователя (причина обязательна)' })
    @ApiResponse({ status: 200, description: 'Пользователь заблокирован' })
    @ApiResponse({ status: 400, description: 'Причина блокировки обязательна' })
    @ApiResponse({ status: 404, description: 'Пользователь не найден' })
    async blockUser(@Param('id') id: string, @Body() dto: BlockUserDto) {
        return await this.usersService.blockUser(id, dto.reason);
    }

    @Put(':id/unblock')
    @ApiOperation({ summary: 'Разблокировать пользователя' })
    @ApiResponse({ status: 200, description: 'Пользователь разблокирован' })
    @ApiResponse({ status: 404, description: 'Пользователь не найден' })
    async unblockUser(@Param('id') id: string) {
        return await this.usersService.unblockUser(id);
    }

    @Put(':id/disable')
    @Roles(...ADMIN_ROLES_FINANCE)
    @ApiOperation({ summary: 'Отключить пользователя' })
    @ApiResponse({ status: 200, description: 'Пользователь отключен' })
    @ApiResponse({ status: 404, description: 'Пользователь не найден' })
    async disableUser(@Param('id') id: string) {
        return await this.usersService.disableUser(id);
    }

    @Put(':id/enable')
    @Roles(...ADMIN_ROLES_FINANCE)
    @ApiOperation({ summary: 'Включить пользователя' })
    @ApiResponse({ status: 200, description: 'Пользователь включен' })
    @ApiResponse({ status: 404, description: 'Пользователь не найден' })
    async enableUser(@Param('id') id: string) {
        return await this.usersService.enableUser(id);
    }

    @Delete(':id')
    @Roles(...ADMIN_ROLES_FINANCE)
    @ApiOperation({ summary: 'Удалить пользователя' })
    @ApiResponse({ status: 200, description: 'Пользователь успешно удален' })
    @ApiResponse({ status: 404, description: 'Пользователь не найден' })
    async remove(@Param('id') id: string) {
        return await this.usersService.remove(id);
    }
}
