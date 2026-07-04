import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminUsersEntity, AdminUsersSchema } from './entities/admin-users.entity';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.constant';
import { AdminUsersService } from './services/admin-users.service';
import { ConfigModule } from '@nestjs/config';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
    controllers: [],
    providers: [AdminUsersService],
    exports: [AdminUsersService],
    imports: [
        MongooseModule.forFeature(
            [
                {
                    name: AdminUsersEntity.name,
                    schema: AdminUsersSchema,
                },
            ],
            DATABASE_CONNECTION_NAME
        ),
        ConfigModule,
        AuditLogModule,
    ],
})
export class AdminUsersModule { } 