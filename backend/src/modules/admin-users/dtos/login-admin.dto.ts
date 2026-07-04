import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginAdminDto {
    @ApiProperty({
        required: true,
        example: 'admin@example.com',
        description: 'Email администратора'
    })
    @IsString()
    @IsEmail()
    email: string;

    @ApiProperty({
        required: true,
        example: 'M4n8X2vP',
        description: 'Пароль администратора'
    })
    @IsString()
    @MinLength(6)
    password: string;
} 