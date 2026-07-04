import { Module } from '@nestjs/common';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { UsersModule } from 'src/modules/users/users.module';
import { UsersPublicController } from 'src/modules/users/controllers/users.public.controller';
import { HealthModule } from 'src/modules/health/health.module';

/** Публичная часть: регистрация, вход, health */
@Module({
    controllers: [UsersPublicController],
    imports: [UsersModule, PaginationModule, HealthModule],
})
export class RoutesPublicModule {}
