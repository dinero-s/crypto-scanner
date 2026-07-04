import { DynamicModule, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({})
export class QueueModule {
    static forRoot(): DynamicModule {
        return {
            module: QueueModule,
            global: true,
            imports: [
                BullModule.forRootAsync({
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: (config: ConfigService) => ({
                        connection: {
                            host: config.get<string>('redis.host') ?? 'localhost',
                            port: config.get<number>('redis.port') ?? 6379,
                            password: config.get<string>('redis.password'),
                            db: config.get<number>('redis.db') ?? 0,
                        },
                    }),
                }),
            ],
            exports: [BullModule],
        };
    }
}
