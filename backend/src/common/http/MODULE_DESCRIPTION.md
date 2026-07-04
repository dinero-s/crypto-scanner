# CommonHttp

## Назначение
Глобальная настройка HTTP-клиента (`@nestjs/axios`) и единый формат логирования исходящих запросов.

## Структура
- modules: `global-http.module.ts`
- interceptors: request/response для структурированных логов
- dto/entities: нет (инфраструктурный слой)

## Основные потоки
- `GlobalHttpModule` регистрирует `HttpModule` с `timeout` и `maxRedirects`.
- Interceptors пишут короткие логи: `HTTP request/response` с method, URL, status, mediaKey.

## Зависимости
- `@nestjs/axios`, `nest-winston`, подключается в `CommonModule`.

## Что читать при изменениях
- `global-http.module.ts`, interceptors в этой папке.
