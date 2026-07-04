import { Module } from '@nestjs/common';
import { ScheduledTasksService } from '../services/task.service';
import { OzonScheduledTasksService } from '../services/ozon-scheduled-tasks.service';
import { OzonModule } from 'src/modules/ozon/ozon.module';

@Module({
    providers: [ScheduledTasksService, OzonScheduledTasksService],
    exports: [],
    imports: [OzonModule],
    controllers: [],
})
export class JobsRouterModule {}
