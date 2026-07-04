import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.constant';
import { AuditLogEntity, AuditLogSchema } from './entities/audit-log.entity';
import { AuditLogService } from './services/audit-log.service';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature(
            [
                {
                    name: AuditLogEntity.name,
                    schema: AuditLogSchema,
                },
            ],
            DATABASE_CONNECTION_NAME
        ),
        forwardRef(() => UsersModule),
    ],
    controllers: [],
    providers: [AuditLogService],
    exports: [AuditLogService],
})
export class AuditLogModule {}
