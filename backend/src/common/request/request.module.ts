import {
    DynamicModule,
    Module,
} from '@nestjs/common';
import {
    DateGreaterThanConstraint,
    DateGreaterThanEqualConstraint,
} from 'src/common/request/validations/request.date-greater-than.validation';
import {
    DateLessThanConstraint,
    DateLessThanEqualConstraint,
} from 'src/common/request/validations/request.date-less-than.validation';
import {
    GreaterThanEqualOtherPropertyConstraint,
    GreaterThanOtherPropertyConstraint,
} from 'src/common/request/validations/request.greater-than-other-property.validation';
import { IsPasswordConstraint } from 'src/common/request/validations/request.is-password.validation';
import {
    LessThanEqualOtherPropertyConstraint,
    LessThanOtherPropertyConstraint,
} from 'src/common/request/validations/request.less-than-other-property.validation';
import { MatchPropertyConstraint } from 'src/common/request/validations/request.match-property.validation';
import { SafeStringConstraint } from 'src/common/request/validations/request.safe-string.validation';



@Module({})
export class RequestModule {
    static forRoot(): DynamicModule {
        return {
            module: RequestModule,
            controllers: [],
            providers: [
                // {
                //     provide: APP_INTERCEPTOR,
                //     // useClass: RequestTimeoutInterceptor,
                //     useClass: LoggingInterceptor,
                // },
                // ValidationPipe настроен глобально в main.ts
                // Удален дублирующий APP_PIPE для избежания конфликтов
                DateGreaterThanEqualConstraint,
                DateGreaterThanConstraint,
                DateLessThanEqualConstraint,
                DateLessThanConstraint,
                GreaterThanEqualOtherPropertyConstraint,
                GreaterThanOtherPropertyConstraint,
                IsPasswordConstraint,
                LessThanEqualOtherPropertyConstraint,
                LessThanOtherPropertyConstraint,
                MatchPropertyConstraint,
                SafeStringConstraint,
            ],

        };
    }
}
