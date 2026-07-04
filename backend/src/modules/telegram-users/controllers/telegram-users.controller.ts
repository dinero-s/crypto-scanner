import { Controller, Get, Patch, Body, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/app/constants/app.public.contstant';
import { TelegramAuthDto, UpdateTelegramUserDto } from '../dto/telegram-user.dto';
import { TelegramUsersService } from '../services/telegram-users.service';

/** REST: Telegram-пользователи Mini App */
@ApiTags('Telegram Users')
@Controller('telegram-users')
export class TelegramUsersController {
    constructor(private readonly telegramUsersService: TelegramUsersService) {}

    @Post('auth')
    @Public()
    @ApiOperation({ summary: 'Авторизация через Telegram initData' })
    @ApiResponse({ status: 200, description: 'Результат авторизации' })
    async auth(@Body() dto: TelegramAuthDto) {
        return this.telegramUsersService.authenticate(dto);
    }

    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Профиль текущего пользователя' })
    async getMe() {
        return { message: 'Requires Telegram auth — этап 2' };
    }

    @Patch('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Обновить профиль' })
    async updateMe(@Body() dto: UpdateTelegramUserDto) {
        return dto;
    }

    @Get('subscription')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Статус подписки (mock/free)' })
    async getSubscription() {
        return { status: 'free' };
    }
}
