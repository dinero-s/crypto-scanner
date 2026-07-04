import { ForbiddenException } from '@nestjs/common';

/** Ошибка при попытке запрещённого действия (scraping, неофициальный URL и т.д.) */
export class ForbiddenActionError extends ForbiddenException {
    constructor(
        message: string,
        public readonly reason:
            | 'html_scraping'
            | 'forbidden_endpoint'
            | 'unsupported_data_request'
            | 'rate_limit_bypass'
            | 'fallback_scraping',
    ) {
        super({
            message,
            reason,
            compliance: true,
        });
    }
}
