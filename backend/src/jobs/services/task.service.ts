import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

/** Пример фоновых задач. Добавляйте cron-методы по мере необходимости. */
@Injectable()
export class ScheduledTasksService {
    private readonly logger = new Logger(ScheduledTasksService.name);

    /** Пример: проверка каждые 5 минут (заглушка для шаблона) */
    @Cron('*/5 * * * *')
    handleExampleCron(): void {
        this.logger.debug('Пример cron-задачи выполнен');
    }
}
