import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    Post,
    Put,
    UploadedFile,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { UsersProfileService } from '../services/users-profile.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UpdateUserProfileDto } from '../dtos/update-user-profile.dto';
import { AppRoles } from 'src/common/decorators/app-roles.decorator';
import { AppUserRole } from 'src/common/constants/app-role.constant';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { UpdateUserNotificationSettingsDto } from '../dtos/update-user-notification-settings.dto';
import { ValidationErrorResponseDto } from 'src/common/response/dtos/validation-error-response.dto';
import { FileUploadSingle } from 'src/common/file/decorators/file.decorator';

/** Пользователь: профиль и настройки */
@ApiTags('Пользователь: профиль')
@Controller('users')
export class UsersUserController {
    constructor(
        private readonly usersService: UsersService,
        private readonly usersProfileService: UsersProfileService,
    ) {}

    @Get('profile')
    @AppRoles(AppUserRole.USER)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Профиль: базовые данные пользователя' })
    @ApiResponse({ status: 200, description: 'Профиль пользователя' })
    @ApiResponse({ status: 401, description: 'Не авторизован' })
    @ApiResponse({ status: 404, description: 'Пользователь не найден' })
    async getProfile(@CurrentUser('id') userId: string) {
        return this.usersProfileService.getProfile(userId);
    }

    @Get('notification-settings')
    @AppRoles(AppUserRole.USER)
    @ApiBearerAuth('accessToken')
    @ApiOperation({
        summary: 'Настройки уведомлений: push, e-mail рассылка, звук',
    })
    @ApiResponse({ status: 200, description: 'Текущие настройки' })
    @ApiResponse({ status: 401, description: 'Не авторизован' })
    async getNotificationSettings(@CurrentUser('id') userId: string) {
        return this.usersProfileService.getNotificationSettings(userId);
    }

    @Patch('notification-settings')
    @AppRoles(AppUserRole.USER)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Обновить настройки уведомлений (частично)' })
    @ApiBody({ type: UpdateUserNotificationSettingsDto })
    @ApiResponse({ status: 200, description: 'Настройки сохранены' })
    @ApiResponse({ status: 401, description: 'Не авторизован' })
    async patchNotificationSettings(
        @CurrentUser('id') userId: string,
        @Body() dto: UpdateUserNotificationSettingsDto,
    ) {
        return this.usersProfileService.updateNotificationSettings(userId, dto);
    }

    @Put('profile')
    @AppRoles(AppUserRole.USER)
    @ApiBearerAuth('accessToken')
    @ApiOperation({
        summary: 'Обновить профиль (fullName, city, birthYear, avatar)',
    })
    @ApiBody({ type: UpdateUserProfileDto })
    @ApiResponse({ status: 200, description: 'Профиль обновлён' })
    @ApiResponse({ status: 401, description: 'Не авторизован' })
    @ApiResponse({ status: 400, description: 'Неверные данные' })
    @ApiResponse({ status: 404, description: 'Пользователь не найден' })
    @FileUploadSingle({
        field: 'avatar',
        fileSize: 1024 * 1024 * 5,
    })
    async updateProfile(
        @CurrentUser('id') userId: string,
        @UploadedFile() file: Express.Multer.File,
        @Body() dto: UpdateUserProfileDto,
    ) {
        return this.usersService.updateProfile(userId, dto, file);
    }

    @Delete('delete')
    @AppRoles(AppUserRole.USER)
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Удалить аккаунт' })
    @ApiResponse({ status: 200, description: 'Аккаунт удалён' })
    @ApiResponse({ status: 401, description: 'Не авторизован' })
    async deleteUser(@CurrentUser('id') userId: string) {
        return this.usersService.deleteUser(userId);
    }

    @Post('change-password')
    @AppRoles(AppUserRole.USER)
    @ApiBearerAuth('accessToken')
    @ApiOperation({
        summary: 'Смена пароля: JWT + oldPassword + newPassword',
    })
    @ApiBody({ type: ChangePasswordDto })
    @ApiResponse({ status: 200, description: 'Пароль изменён' })
    @ApiResponse({ status: 401, description: 'Не авторизован' })
    @ApiResponse({ status: 400, description: 'Неверные данные', type: ValidationErrorResponseDto })
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @CurrentUser('id') userId: string,
        @CurrentUser() user: { resetSession?: boolean },
        @Body() dto: ChangePasswordDto,
    ) {
        return this.usersService.changePassword(userId, dto, {
            resetSession: user?.resetSession === true,
        });
    }
}
