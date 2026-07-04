import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersEntity, UsersSchema } from './entities/users.entity';
import { UsersService } from './services/users.service';
import { UsersRepositoryService } from './services/users-repository.service';
import { UsersAuthService } from './services/users-auth.service';
import { UsersManagementService } from './services/users-management.service';
import { UsersExportService } from './services/users-export.service';
import { UsersActivityService } from './services/users-activity.service';
import { UsersProfileService } from './services/users-profile.service';
import { OAuthVerificationService } from './services/oauth-verification.service';
import { ConfigModule } from '@nestjs/config';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.constant';
import { AdminUsersService } from '../admin-users/services/admin-users.service';
import { AdminUsersEntity, AdminUsersSchema } from '../admin-users/entities/admin-users.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { StorageModule } from 'src/common/storage/storage.module';

@Module({
    imports: [
        ConfigModule,
        StorageModule,
        forwardRef(() => AuditLogModule),
        MongooseModule.forFeature([
            {
                name: UsersEntity.name,
                schema: UsersSchema,
            },
            {
                name: AdminUsersEntity.name,
                schema: AdminUsersSchema,
            },
        ], DATABASE_CONNECTION_NAME),
    ],
    controllers: [],
    providers: [
        UsersRepositoryService,
        UsersAuthService,
        UsersManagementService,
        UsersExportService,
        UsersActivityService,
        UsersProfileService,
        OAuthVerificationService,
        UsersService,
        AdminUsersService,
    ],
    exports: [
        UsersService,
        UsersRepositoryService,
        UsersProfileService,
        UsersActivityService,
        AdminUsersService,
        MongooseModule.forFeature([
            {
                name: UsersEntity.name,
                schema: UsersSchema,
            },
        ], DATABASE_CONNECTION_NAME),
    ],
})
export class UsersModule {}
