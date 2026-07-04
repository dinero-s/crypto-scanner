import { Injectable } from '@nestjs/common';
import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

/** Проверяет, что значение совпадает с другим полем объекта */
@ValidatorConstraint({ async: false })
@Injectable()
export class MatchPropertyConstraint implements ValidatorConstraintInterface {
    validate(value: string, args: ValidationArguments): boolean {
        const [relatedPropertyName] = args.constraints;
        const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
        ];
        return value === relatedValue;
    }

    defaultMessage(args: ValidationArguments): string {
        const [relatedPropertyName] = args.constraints;
        return `Поле ${String(args.property)} должно совпадать с ${String(relatedPropertyName)}`;
    }
}

export function MatchProperty(
    property: string,
    validationOptions?: ValidationOptions
) {
    return function (object: object, propertyName: string): void {
        registerDecorator({
            name: 'MatchProperty',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [property],
            validator: MatchPropertyConstraint,
        });
    };
}
