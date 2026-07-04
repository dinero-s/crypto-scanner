import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost } from '@nestjs/core';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import { Response } from 'express';
import { IAppException } from 'src/app/interfaces/app.interface';
import { HelperDateService } from 'src/common/helper/services/helper.date.service';
import { MessageService } from 'src/common/message/services/message.service';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';
import { ResponseMetadataDto } from 'src/common/response/dtos/response.dto';

/** Пути запросов иконок от браузера — не логируем как ошибку, отвечаем 204 */
const ICON_PATHS = new Set([
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png',
]);

@Catch()
export class AppGeneralFilter implements ExceptionFilter {
    private readonly debug: boolean;
    private readonly logger = new Logger(AppGeneralFilter.name);

    constructor(
        private readonly httpAdapterHost: HttpAdapterHost,
        private readonly messageService: MessageService,
        private readonly configService: ConfigService,
        private readonly helperDateService: HelperDateService
    ) {
        this.debug = this.configService.get<boolean>('app.debug');
    }

    @SentryExceptionCaptured()
    async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
        const { httpAdapter } = this.httpAdapterHost;

        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: Response = ctx.getResponse<Response>();
        const request: IRequestApp = ctx.getRequest<IRequestApp>();

        if (ICON_PATHS.has(request.path) && exception instanceof HttpException && exception.getStatus() === HttpStatus.NOT_FOUND) {
            httpAdapter.reply(ctx.getResponse(), null, HttpStatus.NO_CONTENT);
            return;
        }

        if (this.debug) {
            this.logger.error(exception);
        }

        if (exception instanceof HttpException) {
            const responseBody = exception.getResponse();
            const statusHttp = exception.getStatus();
            const body =
                typeof responseBody === 'object' && responseBody !== null
                    ? { ...responseBody, path: request.path }
                    : { message: responseBody, path: request.path };

            httpAdapter.reply(ctx.getResponse(), body, statusHttp);
            return;
        }

        // set default
        const statusHttp: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        const messagePath = `http.${statusHttp}`;
        const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

        // metadata
        const xLanguage: string =
            request.__language ?? this.messageService.getLanguage();
        const xTimestamp = this.helperDateService.createTimestamp();
        const xTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const xVersion =
            request.__version ??
            this.configService.get<string>('app.urlVersion.version');
        const xRepoVersion = this.configService.get<string>('app.repoVersion');
        const metadata: ResponseMetadataDto = {
            language: xLanguage,
            timestamp: xTimestamp,
            timezone: xTimezone,
            path: request.path,
            version: xVersion,
            repoVersion: xRepoVersion,
        };

        const message: string = this.messageService.setMessage(messagePath, {
            customLanguage: xLanguage,
        });

        const responseBody: IAppException = {
            statusCode,
            message,
            path: request.path,
            _metadata: metadata,
        };

        response
            .setHeader('x-custom-lang', xLanguage)
            .setHeader('x-timestamp', xTimestamp)
            .setHeader('x-timezone', xTimezone)
            .setHeader('x-version', xVersion)
            .setHeader('x-repo-version', xRepoVersion)
            .status(statusHttp)
            .json(responseBody);

        return;
    }
}
