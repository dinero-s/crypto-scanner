import { Injectable } from '@nestjs/common';
import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import { SHA256, enc } from 'crypto-js';
import { IHelperHashService } from 'src/common/helper/interfaces/helper.hash-service.interface';

/** Утилиты для хеширования и сравнения хешей */
@Injectable()
export class HelperHashService implements IHelperHashService {
    /** Генерирует случайную соль заданной длины */
    randomSalt(length: number): string {
        return genSaltSync(length);
    }

    /** Строит bcrypt-хеш строки с указанной солью */
    bcrypt(passwordString: string, salt: string): string {
        return hashSync(passwordString, salt);
    }

    /** Сравнивает строку с bcrypt-хешем */
    bcryptCompare(passwordString: string, passwordHashed: string): boolean {
        return compareSync(passwordString, passwordHashed);
    }

    /** Строит SHA256-хеш строки в hex-формате */
    sha256(string: string): string {
        return SHA256(string).toString(enc.Hex);
    }

    /** Сравнивает два SHA256-хеша */
    sha256Compare(hashOne: string, hashTwo: string): boolean {
        return hashOne === hashTwo;
    }
}
