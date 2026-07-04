import { Module } from '@nestjs/common';
import { AdminUsersModule } from 'src/modules/admin-users/admin-users.module';
import { AdminUsersController } from 'src/modules/admin-users/controllers/admin-users.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { UsersAdminController } from 'src/modules/users/controllers/users.admin.controller';
import { AuditLogAdminController } from 'src/modules/audit-log/controllers/audit-log.admin.controller';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { MarketDataAdminController } from 'src/modules/market-data/controllers/market-data.admin.controller';
import { MarketDataModule } from 'src/modules/market-data/market-data.module';

@Module({
    controllers: [
        AdminUsersController,
        UsersAdminController,
        AuditLogAdminController,
        MarketDataAdminController,
    ],
    providers: [],
    exports: [],
    imports: [AdminUsersModule, AuditLogModule, UsersModule, MarketDataModule],
})
export class RoutesAdminModule {}
