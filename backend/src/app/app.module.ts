import { Module } from '@nestjs/common';
import { SentryModule } from '@sentry/nestjs/setup';
import { RouterModule } from 'src/router/router.module';
import { CommonModule } from 'src/common/common.module';
import { QueueModule } from 'src/common/queue/queue.module';
import { RedisLockModule } from 'src/common/redis/redis-lock.module';
import { AppMiddlewareModule } from 'src/app.middleware.module';
import { JobsModule } from 'src/jobs/jobs.module';
import { JobsQueueModule } from 'src/jobs/jobs.queue.module';

@Module({
    controllers: [],
    providers: [],
    imports: [
        SentryModule.forRoot(),
        QueueModule.forRoot(),
        RedisLockModule,
        AppMiddlewareModule,
        CommonModule,
        JobsModule.forRoot(),
        JobsQueueModule,
        RouterModule.forRoot(),
    ],
})
export class AppModule { }
