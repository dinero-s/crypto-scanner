import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AdminRole } from '../enums/roles.enum';

export class UpdateRoleDto {
    @ApiProperty({
        description: 'Новая роль администратора',
        enum: AdminRole,
        example: AdminRole.ADMIN,
        enumName: 'AdminRole'
    })
    @IsEnum(AdminRole, {
        message: `Роль должна быть одной из: ${Object.values(AdminRole).join(', ')}`,
    })
    @IsNotEmpty({ message: 'Роль обязательна для заполнения' })
    role: AdminRole;
}
