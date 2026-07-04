import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response, NextFunction } from 'express';
import { HelperArrayService } from 'src/common/helper/services/helper.array.service';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';

@Injectable()
export class MessageCustomLanguageMiddleware implements NestMiddleware {
    private readonly availableLanguage: string[];

    constructor(
        private readonly configService: ConfigService,
        private readonly helperArrayService: HelperArrayService
    ) {
        this.availableLanguage = this.configService.get<string[]>(
            'message.availableLanguage'
        );
    }

    async use(
        req: IRequestApp,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        const defaultLang =
            this.configService.get<string>('message.language') ?? 'ru';
        const queryLang = this.extractQueryLanguage(req);
        const customHeaderLang = this.extractHeaderLanguage(req.headers['x-custom-lang']);
        const acceptLanguage = this.extractHeaderLanguage(req.headers['accept-language']);
        const customLang =
            queryLang ?? customHeaderLang ?? acceptLanguage ?? defaultLang;

        req.__language = customLang;
        req.headers['x-custom-lang'] = customLang;

        next();
    }

    private filterLanguage(customLanguage: string): string[] {
        return this.helperArrayService.getIntersection(
            [customLanguage],
            this.availableLanguage
        );
    }

    private extractQueryLanguage(req: IRequestApp): string | undefined {
        const queryValue = req.query?.lang;
        if (typeof queryValue !== 'string') {
            return undefined;
        }
        return this.normalizeLanguage(queryValue);
    }

    private extractHeaderLanguage(value: unknown): string | undefined {
        if (typeof value !== 'string') {
            return undefined;
        }
        const firstLanguage = value.split(',')[0]?.trim();
        if (!firstLanguage) {
            return undefined;
        }
        return this.normalizeLanguage(firstLanguage);
    }

    private normalizeLanguage(value: string): string | undefined {
        const candidate = value.toLowerCase().split('-')[0];
        const [normalized] = this.filterLanguage(candidate);
        return normalized;
    }
}
