import {
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
    InjectThrottlerOptions,
    InjectThrottlerStorage,
    ThrottlerGuard,
    ThrottlerModuleOptions,
    ThrottlerStorage as IThrottlerStorage,
} from '@nestjs/throttler';
import { THROTTLE_SKIP_KEY } from 'src/app/constants/app.public.contstant';

/** Guard с корректным IP за прокси и retryAfter; отключается при THROTTLE_ENABLE=false или @ThrottleSkip() */
@Injectable()
export class AuthRateLimitThrottlerGuard extends ThrottlerGuard {
    constructor(
        @InjectThrottlerOptions()
        protected readonly options: ThrottlerModuleOptions,
        @InjectThrottlerStorage()
        protected readonly storageService: IThrottlerStorage,
        protected readonly reflector: Reflector,
        protected readonly configService: ConfigService,
    ) {
        super(options, storageService, reflector);
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const throttleEnable = this.configService.get<boolean>('app.throttleEnable');
        if (throttleEnable === false) {
            return true;
        }
        const skip = this.reflector.getAllAndOverride<boolean>(THROTTLE_SKIP_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (skip) {
            return true;
        }
        return super.canActivate(context);
    }

    protected async getTracker(req: Record<string, unknown>): Promise<string> {
        const request = req as {
            ips?: string[];
            ip?: string;
        };
        if (Array.isArray(request.ips) && request.ips.length > 0) {
            return request.ips[0];
        }
        return String(request.ip ?? '');
    }

    protected async throwThrottlingException(
        context: ExecutionContext,
        throttlerLimitDetail: {
            timeToExpire: number;
            timeToBlockExpire: number;
        },
    ): Promise<void> {
        const raw =
            throttlerLimitDetail.timeToExpire > 0
                ? throttlerLimitDetail.timeToExpire
                : throttlerLimitDetail.timeToBlockExpire;
        const retryAfterSeconds = Math.max(1, Math.ceil(raw));
        throw new HttpException(
            {
                statusCode: HttpStatus.TOO_MANY_REQUESTS,
                message: 'Слишком много запросов. Попробуйте через минуту.',
                retryAfterSeconds,
            },
            HttpStatus.TOO_MANY_REQUESTS,
        );
    }
}

