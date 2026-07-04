import { Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_CONNECTION_NAME } from 'src/common/database/constants/database.constant';
import { DatabaseModule } from 'src/common/database/database.module';
import { DatabaseService } from 'src/common/database/services/database.service';
import { MessageModule } from 'src/common/message/message.module';
import { HelperModule } from 'src/common/helper/helper.module';
import { RequestModule } from 'src/common/request/request.module';
// import { PolicyModule } from 'src/common/policy/policy.module';
// import { ApiKeyModule } from 'src/common/api-key/api-key.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configs from 'src/configs';
import { GridFsStorage } from 'multer-gridfs-storage';
import { MulterModule } from '@nestjs/platform-express';
import { FileModule } from 'src/common/file/file.module';
import { GlobalHttpModule } from './http/http.module';
import { WinstonModule } from 'nest-winston';

import * as winston from 'winston';
import { transports } from 'winston';
import { MailerModule } from '@nestjs-modules/mailer';



// GridFsStorage будет создан через useFactory с ConfigService
const createGridFsStorage = (databaseUri: string) => {
    return new GridFsStorage({
        url: databaseUri,
        file: (req, file) => {
            return {
                filename: file.originalname,
                bucketName: 'Attachments',
            };
        },
    });
};

const { combine, timestamp, label, printf } = winston.format;
const myFormat = printf(({ level, message, label, timestamp }) => {
    // Форматирование логов через winston transports, без console.log
    return `${timestamp} [${label}] ${level}: ${message}`;
});

@Module({
    controllers: [],
    providers: [Logger],
    exports: [],
    imports: [
        // Config
        ConfigModule.forRoot({
            load: configs,
            isGlobal: true,
            cache: true,
            envFilePath: ['.env'],
            expandVariables: false,
        }),

        MongooseModule.forRootAsync({
            connectionName: DATABASE_CONNECTION_NAME,
            imports: [DatabaseModule],
            inject: [DatabaseService],
            useFactory: (databaseService: DatabaseService) =>
                databaseService.createOptions(),

        }),
        MulterModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                storage: createGridFsStorage(configService.get<string>('database.uri')),
            }),
        }),
        FileModule,
        GlobalHttpModule,

        WinstonModule.forRoot({
            format: combine(
                label({ label: process.env.APP_NAME ?? 'nestjs-backend' }),
                timestamp(),
                myFormat
            ),
            transports: [new transports.Console()],
        }),
        MailerModule.forRootAsync({
            useFactory: (configService: ConfigService) => {
                const user =
                    configService.get('MAILER_MAIL') ?? configService.get('SMTP_USER');
                const pass =
                    configService.get('MAILER_PASS') ?? configService.get('SMTP_PASSWORD');
                const host =
                    configService.get('MAILER_HOST') ??
                    configService.get('SMTP_HOST') ??
                    'smtp-relay.brevo.com';
                const port =
                    configService.get('MAILER_PORT') ??
                    configService.get('SMTP_PORT') ??
                    587;
                const fromName =
                    configService.get('MAILER_FROM_NAME') ??
                    configService.get('SMTP_FROM_NAME') ??
                    'App';
                const fromEmail =
                    configService.get('MAILER_FROM_EMAIL') ??
                    configService.get('SMTP_FROM_ADDRESS') ??
                    'noreply@example.com';

                return {
                    transport: {
                        host,
                        port,
                        secure: configService.get('SMTP_SECURE') === 'true',
                        auth: user && pass ? { user, pass } : undefined,
                    },
                    defaults: {
                        from: `"${fromName}" <${fromEmail}>`,
                    },
                };
            },
            inject: [ConfigService],
        }),
        MessageModule.forRoot(),
        HelperModule.forRoot(),
        RequestModule.forRoot(),
        // PolicyModule.forRoot(),
        // ApiKeyModule.forRoot(),
    ],
})
export class CommonModule { }
