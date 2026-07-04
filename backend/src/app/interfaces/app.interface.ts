import { ValidationError } from 'class-validator';
import {
    IMessageValidationError,
    IMessageValidationImportError,
    IMessageValidationImportErrorParam,
} from 'src/common/message/interfaces/message.interface';
import { IResponseMetadata } from 'src/common/response/interfaces/response.interface';

export interface IAppException {
    statusCode: number;
    message: string;
    /** Путь эндпоинта, по которому пришёл запрос */
    path?: string;
    errors?: IMessageValidationError[] | ValidationError[];
    data?: Record<string, unknown>;
    _metadata?: IResponseMetadata;
}

export interface IAppImportException extends Omit<IAppException, 'errors'> {
    statusCode: number;
    message: string;
    errors?:
        | IMessageValidationImportErrorParam[]
        | IMessageValidationImportError[];
    data?: Record<string, unknown>;
    _metadata?: IResponseMetadata;
}
