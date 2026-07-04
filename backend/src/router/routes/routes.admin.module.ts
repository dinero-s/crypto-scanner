import { Module } from '@nestjs/common';
import { AdminUsersModule } from 'src/modules/admin-users/admin-users.module';
import { AdminUsersController } from 'src/modules/admin-users/controllers/admin-users.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { UsersAdminController } from 'src/modules/users/controllers/users.admin.controller';
import { AuditLogAdminController } from 'src/modules/audit-log/controllers/audit-log.admin.controller';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';

@Module({
    controllers: [
        AdminUsersController,
        UsersAdminController,
        AuditLogAdminController,
    ],
    providers: [],
    exports: [],
    imports: [AdminUsersModule, AuditLogModule, UsersModule],
})
export class RoutesAdminModule {}
