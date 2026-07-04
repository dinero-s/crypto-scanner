import {
    Body,
    Controller,
    Headers,
    HttpCode,
    Logger,
    Post,
    UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Public } from 'src/app/constants/app.public.contstant';
import { TelegramUpdatePayload } from '../interfaces/telegram-update.interface';
import { TelegramBotService } from '../services/telegram-bot.service';

/** Webhook Telegram Bot API */
@ApiTags('Telegram Bot')
@Controller('telegram')
@Public()
export class TelegramBotController {
    private readonly logger = new Logger(TelegramBotController.name);

    constructor(
        private readonly telegramBotService: TelegramBotService,
        private readonly configService: ConfigService,
    ) {}

    @Post('webhook')
    @HttpCode(200)
    @ApiOperation({ summary: 'Webhook Telegram Bot API' })
    async webhook(
        @Body() update: TelegramUpdatePayload,
        @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
    ): Promise<{ ok: boolean }> {
        const expectedSecret = this.configService.get<string>('telegram.webhookSecret');
        if (expectedSecret && secretToken !== expectedSecret) {
            throw new UnauthorizedException('Invalid webhook secret');
        }

        try {
            await this.telegramBotService.handleUpdate(update);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`webhook error=${message}`);
        }

        return { ok: true };
    }
}
