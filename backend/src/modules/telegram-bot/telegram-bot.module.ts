import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AlertsModule } from '../alerts/alerts.module';
import { ArbitrageModule } from '../arbitrage/arbitrage.module';
import { TelegramUsersModule } from '../telegram-users/telegram-users.module';
import { TelegramBotController } from './controllers/telegram-bot.controller';
import { TelegramBotPollingService } from './services/telegram-bot-polling.service';
import { TelegramBotService } from './services/telegram-bot.service';

/** Telegram Bot: команды и webhook */
@Module({
    imports: [
        ConfigModule,
        HttpModule.register({ timeout: 30_000, maxRedirects: 3 }),
        TelegramUsersModule,
        AlertsModule,
        ArbitrageModule,
    ],
    controllers: [],
    providers: [TelegramBotService, TelegramBotPollingService],
    exports: [TelegramBotService],
})
export class TelegramBotModule {}
