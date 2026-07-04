import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({
        description: 'Текущий пароль',
        example: 'oldPassword123'
    })
    @IsString()
    @MinLength(6)
    oldPassword: string;

    @ApiProperty({
        description: 'Новый пароль',
        example: 'newPassword123'
    })
    @IsString()
    @MinLength(6)
    newPassword: string;
} 