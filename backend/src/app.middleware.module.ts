import {
    MiddlewareConsumer,
    Module,
    NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import {
    ThrottlerModule,
} from '@nestjs/throttler';
import { AuthRateLimitThrottlerGuard } from './common/guards/auth-rate-limit.guard';
import { AppGeneralFilter } from 'src/app/filters/app.general.filter';
import { AppValidationImportFilter } from 'src/app/filters/app.validation-import.filter';
import { FaviconMiddleware } from './middlewares/favicon.middleware';
import { HelmetMiddleware } from './middlewares/helmet.middleware';
import { JsonBodyParserMiddleware, RawBodyParserMiddleware, TextBodyParserMiddleware, UrlencodedBodyParserMiddleware } from './middlewares/body-parser.middleware';
import { CorsMiddleware } from './middlewares/cors.middleware';
import { UrlVersionMiddleware } from './middlewares/url-version.middleware';
import { ResponseTimeMiddleware } from './middlewares/response-time.middleware';
import { MessageCustomLanguageMiddleware } from './middlewares/custom-language.middleware';
import { AuthGuard } from './common/guards/auth.guard';
import { AppRolesGuard } from './common/guards/app-roles.guard';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from './modules/users/users.module';
import { AdminUsersModule } from './modules/admin-users/admin-users.module';
import { RolesGuard } from './modules/admin-users/guards/roles.guard';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AdminAuditLogInterceptor } from './modules/audit-log/interceptors/admin-audit-log.interceptor';
import { throttlerOptions } from './configs/throttler.config';

@Module({
    controllers: [],
    exports: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AuthRateLimitThrottlerGuard,
        },
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
        {
            provide: APP_GUARD,
            useClass: AppRolesGuard,
        },
        {
            provide: APP_FILTER,
            useClass: AppGeneralFilter,
        },
        {
            provide: APP_FILTER,
            useClass: AppValidationImportFilter,
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: AdminAuditLogInterceptor,
        },
    ],
    imports: [
        UsersModule,
        AdminUsersModule,
        AuditLogModule,
        ThrottlerModule.forRootAsync(throttlerOptions),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                global: true,
                secret: config.get('auth.jwt.accessToken.secretKey'),
                signOptions: {
                    expiresIn: config.get('auth.jwt.accessToken.expirationTime'),
                    subject: config.get('auth.jwt.subject'),
                    audience: config.get('auth.jwt.audience'),
                    issuer: config.get('auth.jwt.issuer'),
                },
            }),
        }),
    ],
})
export class AppMiddlewareModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(
                FaviconMiddleware,
                HelmetMiddleware,
                JsonBodyParserMiddleware,
                TextBodyParserMiddleware,
                RawBodyParserMiddleware,
                UrlencodedBodyParserMiddleware,
                CorsMiddleware,
                UrlVersionMiddleware,
                ResponseTimeMiddleware,
                MessageCustomLanguageMiddleware,
            )
            .forRoutes('*');
    }
}
