import { Module } from '@nestjs/common';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { UsersUserController } from 'src/modules/users/controllers/users.user.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { OzonController } from 'src/modules/ozon/controllers/ozon.controller';
import { OzonAuditController } from 'src/modules/ozon/controllers/ozon-audit.controller';
import { OzonCompetitorController } from 'src/modules/ozon/controllers/ozon-competitor.controller';
import { OzonModule } from 'src/modules/ozon/ozon.module';

/** Закрытая часть для авторизованных пользователей */
@Module({
    controllers: [
        UsersUserController,
        OzonController,
        OzonAuditController,
        OzonCompetitorController,
    ],
    providers: [],
    exports: [],
    imports: [UsersModule, PaginationModule, OzonModule],
})
export class RoutesUserModule {}
