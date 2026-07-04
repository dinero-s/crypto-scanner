import { ApiProperty } from '@nestjs/swagger';
import {
    IsInt,
    IsOptional,
    IsString,
    Matches,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

/** DTO обновления профиля */
export class UpdateUserProfileDto {
    @ApiProperty({
        description: 'Полное имя (ФИО)',
        required: false,
        example: 'Иванов Иван Иванович',
    })
    @IsOptional()
    @IsString()
    @MaxLength(256)
    fullName?: string;

    @ApiProperty({
        description: 'Город пользователя',
        required: false,
        example: 'Алматы',
    })
    @IsOptional()
    @IsString()
    @MaxLength(128)
    city?: string;

    @ApiProperty({
        description: 'Телефон в международном формате',
        required: false,
        example: '+77012345678',
    })
    @IsOptional()
    @IsString()
    @Matches(/^\+?[1-9]\d{9,14}$/, {
        message: 'Телефон должен быть в формате +77012345678',
    })
    phone?: string;

    @ApiProperty({
        description: 'Год рождения',
        required: false,
        example: 1990,
    })
    @IsOptional()
    @IsInt()
    @Min(1900)
    @Max(2100)
    birthYear?: number;

    avatar?: string;
}
