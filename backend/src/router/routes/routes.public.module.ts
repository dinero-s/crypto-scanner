import { Module } from '@nestjs/common';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { UsersModule } from 'src/modules/users/users.module';
import { UsersPublicController } from 'src/modules/users/controllers/users.public.controller';
import { HealthModule } from 'src/modules/health/health.module';
import { MiniAppApiModule } from 'src/modules/mini-app-api/mini-app-api.module';
import { MiniAppController } from 'src/modules/mini-app-api/controllers/mini-app.controller';
import { TelegramUsersModule } from 'src/modules/telegram-users/telegram-users.module';
import { TelegramUsersController } from 'src/modules/telegram-users/controllers/telegram-users.controller';
import { ArbitrageModule } from 'src/modules/arbitrage/arbitrage.module';
import { ArbitrageController } from 'src/modules/arbitrage/controllers/arbitrage.controller';
import { TelegramBotModule } from 'src/modules/telegram-bot/telegram-bot.module';
import { TelegramBotController } from 'src/modules/telegram-bot/controllers/telegram-bot.controller';

/** Публичная часть: регистрация, вход, health, mini-app, arbitrage */
@Module({
    controllers: [
        UsersPublicController,
        MiniAppController,
        TelegramUsersController,
        ArbitrageController,
        TelegramBotController,
    ],
    imports: [
        UsersModule,
        PaginationModule,
        HealthModule,
        MiniAppApiModule,
        TelegramUsersModule,
        ArbitrageModule,
        TelegramBotModule,
    ],
})
export class RoutesPublicModule {}
