import { Module } from '@nestjs/common';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { UsersUserController } from 'src/modules/users/controllers/users.user.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { AlertsModule } from 'src/modules/alerts/alerts.module';
import { AlertsController } from 'src/modules/alerts/controllers/alerts.controller';
import { TelegramUsersModule } from 'src/modules/telegram-users/telegram-users.module';

/** Закрытая часть для авторизованных пользователей */
@Module({
    controllers: [UsersUserController, AlertsController],
    providers: [],
    exports: [],
    imports: [UsersModule, PaginationModule, AlertsModule, TelegramUsersModule],
})
export class RoutesUserModule {}
