import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

/** Смена пароля: JWT + (oldPassword + newPassword) либо только newPassword при входе по коду (resetSession) */
export class ChangePasswordDto {
    @ApiProperty({
        description: 'Текущий пароль (обязателен, если не вход по коду восстановления)',
        example: 'oldPassword123',
        required: false,
    })
    @ValidateIf((o: ChangePasswordDto) => o.newPassword != null)
    @IsOptional()
    @IsString()
    @MinLength(6)
    oldPassword?: string;

    @ApiProperty({
        description: 'Новый пароль',
        example: 'newPassword123',
    })
    @IsString()
    @MinLength(6)
    newPassword: string;
}
