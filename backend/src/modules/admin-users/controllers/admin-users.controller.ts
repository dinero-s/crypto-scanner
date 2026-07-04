import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdminUsersService } from '../services/admin-users.service';
import { CreateAdminDto } from '../dtos/create-admin.dto';
import { LoginAdminDto } from '../dtos/login-admin.dto';
import { RefreshAdminTokenDto } from '../dtos/refresh-admin-token.dto';
import { Roles } from '../decorators/roles.decorator';
import { AdminRole, ADMIN_ROLES_FINANCE } from '../enums/roles.enum';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { UpdateAdminDto } from '../dtos/update-admin.dto';
import { Public } from 'src/app/constants/app.public.contstant';

@ApiTags('Администраторы')
@Controller('admin-users')
export class AdminUsersController {
    constructor(private readonly adminUsersService: AdminUsersService) { }

    @Post()
    @Roles(AdminRole.MAIN_ADMIN)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Создание администратора (только для MAIN_ADMIN)' })
    @ApiResponse({ status: 201, description: 'Администратор успешно создан' })
    @ApiResponse({ status: 400, description: 'Неверные данные' })
    @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
    @ApiResponse({ status: 409, description: 'Администратор с таким email уже существует' })
    create(@Body() createAdminDto: CreateAdminDto) {
        return this.adminUsersService.create(createAdminDto);
    }

    @Post('login')
    @Public()
    @Throttle({ login: { limit: 5, ttl: 60_000 } })
    @ApiOperation({ summary: 'Вход в систему (back-office)' })
    @ApiBody({
        type: LoginAdminDto,
        examples: {
            admin: {
                summary: 'Админ',
                value: { email: 'admin@example.com', password: 'M4n8X2vP' },
            },
            mainAdmin: {
                summary: 'Главный админ',
                value: { email: 'main.admin@example.com', password: 'A7k3Z9qL' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Успешный вход' })
    @ApiResponse({ status: 401, description: 'Неверные учетные данные' })
    @HttpCode(HttpStatus.OK)
    login(@Body() loginAdminDto: LoginAdminDto) {
        return this.adminUsersService.login(loginAdminDto);
    }

    @Post('refresh-token')
    @Public()
    @Throttle({ login: { limit: 5, ttl: 60_000 } })
    @ApiOperation({ summary: 'Обновление access/refresh токенов администратора' })
    @ApiResponse({ status: 200, description: 'Новые токены выданы' })
    @ApiResponse({ status: 401, description: 'Недействительный refresh token' })
    @ApiResponse({
        status: 429,
        description: 'Слишком много запросов',
    })
    @HttpCode(HttpStatus.OK)
    refreshToken(@Body() refreshAdminTokenDto: RefreshAdminTokenDto) {
        return this.adminUsersService.refreshTokens(
            refreshAdminTokenDto.refreshToken,
        );
    }

    @Get()
    @Roles(...ADMIN_ROLES_FINANCE)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Получение списка администраторов' })
    @ApiResponse({ status: 200, description: 'Список администраторов получен' })
    @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
    findAll(
        @Query('page') page?: string | number,
        @Query('limit') limit?: string | number,
    ) {
        const pageNum = Math.max(1, parseInt(String(page ?? 1), 10) || 1);
        const limitNum = Math.max(1, parseInt(String(limit ?? 20), 10) || 20);
        return this.adminUsersService.findAll({ page: pageNum, limit: limitNum });
    }

    @Get(':id')
    @Roles(...ADMIN_ROLES_FINANCE)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Получение администратора по ID' })
    @ApiResponse({ status: 200, description: 'Администратор найден' })
    @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
    @ApiResponse({ status: 404, description: 'Администратор не найден' })
    findOne(@Param('id') id: string) {
        return this.adminUsersService.findOne(id);
    }

    @Put(':id')
    @Roles(AdminRole.ADMIN, AdminRole.MAIN_ADMIN)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Обновление администратора (для ADMIN и MAIN_ADMIN)' })
    @ApiParam({ name: 'id', description: 'ID администратора' })
    @ApiBody({
        type: UpdateAdminDto,
        description: 'Поля для обновления (все опциональны)',
        examples: {
            nameAndEmail: {
                summary: 'Имя и email',
                value: { name: 'Иван Иванов', email: 'admin@example.com' },
            },
            status: {
                summary: 'Смена статуса',
                value: { status: 'BLOCKED' },
            },
            full: {
                summary: 'Все поля',
                value: {
                    name: 'Иван Иванов',
                    email: 'admin@example.com',
                    password: 'newPassword123',
                    status: 'ACTIVE',
                },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Администратор обновлен' })
    @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
    @ApiResponse({ status: 404, description: 'Администратор не найден' })
    update(@Param('id') id: string, @Body() updateData: UpdateAdminDto) {
        return this.adminUsersService.update(id, updateData);
    }

    @Patch(':id/role')
    @UseInterceptors(AnyFilesInterceptor())
    @Roles(AdminRole.MAIN_ADMIN)
    @ApiBearerAuth('accessToken')
    @ApiOperation({
        summary: 'Обновление роли администратора',
        description: 'Только MAIN_ADMIN',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        description: 'Новая роль администратора',
        schema: {
            type: 'object',
            required: ['role'],
            properties: {
                role: {
                    type: 'string',
                    enum: Object.values(AdminRole),
                    description: 'Роль администратора',
                    example: AdminRole.ADMIN,
                },
            },
        },
    })
    @ApiParam({ name: 'id', description: 'ID администратора' })
    @ApiResponse({ status: 200, description: 'Роль успешно обновлена' })
    @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
    @ApiResponse({ status: 404, description: 'Администратор не найден' })
    updateRole(
        @Param('id') id: string,
        @Body() updateRoleDto: UpdateRoleDto,
    ) {
        return this.adminUsersService.updateRole(id, updateRoleDto);
    }

    @Delete(':id')
    @Roles(AdminRole.MAIN_ADMIN)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Удаление администратора (только для MAIN_ADMIN)' })
    @ApiResponse({ status: 200, description: 'Администратор удален' })
    @ApiResponse({ status: 403, description: 'Недостаточно прав доступа' })
    @ApiResponse({ status: 404, description: 'Администратор не найден' })
    remove(@Param('id') id: string) {
        return this.adminUsersService.remove(id);
    }

    @Post(':id/change-password')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('accessToken')
    @ApiOperation({
        summary: 'Сменить пароль администратора',
        description: 'Изменяет пароль администратора с проверкой старого пароля'
    })
    @ApiResponse({
        status: 200,
        description: 'Пароль успешно изменен'
    })
    @ApiResponse({
        status: 401,
        description: 'Неверный старый пароль или не авторизован'
    })
    async changePassword(
        @Param('id') adminId: string,
        @Body() dto: ChangePasswordDto
    ): Promise<{ message: string }> {
        await this.adminUsersService.changePassword(adminId, dto);
        return { message: 'Пароль успешно изменен' };
    }
} 