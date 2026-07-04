import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { AdminRole } from '../enums/roles.enum';

export class CreateAdminDto {

    @ApiProperty({
        description: 'Имя администратора',
        example: 'John Doe'
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Email администратора',
        example: 'admin@example.com'
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'Пароль',
        example: 'password123',
        minLength: 6
    })
    @IsString()
    @MinLength(6)
    @IsNotEmpty()
    password: string;

    

    @ApiProperty({
        description: 'Роль администратора',
        enum: AdminRole,
        example: AdminRole.CONTENT_MANAGER,
        enumName: 'AdminRole'
    })
    @IsEnum(AdminRole, {
        message: `Роль должна быть одной из: ${Object.values(AdminRole).join(', ')}`,
    })
    @IsNotEmpty()
    role: AdminRole;
} 