import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from 'class-validator';
import { I18nService } from 'nestjs-i18n';
import { HelperArrayService } from 'src/common/helper/services/helper.array.service';
import { ENUM_MESSAGE_LANGUAGE } from 'src/common/message/constants/message.enum.constant';
import {
    IMessageErrorOptions,
    IMessageSetOptions,
    IMessageValidationError,
    IMessageValidationImportError,
    IMessageValidationImportErrorParam,
} from 'src/common/message/interfaces/message.interface';
import { IMessageService } from 'src/common/message/interfaces/message.service.interface';

/** Сервис для работы с текстовыми сообщениями и валидацией */
@Injectable()
export class MessageService implements IMessageService {
    private readonly defaultLanguage: ENUM_MESSAGE_LANGUAGE;
    private readonly availableLanguage: ENUM_MESSAGE_LANGUAGE[];
    private readonly debug: boolean;

    constructor(
        private readonly i18n: I18nService,
        private readonly configService: ConfigService,
        private readonly helperArrayService: HelperArrayService
    ) {
        this.defaultLanguage =
            this.configService.get<ENUM_MESSAGE_LANGUAGE>('message.language');
        this.availableLanguage = this.configService.get<
            ENUM_MESSAGE_LANGUAGE[]
        >('message.availableLanguage');
        this.debug = this.configService.get<boolean>('app.debug');
    }

    /** Возвращает список доступных языков сообщений */
    getAvailableLanguages(): ENUM_MESSAGE_LANGUAGE[] {
        return this.availableLanguage;
    }

    /** Возвращает язык по умолчанию */
    getLanguage(): ENUM_MESSAGE_LANGUAGE {
        return this.defaultLanguage;
    }

    /** Фильтрует язык по списку доступных */
    filterLanguage(customLanguage: string): string[] {
        return this.helperArrayService.getIntersection(
            [customLanguage],
            this.availableLanguage
        );
    }

    /** Возвращает локализованное сообщение по пути */
    setMessage(path: string, options?: IMessageSetOptions): string {
        const language: string = options?.customLanguage
            ? this.filterLanguage(options.customLanguage)[0]
            : this.defaultLanguage;
        try {
            return this.i18n.translate(path, {
                lang: language,
                args: options?.properties,
                debug: this.debug,
            }) as string;
        } catch {
            return path;
        }
    }

    /** Преобразует ошибки валидации в массив локализованных сообщений */
    setValidationMessage(
        errors: ValidationError[],
        options?: IMessageErrorOptions
    ): IMessageValidationError[] {
        const messages: IMessageValidationError[] = [];
        for (const error of errors) {
            const property = error.property ?? 'unknown';
            const constraints: string[] = Object.keys(error.constraints ?? []);

            for (const constraint of constraints) {
                const message = this.setMessage(`request.${constraint}`, {
                    customLanguage: options?.customLanguage,
                    properties: {
                        property,
                        value: error.value,
                    },
                });

                messages.push({
                    property,
                    message: message,
                });
            }
        }

        return messages;
    }

    /** Формирует сообщения об ошибках импорта по строкам */
    setValidationImportMessage(
        errors: IMessageValidationImportErrorParam[],
        options?: IMessageErrorOptions
    ): IMessageValidationImportError[] {
        return errors.map(val => ({
            row: val.row,
            sheetName: val.sheetName,
            errors: this.setValidationMessage(val.error, options),
        }));
    }
}
