import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    RequestTimeoutException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { REQUEST_CUSTOM_TIMEOUT_META_KEY } from 'src/common/request/constants/request.constant';
import { ENUM_REQUEST_STATUS_CODE_ERROR } from 'src/common/request/constants/request.status-code.constant';

@Injectable()
export class RequestTimeoutInterceptor
    implements NestInterceptor<Promise<unknown>> {
    private readonly maxTimeoutInSecond: number;

    constructor(
        private readonly configService: ConfigService,
        private readonly reflector: Reflector
    ) {
        this.maxTimeoutInSecond =
            this.configService.get<number>('middleware.timeout');
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<void> {
        if (context.getType() === 'http') {
            const customTimeout = this.reflector.get<boolean>(
                REQUEST_CUSTOM_TIMEOUT_META_KEY,
                context.getHandler()
            );

            if (customTimeout) {
                return next.handle().pipe(
                    timeout(this.maxTimeoutInSecond),
                    catchError(err => {
                        if (err instanceof TimeoutError) {
                            throw new RequestTimeoutException({
                                statusCode:
                                    ENUM_REQUEST_STATUS_CODE_ERROR.TIMEOUT_ERROR,
                                message: 'http.clientError.requestTimeOut',
                            });
                        }
                        return throwError(() => err);
                    })
                );
            } else {
                return next.handle().pipe(
                    timeout(this.maxTimeoutInSecond),
                    catchError(err => {
                        if (err instanceof TimeoutError) {
                            throw new RequestTimeoutException({
                                statusCode:
                                    ENUM_REQUEST_STATUS_CODE_ERROR.TIMEOUT_ERROR,
                                message: 'http.clientError.requestTimeOut',
                            });
                        }
                        return throwError(() => err);
                    })
                );
            }
        }

        return next.handle();
    }
}
