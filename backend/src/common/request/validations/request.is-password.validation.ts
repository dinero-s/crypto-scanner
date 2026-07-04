import { Injectable } from '@nestjs/common';
import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import type { HelperStringPasswordRule } from 'src/common/helper/interfaces/helper.interface';
import { HelperStringService } from 'src/common/helper/services/helper.string.service';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsPasswordConstraint implements ValidatorConstraintInterface {
    constructor(protected readonly helperStringService: HelperStringService) {}

    validate(value: string, args: ValidationArguments): boolean {
        if (!value) return false;
        const rule = (args.constraints[0] as HelperStringPasswordRule | undefined) ?? 'strict';
        return this.helperStringService.checkPasswordStrength(value, {
            rule,
            length: rule === 'registration' ? 6 : 8,
        });
    }

    defaultMessage(): string {
        return 'Пароль не соответствует требованиям';
    }
}

/** Строгий пароль: 8+ символов, верхний/нижний регистр и цифра */
export function IsPassword(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string): void {
        registerDecorator({
            name: 'IsPassword',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsPasswordConstraint,
        });
    };
}

/** Пароль для регистрации/сброса: 6+ символов, буквы и цифры */
export function IsPasswordForRegistration(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string): void {
        registerDecorator({
            name: 'IsPasswordForRegistration',
            target: object.constructor,
            propertyName: propertyName,
            options: {
                ...validationOptions,
                message:
                    validationOptions?.message ??
                    'Не менее 6 символов, включая буквы и цифры',
            },
            constraints: ['registration'],
            validator: IsPasswordConstraint,
        });
    };
}
