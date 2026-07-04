import { HttpException, HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ENUM_REQUEST_STATUS_CODE_ERROR } from 'src/common/request/constants/request.status-code.constant';

export class RequestValidationException extends HttpException {
    constructor(errors: ValidationError[]) {
        super(
            {
                status: ENUM_REQUEST_STATUS_CODE_ERROR.VALIDATION_ERROR,
                code: 'VALIDATION_ERROR',
                message: 'Ошибка валидации параметров',
                errors,
            },
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}
