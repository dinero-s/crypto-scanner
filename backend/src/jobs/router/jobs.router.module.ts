import { Module } from '@nestjs/common';
import { ScheduledTasksService } from '../services/task.service';
import { ScannerScheduledTasksService } from '../services/scanner-scheduled-tasks.service';
import { ScannerDynamicSchedulerService } from '../services/scanner-dynamic-scheduler.service';
import { JobsQueueModule } from '../jobs.queue.module';

@Module({
    providers: [
        ScheduledTasksService,
        ScannerScheduledTasksService,
        ScannerDynamicSchedulerService,
    ],
    exports: [ScannerScheduledTasksService, ScannerDynamicSchedulerService],
    imports: [JobsQueueModule],
    controllers: [],
})
export class JobsRouterModule {}
