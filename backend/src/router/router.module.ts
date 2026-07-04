import { DynamicModule, ForwardReference, Module, Type } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RouterModule as NestJsRouterModule } from '@nestjs/core';

import { RoutesAdminModule } from './routes/routes.admin.module';
import { RoutesPublicModule } from './routes/routes.public.module';
import { RoutesUserModule } from './routes/routes.user.module';

/** HTTP_ENABLE задаётся в main из валидированного env до create (то же значение, что app.http.enable). */
@Module({})
export class RouterModule {
    static forRoot(): DynamicModule {
        const imports: (
            | DynamicModule
            | Type<unknown>
            | Promise<DynamicModule>
            | ForwardReference<unknown>
        )[] = [ConfigModule];

        const httpEnable = process.env.HTTP_ENABLE === 'true';
        if (httpEnable) {
            imports.push(
                RoutesAdminModule,
                RoutesUserModule,
                RoutesPublicModule,
                NestJsRouterModule.register([
                    { path: '/admin', module: RoutesAdminModule },
                    { path: '/user', module: RoutesUserModule },
                    { path: '', module: RoutesPublicModule },
                ])
            );
        }

        return {
            module: RouterModule,
            providers: [],
            exports: [],
            controllers: [],
            imports,
        };
    }
}
