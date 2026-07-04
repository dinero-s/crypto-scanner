import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';

/** Healthchecks: liveness / readiness (TZ п.7, п.8) */
@Module({
    imports: [ConfigModule],
    controllers: [HealthController],
})
export class HealthModule {}
