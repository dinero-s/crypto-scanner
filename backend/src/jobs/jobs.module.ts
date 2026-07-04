import { DynamicModule, ForwardReference, Module, Type } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsRouterModule } from 'src/jobs/router/jobs.router.module';

@Module({})
export class JobsModule {
    static forRoot(): DynamicModule {
        const imports: (
            | DynamicModule
            | Type<unknown>
            | Promise<DynamicModule>
            | ForwardReference<unknown>
        )[] = [];

        // JOB_ENABLE задаётся в main из валидированного env до create (то же значение, что app.jobEnable)
        if (process.env.JOB_ENABLE === 'true') {
            imports.push(ScheduleModule.forRoot(), JobsRouterModule);
        }

        return {
            module: JobsModule,
            providers: [],
            exports: [],
            controllers: [],
            imports,
        };
    }
}
