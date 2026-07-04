import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { TELEGRAM_AUTH_KEY } from '../constants/telegram-auth.constant';
import { TelegramInitDataService } from '../services/telegram-init-data.service';

/** Guard: валидация Telegram initData из заголовка X-Telegram-Init-Data */
@Injectable()
export class TelegramInitDataGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly initDataService: TelegramInitDataService,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const requiresTelegramAuth = this.reflector.getAllAndOverride<boolean>(
            TELEGRAM_AUTH_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (!requiresTelegramAuth) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const initData = request.headers['x-telegram-init-data'];
        if (typeof initData !== 'string' || initData.trim() === '') {
            throw new UnauthorizedException('Требуется заголовок X-Telegram-Init-Data');
        }

        const validated = this.initDataService.validateInitData(initData);
        (request as Request & { telegramUser?: typeof validated.user }).telegramUser =
            validated.user;

        return true;
    }
}
