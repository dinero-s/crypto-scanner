# Правила разработки для frontend

## React и компоненты

- **Для всех форм обязательно: `react-hook-form` + валидация через `zod`** (см. раздел «Формы»).
- Если компонент **больше 400 строк** — разбивать на мелкие переиспользуемые компоненты в `components/`.
- Страницы — в `pages/`, только композиция; бизнес-логика — в `hooks/` и `lib/`.

## Формы

- **Для всех форм обязательно: `react-hook-form` + валидация через `zod`.**
- Схемы хранить в `src/schemas/`, подключать через `@hookform/resolvers/zod`.
- Типы полей выводить из схемы: `z.infer<typeof schema>`.
- Сообщения об ошибках валидации — на русском.

```typescript
// schemas/example.schema.ts
import { z } from "zod";

export const exampleSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
});

export type ExampleFormValues = z.infer<typeof exampleSchema>;
```

# Правила разработки для backend

## 📋 Оглавление
1. [Структура модуля](#структура-модуля)
2. [Работа с базой данных](#работа-с-базой-данных)
3. [Роутинг](#роутинг)
4. [Контроллеры](#контроллеры)
5. [Cron задачи](#cron-задачи)
6. [Очереди](#очереди)
7. [Аутентификация и авторизация](#аутентификация-и-авторизация)
8. [Мультиязычность](#мультиязычность)
9. [DTO и валидация](#dto-и-валидация)

---

## 🧭 Описание модуля

### Назначение

В корне каждого модуля должен быть файл `MODULE_DESCRIPTION.md`:

```
src/modules/module-name/MODULE_DESCRIPTION.md
```

### Как использовать

- Перед анализом существующего модуля сначала читать `MODULE_DESCRIPTION.md`.
- Не читать все файлы папки модуля без необходимости.
- Если описания недостаточно, читать только нужные файлы: module, controller, service, dto, entity.
- После существенных изменений в модуле обновлять `MODULE_DESCRIPTION.md`.
- Если файла нет, в конце работы создать его с кратким описанием модуля.

### Что описывать

```markdown
# ModuleName

## Назначение
Кратко: за что отвечает модуль.

## Структура
- controllers: публичные и админские эндпоинты
- services: бизнес-логика и работа с MongoDB
- dto: входные контракты
- entities: MongoDB схемы

## Основные потоки
- Краткое описание ключевых сценариев.

## Зависимости
- Внутренние модули, очереди, cron, внешние API.

## Что читать при изменениях
- Какие файлы обычно нужны для доработок.
```

Описание должно быть коротким и актуальным. Это навигационный файл, а не дубль кода.

---

## 📦 Структура модуля

Стандартная структура модуля должна следовать паттерну:

```
src/modules/module-name/
├── module-name.module.ts       # Основной модуль (controllers: [])
├── controllers/
│   ├── module-name.controller.ts       # Пользовательский контроллер
│   └── module-name.admin.controller.ts # Админский контроллер
├── services/
│   └── module-name.service.ts
├── dto/
│   ├── create-module-name.dto.ts
│   └── update-module-name.dto.ts
└── entities/
    └── module-name.entity.ts
```

### Важно:
- В основном модуле массив `controllers` должен быть **пустым**: `controllers: []`
- Контроллеры подключаются через отдельный роутинг модуль
- Модуль должен экспортировать сервис: `exports: [ModuleNameService]`

**Пример модуля:**
```typescript
@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature([
            {
                name: CompanyEntity.name,
                schema: CompanySchema,
            },
        ], DATABASE_CONNECTION_NAME),
    ],
    controllers: [],  // ❗ ВСЕГДА ПУСТОЙ
    providers: [CompanyService],
    exports: [CompanyService],
})
export class CompanyModule { }
```

---

## 🗄️ Работа с базой данных

### DatabaseModel декоратор

**Всегда используйте** `@DatabaseModel()` для инжекции модели Mongoose:

```typescript
import { Injectable } from '@nestjs/common';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import { CompanyEntity, CompanyDoc } from '../entities/company.entity';

@Injectable()
export class CompanyService {
    constructor(
        @DatabaseModel(CompanyEntity.name)
        private readonly companyModel: Model<CompanyDoc>,
    ) { }
}
```

### Entity

Используйте декораторы из общего модуля базы данных:

```typescript
import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';
import { IDatabaseDocument } from 'src/common/database/interfaces/database.interface';

export const TableName = 'company';

@DatabaseEntity({ collection: TableName, timestamps: true })
export class CompanyEntity {
    @DatabaseProp({ type: String, required: true })
    name: string;
    
    @DatabaseProp({ type: Types.ObjectId, ref: 'AdminUsersEntity', required: true })
    createdBy: Types.ObjectId;
    
    @DatabaseProp({ type: Types.ObjectId, ref: 'AdminUsersEntity', default: null })
    updatedBy: Types.ObjectId;
}

export const CompanySchema = DatabaseSchema(CompanyEntity);
export type CompanyDoc = IDatabaseDocument<CompanyEntity>;
```

**Обязательные поля для отслеживания изменений:**
- `createdBy: Types.ObjectId` - кто создал запись
- `updatedBy: Types.ObjectId` - кто обновил запись
- `timestamps: true` - автоматические createdAt/updatedAt

---

## 🛣️ Роутинг

### Принцип работы

Контроллеры **НЕ прописываются напрямую в модуле**. Все роуты работают через отдельный роутинг модуль.

### Структура роутинга

```
src/router/
├── router.module.ts              # Главный роутинг модуль
└── routes/
    ├── routes.admin.module.ts    # Admin роуты (/admin/*)
    ├── routes.user.module.ts     # User роуты (/user/*)
    └── routes.public.module.ts   # Public роуты (корень /api/*)
```

### Подключение контроллера в роутинг

**routes.admin.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { CompanyAdminController } from 'src/modules/company/controllers/company.admin.controller';
import { CompanyModule } from 'src/modules/company/company.module';

@Module({
    controllers: [
        CompanyAdminController,  // ✅ Контроллер подключается здесь
    ],
    imports: [
        CompanyModule,  // ✅ Импортируем модуль для доступа к сервисам
    ],
})
export class RoutesAdminModule { }
```

**router.module.ts:**
```typescript
NestJsRouterModule.register([
    {
        path: '/admin',
        module: RoutesAdminModule,
    },
    {
        path: '/user',
        module: RoutesUserModule,
    },
    {
        path: '',
        module: RoutesPublicModule,
    },
])
```

### Типы роутов

1. **Admin роуты** (`/admin/*`):
   - Требуют авторизации
   - Используют `@ApiBearerAuth()`
   - Декоратор `@ApiTags('Admin Module Name')`

2. **User роуты** (`/user/*`):
   - Требуют авторизации пользователя
   - Используют `@ApiBearerAuth()`
   - Декоратор `@ApiTags('Module Name')`

3. **Public роуты** (корень `/api/*`):
   - Публичные, без авторизации
   - Используют `@Public()` декоратор

---

## 🎛️ Контроллеры

### Разделение контроллеров

**ВСЕГДА создавайте раздельные контроллеры:**

1. **Пользовательский контроллер** (`module-name.controller.ts`)
2. **Админский контроллер** (`module-name.admin.controller.ts`)

### Пользовательский контроллер

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from 'src/app/constants/app.public.contstant';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Types } from 'mongoose';

@ApiTags('Company')
@Controller('company')
@Public()  // ❗ Если контроллер публичный
export class CompanyController {
    constructor(private readonly companyService: CompanyService) { }

    @Get()
    @ApiOperation({ summary: 'Получить данные компании' })
    @ApiResponse({ status: 200, description: 'Успешно' })
    async getCompanyData(@Query('language') language: string = 'ru') {
        return await this.companyService.findOne(language);
    }
}
```

### Админский контроллер

```typescript
import { Controller, Post, Body, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Types } from 'mongoose';

@ApiTags('Admin Company')
@ApiBearerAuth()  // ❗ Обязательно для админ контроллеров
@Controller('company')
export class CompanyAdminController {
    constructor(private readonly companyService: CompanyService) { }

    @Post()
    @ApiOperation({ summary: 'Создать данные компании' })
    async create(
        @Body() createDto: CreateCompanyDto,
        @CurrentUser('id') adminId: Types.ObjectId  // ❗ Получаем ID админа
    ) {
        return await this.companyService.create(createDto, adminId);
    }

    @Patch()
    @ApiOperation({ summary: 'Обновить данные компании' })
    async update(
        @Body() updateDto: UpdateCompanyDto,
        @CurrentUser('id') adminId: Types.ObjectId
    ) {
        return await this.companyService.update(updateDto, adminId);
    }
}
```

---

## ⏰ Cron задачи

### Принцип работы

**Все cron-подобные задачи должны быть в модуле `src/jobs/`**

### Структура jobs модуля

```
src/jobs/
├── jobs.module.ts              # Главный модуль
├── router/
│   └── jobs.router.module.ts   # Роутер для импорта зависимостей
└── services/
    └── task.service.ts         # Сервис с cron задачами
```

### Пример сервиса с задачами

**task.service.ts:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ScheduledTasksService {
    private readonly logger = new Logger(ScheduledTasksService.name);

    constructor(
        private readonly promotionsService: PromotionsService,
        private readonly notificationsService: NotificationsService,
    ) { }

    @Cron('0 0 * * *')  // Каждый день в полночь
    async checkExpiredPromotions() {
        this.logger.log('Checking expired promotions...');
        
        try {
            const expired = await this.promotionsService.findExpired();
            
            for (const promo of expired) {
                await this.promotionsService.deactivate(promo.id);
            }
            
            this.logger.log(`Deactivated ${expired.length} promotions`);
        } catch (error) {
            this.logger.error('Error checking promotions:', error);
        }
    }

    @Cron('0 */6 * * *')  // Каждые 6 часов
    async sendScheduledNotifications() {
        this.logger.log('Sending scheduled notifications...');
        await this.notificationsService.sendScheduled();
    }
}
```

### Подключение зависимостей

**jobs.router.module.ts:**
```typescript
import { Module } from '@nestjs/common';
import { ScheduledTasksService } from '../services/task.service';
import { PromotionsModule } from 'src/modules/promotions/promotions.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

@Module({
    providers: [ScheduledTasksService],
    imports: [
        PromotionsModule,
        NotificationsModule,
    ],
})
export class JobsRouterModule { }
```

### Включение задач

Задачи включаются через переменную окружения `JOB_ENABLE=true`

---

## 🔄 Очереди

### Принцип работы

**Все очереди должны быть вынесены в отдельный процессор-сервис**

### Структура очередей

```
src/modules/notifications/
├── notifications.module.ts
└── services/
    ├── notifications.service.ts         # Основной сервис
    ├── notification-queue.service.ts    # ✅ Процессор очереди
    └── one-signal.service.ts           # Вспомогательный сервис
```

### Подключение очереди в модуле

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
    DEFAULT_QUEUE_JOB_OPTIONS,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';

@Module({
    imports: [
        BullModule.registerQueue({
            name: QUEUE_NAMES.EXAMPLE,
            defaultJobOptions: DEFAULT_QUEUE_JOB_OPTIONS,
        }),
    ],
    providers: [
        NotificationsService,
        NotificationQueueProcessor,  // ✅ Worker (WorkerHost)
        NotificationQueueProducerService,  // ✅ Producer (InjectQueue)
    ],
    exports: [NotificationsService, NotificationQueueProducerService],
})
export class NotificationsModule { }
```

### Worker (процессор очереди)

**notification-queue.processor.ts:**
```typescript
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
    DEFAULT_QUEUE_WORKER_LOCK_MS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';

export interface NotificationJobData {
    notificationId: string;
    headings: { ru: string; en: string };
    contents: { ru: string; en: string };
    recipientType: 'all' | 'segment' | 'specific';
}

@Processor(QUEUE_NAMES.EXAMPLE, {
    concurrency: 1,
    lockDuration: DEFAULT_QUEUE_WORKER_LOCK_MS,
})
export class NotificationQueueProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationQueueProcessor.name);

    constructor(
        private readonly oneSignalService: OneSignalService,
        private readonly notificationsService: NotificationsService,
    ) {
        super();
    }

    async process(job: Job<NotificationJobData, void, string>): Promise<void> {
        this.logger.log(`jobId=${String(job.id)} name=${job.name}`);

        if (job.name === QUEUE_JOB_NAMES.EXAMPLE_TASK) {
            await this.processImmediateNotification(job.data);
            return;
        }

        if (job.name === 'send-scheduled') {
            await this.processScheduledNotification(job.data);
        }
    }

    private async processImmediateNotification(data: NotificationJobData): Promise<void> {
        const result = await this.oneSignalService.sendNotification({
            headings: data.headings,
            contents: data.contents,
        });

        await this.notificationsService.updateStatus(data.notificationId, 'sent');
        return result;
    }

    private async processScheduledNotification(data: NotificationJobData): Promise<void> {
        await this.processImmediateNotification(data);
    }
}
```

### Producer (постановка job в очередь)

**notification-queue.service.ts:**
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
    DEFAULT_QUEUE_JOB_OPTIONS,
    QUEUE_JOB_NAMES,
    QUEUE_NAMES,
} from 'src/common/queue/constants/queue.constant';
import { NotificationJobData } from './notification-queue.processor';

@Injectable()
export class NotificationQueueProducerService {
    private readonly logger = new Logger(NotificationQueueProducerService.name);

    constructor(
        @InjectQueue(QUEUE_NAMES.EXAMPLE)
        private readonly notificationsQueue: Queue<NotificationJobData>,
    ) {}

    async addImmediateNotification(data: NotificationJobData): Promise<void> {
        const jobId = `notification:${data.notificationId}:immediate`;

        await this.notificationsQueue.add(QUEUE_JOB_NAMES.EXAMPLE_TASK, data, {
            ...DEFAULT_QUEUE_JOB_OPTIONS,
            jobId,
        });

        this.logger.log(`jobId=${jobId} поставлен в очередь`);
    }

    async addScheduledNotification(data: NotificationJobData, sendAt: Date): Promise<void> {
        const delay = Math.max(0, sendAt.getTime() - Date.now());
        const jobId = `notification:${data.notificationId}:scheduled:${String(sendAt.getTime())}`;

        await this.notificationsQueue.add('send-scheduled', data, {
            ...DEFAULT_QUEUE_JOB_OPTIONS,
            jobId,
            delay,
        });

        this.logger.log(`jobId=${jobId} запланирован на ${sendAt.toISOString()}`);
    }
}
```

### Использование очереди в сервисе

```typescript
@Injectable()
export class NotificationsService {
    constructor(
        private readonly notificationQueueProducer: NotificationQueueProducerService,
    ) { }

    async sendNotification(createDto: CreateNotificationDto) {
        const notification = await this.create(createDto);

        if (createDto.sendAt) {
            await this.notificationQueueProducer.addScheduledNotification(
                {
                    notificationId: notification.id,
                    headings: createDto.headings,
                    contents: createDto.contents,
                    recipientType: createDto.recipientType,
                },
                new Date(createDto.sendAt),
            );
        } else {
            await this.notificationQueueProducer.addImmediateNotification({
                notificationId: notification.id,
                headings: createDto.headings,
                contents: createDto.contents,
                recipientType: createDto.recipientType,
            });
        }

        return notification;
    }
}
```

### Обязательные параметры job
- `attempts` + `backoff` — в `DEFAULT_QUEUE_JOB_OPTIONS`
- `jobId` — idempotency key при постановке job
- `lockDuration` — timeout worker в `@Processor(..., { lockDuration })`
- логировать `jobId` при постановке и обработке

---

## 🔐 Аутентификация и авторизация

### CurrentUser декоратор

Декоратор для получения текущего пользователя из request:

```typescript
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Types } from 'mongoose';

// Получить весь объект пользователя
@Post()
async create(
    @Body() dto: CreateDto,
    @CurrentUser() user: any
) {
    console.log(user);  // { id, username, email, role, ... }
}

// Получить только ID
@Post()
async create(
    @Body() dto: CreateDto,
    @CurrentUser('id') userId: Types.ObjectId
) {
    return await this.service.create(dto, userId);
}

// Получить конкретное поле
@Get('profile')
async getProfile(@CurrentUser('email') email: string) {
    return { email };
}
```

**Реализация декоратора:**
```typescript
export const CurrentUser = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;
        return data ? user?.[data] : user;
    },
);
```

### Public декоратор

Для публичных эндпоинтов, не требующих авторизации:

```typescript
import { Public } from 'src/app/constants/app.public.contstant';

@Controller('company')
@Public()  // ✅ Весь контроллер публичный
export class CompanyController {
    @Get()
    async getPublicData() {
        return { message: 'No auth required' };
    }
}

// Или на уровне метода
@Controller('users')
export class UsersController {
    @Get('profile')
    @ApiBearerAuth()
    async getProfile(@CurrentUser('id') userId: string) {
        // Требует авторизации
    }

    @Get('public-info')
    @Public()  // ✅ Только этот метод публичный
    async getPublicInfo() {
        // Не требует авторизации
    }
}
```

**Реализация:**
```typescript
// src/app/constants/app.public.contstant.ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

### OptionalAuth — опциональная авторизация

На публичных роутах `@CurrentUser` без токена вернёт `undefined`. Чтобы **при наличии Bearer** подставлять пользователя, используйте `@OptionalAuth()` вместе с `@Public()`:

```typescript
import { Public, OptionalAuth } from 'src/app/constants/app.public.contstant';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('news')
@Public()
export class NewsController {
    @Get()
    @OptionalAuth()
    async getNews(@CurrentUser('id') userId?: string) {
        if (userId) {
            return await this.newsService.getPersonalized(userId);
        }
        return await this.newsService.getPublic();
    }
}
```

`AuthGuard` при `@Public() + @OptionalAuth()` валидирует токен, если он передан, и кладёт `user` в request; без токена запрос проходит без авторизации.

**Альтернатива:** раздельные публичный и защищённый эндпоинты (отдельные контроллеры или методы с `@ApiBearerAuth()` без `@Public()`).

---

## 🌍 Мультиязычность

### Принцип работы

Мультиязычные поля хранятся в **JSON объектах** с ключами языков (`ru`, `en`).

### Entity с мультиязычными полями

```typescript
import {
    DatabaseEntity,
    DatabaseProp,
    DatabaseSchema,
} from 'src/common/database/decorators/database.decorator';

// Интерфейс для типизации перевода
export interface CompanyTranslation {
    title: string;
    description: string;
    fullName: string;
    shortName: string;
    address: string;
    generalDirector: string;
    storeAddress: string;
}

@DatabaseEntity({ collection: 'company', timestamps: true })
export class CompanyEntity {
    // ❗ Используем тип Object для JSON
    @DatabaseProp({ type: Object, required: true })
    @ApiProperty({ 
        description: 'Переводы информации о компании (ru, en)',
        example: { 
            ru: { title: 'О компании', description: '...' },
            en: { title: 'About company', description: '...' }
        }
    })
    about: {
        ru: CompanyTranslation;
        en: CompanyTranslation;
    };
}
```

### DTO для мультиязычных полей

**create-company.dto.ts:**
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// DTO для перевода
export class CompanyTranslationDto {
    @ApiProperty({ description: 'Заголовок' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: 'Описание компании' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ description: 'Полное наименование' })
    @IsString()
    @IsNotEmpty()
    fullName: string;

    // ... остальные поля
}

// DTO для создания
export class CreateCompanyDto {
    @ApiProperty({ 
        description: 'Переводы информации о компании',
        type: Object,
        example: {
            ru: { title: 'О компании', description: '...' },
            en: { title: 'About company', description: '...' }
        }
    })
    @IsObject()
    @ValidateNested()  // ❗ Включает вложенную валидацию
    @Type(() => CompanyTranslationDto)
    about: {
        ru: CompanyTranslationDto;
        en: CompanyTranslationDto;
    };
}
```

**update-company.dto.ts:**
```typescript
// DTO для обновления (частичное обновление)
export class UpdateCompanyDto {
    @ApiProperty({ 
        description: 'Переводы информации о компании',
        type: Object,
        required: false
    })
    @IsObject()
    @IsOptional()
    about?: {
        ru?: Partial<CompanyTranslationDto>;  // ❗ Partial для опциональных полей
        en?: Partial<CompanyTranslationDto>;
    };
}
```

### Получение данных на нужном языке

**В сервисе:**
```typescript
async findOne(language: string = 'ru'): Promise<CompanyDoc> {
    const company = await this.companyModel
        .findOne()
        .exec();

    if (!company) {
        throw new NotFoundException('Данные не найдены');
    }

    // ✅ Добавляем переведенные поля
    const companyObj = company.toObject() as any;
    
    if (companyObj.about && companyObj.about[language]) {
        companyObj.aboutTranslated = companyObj.about[language];
    }

    return companyObj;
}

// Или получить только нужный язык
async getAbout(language: string = 'ru'): Promise<any> {
    const company = await this.companyModel.findOne().exec();

    if (!company || !company.about) {
        throw new NotFoundException('Информация не найдена');
    }

    const companyObj = company.toObject() as any;
    // ✅ Возвращаем конкретный язык с fallback на ru
    return companyObj.about[language] || companyObj.about.ru;
}
```

**В контроллере:**
```typescript
@Get()
@ApiOperation({ summary: 'Получить данные компании' })
@ApiQuery({ 
    name: 'language', 
    required: false, 
    description: 'Язык (ru, en)', 
    type: String 
})
async getCompanyData(@Query('language') language: string = 'ru') {
    return await this.companyService.findOne(language);
}
```

### Сложные мультиязычные структуры

**Пример с массивами и вложенными объектами:**

```typescript
// Entity
export interface NewsLink {
    name: string;
    url: string;
    text: string;
}

export interface StoryContent {
    type: 'image' | 'video' | 'text';
    content: string;
    text?: string;
    duration?: number;
}

export interface NewsTranslation {
    title: string;
    description?: string;
    links?: NewsLink[];          // ❗ Массив объектов
    storyContent?: StoryContent[];  // ❗ Массив контента
}

@DatabaseEntity({ collection: 'news', timestamps: true })
export class NewsEntity {
    @DatabaseProp({ type: Object, required: true })
    translations: {
        ru: NewsTranslation;
        en: NewsTranslation;
    };
}
```

**DTO для сложных структур:**
```typescript
// Вложенные DTO
export class NewsLinkDto {
    @ApiProperty({ description: 'Название ссылки' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'URL ссылки' })
    @IsString()
    @IsNotEmpty()
    url: string;

    @ApiProperty({ description: 'Текст ссылки' })
    @IsString()
    @IsNotEmpty()
    text: string;
}

export class StoryContentDto {
    @ApiProperty({ description: 'Тип контента', enum: ['image', 'video', 'text'] })
    @IsString()
    @IsNotEmpty()
    type: 'image' | 'video' | 'text';

    @ApiProperty({ description: 'Контент (URL для медиа или текст)' })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ description: 'Дополнительный текст', required: false })
    @IsString()
    @IsOptional()
    text?: string;

    @ApiProperty({ description: 'Длительность для видео', required: false })
    @IsNumber()
    @IsOptional()
    duration?: number;
}

// DTO перевода
export class NewsTranslationDto {
    @ApiProperty({ description: 'Заголовок новости' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: 'Описание', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ 
        description: 'Массив ссылок', 
        required: false, 
        type: [NewsLinkDto]  // ❗ Указываем тип массива
    })
    @IsArray()
    @ValidateNested({ each: true })  // ❗ each: true для массивов
    @Type(() => NewsLinkDto)
    @IsOptional()
    links?: NewsLinkDto[];

    @ApiProperty({ 
        description: 'Массив контента', 
        required: false, 
        type: [StoryContentDto]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StoryContentDto)
    @IsOptional()
    storyContent?: StoryContentDto[];
}

// Основной DTO
export class CreateNewsDto {
    @ApiProperty({ description: 'Переводы новости', type: Object })
    @IsObject()
    @ValidateNested()
    @Type(() => NewsTranslationDto)
    translations: {
        ru: NewsTranslationDto;
        en: NewsTranslationDto;
    };
}
```

---

## ✅ DTO и валидация

### Правила создания DTO

1. **Используйте class-validator декораторы**
2. **Всегда указывайте ApiProperty для Swagger**
3. **Разделяйте Create и Update DTO**
4. **Используйте Type() для вложенных объектов**
5. **Для всех методов сервисов добавляйте краткий JSDoc на русском** (1–2 строки: что делает метод, без дублирования названия)

### Базовый DTO

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { 
    IsString, 
    IsNotEmpty, 
    IsOptional, 
    IsEmail,
    IsEnum,
    IsNumber,
    Min,
    Max,
    Length,
    IsUrl
} from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ description: 'Имя пользователя' })
    @IsString()
    @IsNotEmpty()
    @Length(2, 50)
    username: string;

    @ApiProperty({ description: 'Email' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: 'Возраст', required: false })
    @IsNumber()
    @IsOptional()
    @Min(18)
    @Max(100)
    age?: number;

    @ApiProperty({ description: 'Веб-сайт', required: false })
    @IsUrl()
    @IsOptional()
    website?: string;

    @ApiProperty({ description: 'Роль', enum: ['user', 'admin'] })
    @IsEnum(['user', 'admin'])
    role: string;
}
```

### Update DTO

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// ✅ PartialType делает все поля опциональными
export class UpdateUserDto extends PartialType(CreateUserDto) {}

// Или вручную
export class UpdateUserDto {
    @ApiProperty({ description: 'Имя пользователя', required: false })
    @IsString()
    @IsOptional()
    @Length(2, 50)
    username?: string;

    @ApiProperty({ description: 'Email', required: false })
    @IsEmail()
    @IsOptional()
    email?: string;
}
```

### Вложенные объекты

```typescript
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

class AddressDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    street: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    city: string;
}

class CreateCompanyDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ type: AddressDto })
    @ValidateNested()  // ❗ Для вложенной валидации
    @Type(() => AddressDto)  // ❗ Для правильного типа
    address: AddressDto;
}
```

### Массивы объектов

```typescript
class CreateOrderDto {
    @ApiProperty({ type: [OrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })  // ❗ each: true для массивов
    @Type(() => OrderItemDto)
    items: OrderItemDto[];
}
```

---

## 📝 Чеклист для нового модуля

- [ ] Создана структура папок (controllers/, services/, dto/, entities/)
- [ ] В модуле `controllers: []` (пустой массив)
- [ ] Созданы раздельные контроллеры (user и admin)
- [ ] Сервис использует `@DatabaseModel()` для инжекции модели
- [ ] Entity использует декораторы `@DatabaseEntity`, `@DatabaseProp`
- [ ] Entity имеет поля `createdBy` и `updatedBy`
- [ ] Контроллеры добавлены в соответствующий routes модуль
- [ ] Admin контроллер использует `@ApiBearerAuth()`
- [ ] Public контроллеры используют `@Public()`
- [ ] Методы используют `@CurrentUser('id')` для получения ID
- [ ] Мультиязычные поля в виде JSON объектов `{ ru: {}, en: {} }`
- [ ] DTO для мультиязычных полей с `@ValidateNested()` и `@Type()`
- [ ] Если есть cron задачи - они в модуле `jobs/`
- [ ] Если есть очереди - вынесены в отдельный процессор-сервис
- [ ] Swagger документация для всех эндпоинтов

---

## 🔍 Полезные команды

```bash
# Запуск в dev режиме
npm run start:dev

# Запуск с включенными cron задачами
JOB_ENABLE=true npm run start:dev

# Сборка проекта
npm run build

# Запуск линтера
npm run lint

# Исправление ошибок линтера
npm run lint:fix
```

---

## 📚 Полезные ссылки

- **NestJS Documentation**: https://docs.nestjs.com/
- **Mongoose Documentation**: https://mongoosejs.com/docs/
- **Class Validator**: https://github.com/typestack/class-validator
- **BullMQ**: https://docs.bullmq.io/

---

**Последнее обновление: 2026-01-17**
