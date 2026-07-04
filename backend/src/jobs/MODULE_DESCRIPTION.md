# Jobs

## Назначение
Фоновые задачи: cron (`@nestjs/schedule`) и очереди BullMQ.

## Структура
- services: `task.service.ts` (cron), `example-queue.service.ts` (producer)
- processors: `example-queue.processor.ts`
- modules: `jobs.module.ts`, `jobs.queue.module.ts`, `jobs.router.module.ts`
- controllers: отсутствуют

## Основные потоки
- Cron `handleExampleCron` каждые 5 минут при `JOB_ENABLE=true`.
- Очередь `app-example`: producer ставит job, `ExampleQueueProcessor` обрабатывает.

## Зависимости
- `@nestjs/schedule`, `@nestjs/bullmq`, Redis.
- Константы очередей: `src/common/queue/constants/queue.constant.ts`.

## Что читать при изменениях
- `jobs.module.ts`, `jobs.queue.module.ts`, нужный service/processor, `queue.constant.ts`.
