import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

/** Пример фоновых задач. Добавляйте cron-методы по мере необходимости. */
@Injectable()
export class ScheduledTasksService {
    /** Пример: проверка каждые 5 минут (заглушка для шаблона) */
    @Cron('*/5 * * * *')
    handleExampleCron(): void {
        // заглушка шаблона
    }
}
