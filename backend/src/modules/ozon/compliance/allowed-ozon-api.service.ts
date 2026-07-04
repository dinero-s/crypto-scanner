import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    OZON_ALLOWED_BASE_URLS,
    OZON_ALLOWED_ENDPOINTS,
    OZON_FORBIDDEN_HOSTS,
} from '../constants/ozon-api.constants';
import { ComplianceLogEvent, OzonApiType } from '../constants/ozon.enums';
import { ComplianceLogService } from './compliance-log.service';
import { ForbiddenActionError } from './errors/forbidden-action.error';

/** Проверка allowlist официальных Ozon API — legal-by-design */
@Injectable()
export class AllowedOzonApiService {
    constructor(
        private readonly configService: ConfigService,
        private readonly complianceLog: ComplianceLogService,
    ) {}

    /** Проверяет, что запрос идёт только на разрешённый официальный endpoint */
    assertAllowedRequest(
        apiType: OzonApiType,
        baseUrl: string,
        path: string,
        userId?: string,
    ): void {
        const normalizedPath = this.normalizePath(path);
        const host = this.extractHost(baseUrl);

        if (this.isForbiddenHost(host)) {
            this.complianceLog.log({
                event: ComplianceLogEvent.BLOCKED_HTML_SCRAPING_ATTEMPT,
                userId,
                endpoint: `${host}${normalizedPath}`,
                details: 'Запрос к запрещённому домену Ozon',
            });
            throw new ForbiddenActionError(
                'Запрос к www.ozon.ru и неофициальным доменам запрещён. Используйте только официальные Ozon API.',
                'html_scraping',
            );
        }

        const allowedBaseUrls = this.getAllowedBaseUrls(apiType);
        const normalizedBase = this.normalizeBaseUrl(baseUrl);

        if (!allowedBaseUrls.includes(normalizedBase)) {
            this.complianceLog.log({
                event: ComplianceLogEvent.BLOCKED_FORBIDDEN_ENDPOINT,
                userId,
                endpoint: `${normalizedBase}${normalizedPath}`,
                details: `apiType=${apiType}`,
            });
            throw new ForbiddenActionError(
                `Base URL ${normalizedBase} не входит в allowlist официальных Ozon API`,
                'forbidden_endpoint',
            );
        }

        const allowedPaths = OZON_ALLOWED_ENDPOINTS[apiType];
        const isAllowed = allowedPaths.some(
            (allowedPath) =>
                normalizedPath === allowedPath ||
                normalizedPath.startsWith(`${allowedPath}/`),
        );

        if (!isAllowed) {
            this.complianceLog.log({
                event: ComplianceLogEvent.BLOCKED_FORBIDDEN_ENDPOINT,
                userId,
                endpoint: `${normalizedBase}${normalizedPath}`,
                details: `apiType=${apiType}`,
            });
            throw new ForbiddenActionError(
                `Endpoint ${normalizedPath} не разрешён для ${apiType} API`,
                'forbidden_endpoint',
            );
        }
    }

    /** Логирует недоступность данных через официальный API */
    logDataNotAvailable(
        field: string,
        userId?: string,
        connectionId?: string,
    ): void {
        this.complianceLog.log({
            event: ComplianceLogEvent.DATA_NOT_AVAILABLE,
            userId,
            connectionId,
            details: `field=${field}`,
        });
    }

    private getAllowedBaseUrls(apiType: OzonApiType): string[] {
        const configKey =
            apiType === OzonApiType.SELLER
                ? 'ozon.api.sellerBaseUrl'
                : apiType === OzonApiType.PERFORMANCE
                  ? 'ozon.api.performanceBaseUrl'
                  : 'ozon.api.statisticsBaseUrl';

        const configured = this.configService.get<string>(configKey);
        const defaults = OZON_ALLOWED_BASE_URLS[apiType];

        if (configured && defaults.includes(this.normalizeBaseUrl(configured))) {
            return [this.normalizeBaseUrl(configured)];
        }

        return defaults.map((url) => this.normalizeBaseUrl(url));
    }

    private isForbiddenHost(host: string): boolean {
        const normalized = host.toLowerCase();
        return OZON_FORBIDDEN_HOSTS.some(
            (forbidden) => normalized === forbidden,
        );
    }

    private extractHost(baseUrl: string): string {
        try {
            return new URL(baseUrl).hostname.toLowerCase();
        } catch {
            return baseUrl.toLowerCase();
        }
    }

    private normalizeBaseUrl(baseUrl: string): string {
        return baseUrl.replace(/\/+$/, '');
    }

    private normalizePath(path: string): string {
        if (!path.startsWith('/')) {
            return `/${path}`;
        }
        return path.split('?')[0];
    }
}
