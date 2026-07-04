import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HelperEncryptionService } from 'src/common/helper/services/helper.encryption.service';

interface EncryptedSecretPayload {
    value: string;
}

/** Шифрование/расшифровка Ozon API-ключей */
@Injectable()
export class OzonCredentialsCryptoService {
    constructor(
        private readonly encryptionService: HelperEncryptionService,
        private readonly configService: ConfigService,
    ) {}

    encrypt(plainText: string): string {
        const key = this.configService.get<string>('ozon.encryption.key') ?? '';
        const iv = this.configService.get<string>('ozon.encryption.iv') ?? '';
        return this.encryptionService.aes256Encrypt<EncryptedSecretPayload>(
            { value: plainText },
            key,
            iv,
        );
    }

    decrypt(encrypted: string): string {
        const key = this.configService.get<string>('ozon.encryption.key') ?? '';
        const iv = this.configService.get<string>('ozon.encryption.iv') ?? '';
        const payload =
            this.encryptionService.aes256Decrypt<EncryptedSecretPayload>(
                encrypted,
                key,
                iv,
            );
        return payload.value;
    }

    mask(value: string): string {
        if (value.length <= 4) {
            return '****';
        }
        return `${value.slice(0, 2)}****${value.slice(-2)}`;
    }
}
