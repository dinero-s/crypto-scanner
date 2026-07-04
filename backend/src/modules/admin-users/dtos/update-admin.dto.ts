import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

/** Статус администратора */
export enum AdminStatus {
    ACTIVE = 'ACTIVE',
    BLOCKED = 'BLOCKED',
}

/** DTO для обновления администратора (все поля опциональны) */
export class UpdateAdminDto {
    @ApiProperty({
        description: 'Имя администратора',
        example: 'Иван Иванов',
        required: false,
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        description: 'Email администратора',
        example: 'admin@example.com',
        required: false,
    })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({
        description: 'Новый пароль (мин. 6 символов)',
        example: 'newPassword123',
        minLength: 6,
        required: false,
    })
    @IsString()
    @MinLength(6)
    @IsOptional()
    password?: string;

    @ApiProperty({
        description: 'Статус: ACTIVE или BLOCKED',
        enum: AdminStatus,
        example: AdminStatus.ACTIVE,
        required: false,
    })
    @IsEnum(AdminStatus)
    @IsOptional()
    status?: AdminStatus;
}
