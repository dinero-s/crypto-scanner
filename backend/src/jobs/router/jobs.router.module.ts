import { Module } from '@nestjs/common';
import { ScheduledTasksService } from '../services/task.service';
import { ScannerScheduledTasksService } from '../services/scanner-scheduled-tasks.service';
import { JobsQueueModule } from '../jobs.queue.module';

@Module({
    providers: [ScheduledTasksService, ScannerScheduledTasksService],
    exports: [ScannerScheduledTasksService],
    imports: [JobsQueueModule],
    controllers: [],
})
export class JobsRouterModule {}
