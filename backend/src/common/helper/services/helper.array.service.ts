import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import { IHelperArrayService } from 'src/common/helper/interfaces/helper.array-service.interface';

/** Утилиты для работы с массивами */
@Injectable()
export class HelperArrayService implements IHelperArrayService {
    /** Возвращает элементы массива слева до указанной длины */
    getFromLeft<T>(array: T[], length: number): T[] {
        return _.take(array, length);
    }

    /** Возвращает элементы массива справа до указанной длины */
    getFromRight<T>(array: T[], length: number): T[] {
        return _.takeRight(array, length);
    }

    /** Возвращает элементы, которые есть в a и отсутствуют в b */
    getDifference<T>(a: T[], b: T[]): T[] {
        return _.difference(a, b);
    }

    /** Возвращает пересечение двух массивов */
    getIntersection<T>(a: T[], b: T[]): T[] {
        return _.intersection(a, b);
    }

    /** Конкатенирует два массива */
    concat<T>(a: T[], b: T[]): T[] {
        return _.concat(a, b);
    }

    /** Конкатенирует массивы и убирает дубликаты */
    concatUnique<T>(a: T[], b: T[]): T[] {
        return _.union(a, b);
    }

    /** Убирает дубликаты из массива */
    unique<T>(array: T[]): T[] {
        return _.uniq(array);
    }

    /** Перемешивает элементы массива */
    shuffle<T>(array: T[]): T[] {
        return _.shuffle(array);
    }

    /** Проверяет, равны ли массивы по содержимому */
    equals<T>(a: T[], b: T[]): boolean {
        return _.isEqual(a, b);
    }

    /** Проверяет, отличаются ли массивы по содержимому */
    notEquals<T>(a: T[], b: T[]): boolean {
        return !_.isEqual(a, b);
    }

    /** Проверяет, есть ли пересечение между массивами */
    in<T>(a: T[], b: T[]): boolean {
        return _.intersection(a, b).length > 0;
    }

    /** Проверяет, что пересечения между массивами нет */
    notIn<T>(a: T[], b: T[]): boolean {
        return _.intersection(a, b).length === 0;
    }

    /** Разбивает массив на чанки фиксированного размера */
    chunk<T>(a: T[], size: number): T[][] {
        return _.chunk<T>(a, size);
    }
}
