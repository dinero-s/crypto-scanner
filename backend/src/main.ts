// Загрузка .env до инициализации Nest, чтобы RouterModule.forRoot() видел HTTP_ENABLE
import 'dotenv/config';
import './instrument';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';

import { BadRequestException, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ValidationError } from 'class-validator';
import { AppEnvDto } from './dtos/app.env.dto';
import { useContainer, validate } from 'class-validator';
import { AppModule } from 'src/app/app.module';
import { json } from 'express';
import helmet, { type HelmetOptions } from 'helmet';
import { ENUM_APP_ENVIRONMENT } from 'src/app/constants/app.enum.constant';
import * as fs from 'fs';
import { join } from 'path';

/** Формирует массив ошибок валидации: field + сообщение из декоратора (без сырых constraints) */
function formatValidationErrors(errors: ValidationError[]): { field: string; message: string }[] {
    const result: { field: string; message: string }[] = [];
    for (const err of errors) {
        const field = err.property ?? 'field';
        const msg = err.constraints ? Object.values(err.constraints)[0] : 'Ошибка валидации';
        result.push({ field, message: String(msg) });
        if (err.children?.length) {
            result.push(...formatValidationErrors(err.children));
        }
    }
    return result;
}

export let app: NestExpressApplication;

async function bootstrap() {
    // Валидация env до create(), чтобы RouterModule и JobsModule читали уже согласованные значения
    const classEnv = plainToInstance(AppEnvDto, process.env);
    const errors = await validate(classEnv);
    if (errors.length > 0) {
        const msg = errors
            .map(e => Object.values(e.constraints ?? {}).join(', '))
            .join('; ');
        throw new Error('Env Variable Invalid: ' + msg);
    }
    process.env.NODE_ENV = String(classEnv.APP_ENV);
    process.env.TZ = classEnv.APP_TIMEZONE;
    process.env.HTTP_ENABLE = String(classEnv.HTTP_ENABLE);
    process.env.JOB_ENABLE = String(classEnv.JOB_ENABLE);

    app = await NestFactory.create<NestExpressApplication>(AppModule, {
        cors: false, // CORS обрабатывается через CorsMiddleware
        rawBody: true,
        bodyParser: false, // Disable built-in body parser to use custom ones
    });

    const uploadsRoot = join(process.cwd(), 'uploads');
    const logoDir = join(uploadsRoot, 'logo');
    if (!fs.existsSync(uploadsRoot)) {
        fs.mkdirSync(uploadsRoot, { recursive: true });
    }
    if (!fs.existsSync(logoDir)) {
        fs.mkdirSync(logoDir, { recursive: true });
    }
    app.useStaticAssets(uploadsRoot, { prefix: '/uploads/' });

    const configService = app.get(ConfigService);
    const globalPrefix: string = configService.get<string>('app.globalPrefix');

    app.use(json({ limit: '50mb' }));
    const env: string = configService.get<string>('app.env');
    const port: number = configService.get<number>('app.http.port');
    const swaggerUrl: string = configService.get<string>('SWAGGER_URL') ?? '';
    const httpEnable: boolean = configService.get<boolean>('app.http.enable');
    const jobEnable: boolean = configService.get<boolean>('app.jobEnable');

    const logger = new Logger();

    // trust proxy для корректного IP за прокси
    (app as unknown as { set: (name: string, value: unknown) => void }).set(
        'trust proxy',
        true
    );

    // Global prefix
    app.setGlobalPrefix(globalPrefix);

    useContainer(app.select(AppModule), { fallbackOnErrors: true });
    app.useGlobalPipes(
        new ValidationPipe({
            stopAtFirstError: true,
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
            exceptionFactory(errors: ValidationError[]) {
                const formatted = formatValidationErrors(errors);
                const message = formatted.length > 0 ? formatted[0].message : 'Ошибка валидации';
                throw new BadRequestException({
                    message,
                    errors: formatted,
                });
            },
        })
    );

    // Настройки Helmet: в dev отключаем CSP/HSTS, чтобы Swagger работал по HTTP
    const helmetOptions: HelmetOptions = {
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: false,
        hsts: env === ENUM_APP_ENVIRONMENT.PRODUCTION ? undefined : false,
    };

    // CSP только для production
    if (env === ENUM_APP_ENVIRONMENT.PRODUCTION) {
        helmetOptions.contentSecurityPolicy = {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Swagger требует unsafe-eval
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        };
    } else {
        // В development отключаем CSP для работы Swagger
        helmetOptions.contentSecurityPolicy = false;
    }

    app.use(helmet(helmetOptions));

    app.enableShutdownHooks();

    // Swagger: относительный импорт — в dist алиас `src/*` не резолвится, иначе require('src/swagger') падает.
    try {
        const swaggerModule = await import('./swagger');
        const swaggerInit = swaggerModule.default as
            | ((appInstance: INestApplication) => Promise<void>)
            | undefined;
        if (typeof swaggerInit === 'function') {
            await swaggerInit(app);
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn(`Swagger не подключён: ${msg}`, 'NestApplication');
    }
    await app.listen(port);

    // logger.log(JSON.parse(JSON.stringify(process.env)), 'NestApplication');

    logger.log(`==========================================================`);

    logger.log(`Job is ${jobEnable}`, 'NestApplication');
    logger.log(
        `Http is ${httpEnable}, ${
            httpEnable ? 'routes registered' : 'no routes registered'
        }`,
        'NestApplication'
    );

    logger.log(
        `Http Server running on ${await app.getUrl()}`,
        'NestApplication'
    );
    logger.log(`Swagger URL ${swaggerUrl}/api/docs#/`, 'NestApplication');

    logger.log(`==========================================================`);
}
bootstrap();
