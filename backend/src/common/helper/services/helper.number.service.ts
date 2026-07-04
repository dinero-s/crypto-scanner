import { Injectable } from '@nestjs/common';
import { IHelperNumberService } from 'src/common/helper/interfaces/helper.number-service.interface';

/** Числовые утилиты */
@Injectable()
export class HelperNumberService implements IHelperNumberService {
    /** Проверяет, что строка является целым числом */
    check(number: string): boolean {
        const regex = /^-?\d+$/;
        return regex.test(number);
    }

    /** Генерирует случайное число заданной длины */
    random(length: number): number {
        const min: number = Number.parseInt(`1`.padEnd(length, '0'));
        const max: number = Number.parseInt(`9`.padEnd(length, '9'));
        return this.randomInRange(min, max);
    }

    /** Генерирует случайное число в диапазоне [min, max) */
    randomInRange(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min);
    }

    /** Считает процент значения от общего количества */
    percent(value: number, total: number): number {
        let tValue = value / total;
        if (Number.isNaN(tValue) || !Number.isFinite(tValue)) {
            tValue = 0;
        }
        return Number.parseFloat((tValue * 100).toFixed(2));
    }
}
