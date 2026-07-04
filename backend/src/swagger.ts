import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestApplication } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ENUM_APP_ENVIRONMENT } from 'src/app/constants/app.enum.constant';
import { writeFileSync } from 'fs';
import {
    ValidationErrorResponseDto,
    ValidationErrorItemDto,
} from 'src/common/response/dtos/validation-error-response.dto';

export default async function (app: NestApplication) {
    const configService = app.get(ConfigService);
    const env: string = configService.get<string>('app.env');
    const docEnable: boolean = configService.get<boolean>('doc.enable') === true;
    const logger = new Logger();

    const docName: string = configService.get<string>('doc.name');
    const docDesc: string = configService.get<string>('doc.description');
    const docVersion: string = configService.get<string>('doc.version');
    const docPrefix: string = configService.get<string>('doc.prefix');

    if (env !== ENUM_APP_ENVIRONMENT.PRODUCTION || docEnable) {
        const documentBuild = new DocumentBuilder()
            .setTitle(docName)
            .setDescription(docDesc)
            .setVersion(docVersion)
            .addBearerAuth(
                { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
                'accessToken',
            )
            .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'xApiKey')
            .build();

        const document = SwaggerModule.createDocument(app, documentBuild, {
            deepScanRoutes: true,
            extraModels: [ValidationErrorResponseDto, ValidationErrorItemDto],
        });

        // Удаление дубликатов: если есть /api/user/X и /api/X с одинаковым operationId — оставляем только /api/user/X
        const paths = document.paths ?? {};
        const toDelete: string[] = [];
        for (const path of Object.keys(paths)) {
            if (!path.startsWith('/api/') || path.startsWith('/api/user/')) continue;
            const afterApi = path.slice(5);
            const userPath = `/api/user/${afterApi}`;
            if (!paths[userPath]) continue;
            const methods = paths[path] as Record<string, { operationId?: string }> | undefined;
            const userMethods = paths[userPath] as Record<string, { operationId?: string }> | undefined;
            if (typeof methods !== 'object' || typeof userMethods !== 'object') continue;
            for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
                const spec = methods[method];
                const userSpec = userMethods[method];
                if (spec?.operationId && spec.operationId === userSpec?.operationId) {
                    toDelete.push(path);
                    break;
                }
            }
        }
        for (const p of toDelete) delete paths[p];

        const pathCount = Object.keys(document.paths ?? {}).length;
        if (pathCount === 0) {
            logger.warn(
                'Swagger: маршрутов не найдено. Проверьте HTTP_ENABLE=true в .env и что APP_ENV не production.',
                'NestApplication',
            );
        } else {
            writeFileSync('swagger.json', JSON.stringify(document));
        }
        SwaggerModule.setup(docPrefix, app, document, {
            jsonDocumentUrl: `${docPrefix}/json`,
            yamlDocumentUrl: `${docPrefix}/yaml`,
            explorer: true,
            customSiteTitle: docName,
            swaggerOptions: {
                docExpansion: 'list', // вкладки контроллеров открыты по умолчанию
                defaultModelsExpandDepth: 0, // секция Schemas по умолчанию свёрнута
                persistAuthorization: true,
                displayOperationId: true,
                operationsSorter: 'method',
                tagsSorter: 'alpha',
                tryItOutEnabled: true,
                filter: true,
                deepLinking: true,
            },
        });

        logger.log(`==========================================================`);

        logger.log(`Docs will serve on ${docPrefix}`, 'NestApplication');

        logger.log(`==========================================================`);
    }
}
