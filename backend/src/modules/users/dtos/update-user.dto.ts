import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { AppUserRole } from 'src/common/constants/app-role.constant';

export class UpdateUserDto {

    @ApiProperty({
        description: 'Полное имя (ФИО)',
        required: false,
        example: 'Иванов Иван Иванович'
    })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiProperty({
        description: 'Телефон пользователя',
        required: false,
        example: '77012345678'
    })
    @IsOptional()
    @IsString()
    @Matches(/^\+?[1-9]\d{9,14}$/, {
        message: 'Телефон должен быть в формате +77012345678',
    })
    phone?: string;

    @ApiProperty({
        description: 'Город',
        required: false,
        example: 'Алматы'
    })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({
        description: 'Email пользователя',
        required: false,
        example: 'user@example.com'
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({
        description: 'Компания (необязательно)',
        required: false,
        example: 'ТОО "Компания"'
    })
    @IsOptional()
    @IsString()
    company?: string;

    @ApiProperty({
        description: 'Тип клиента',
        required: false,
        enum: ['B2C', 'B2B']
    })
    @IsOptional()
    @IsEnum(['B2C', 'B2B'])
    clientType?: string;

    @ApiProperty({
        description: 'Роль пользователя',
        required: false,
        enum: AppUserRole,
    })
    @IsOptional()
    @IsEnum(AppUserRole)
    role?: AppUserRole;

    @ApiProperty({
        description: 'Статус блокировки пользователя',
        required: false,
        example: true
    })
    @IsOptional()
    @IsBoolean()
    isBlocked?: boolean;

    @ApiProperty({
        description: 'Причина блокировки (обязательна при блокировке)',
        required: false,
        example: 'Нарушение правил'
    })
    @IsOptional()
    @IsString()
    blockReason?: string;

    @ApiProperty({
        description: 'Отключение пользователя (подписка истекла)',
        required: false,
        example: false
    })
    @IsOptional()
    @IsBoolean()
    isDisabled?: boolean;

    avatar?: string;
} 