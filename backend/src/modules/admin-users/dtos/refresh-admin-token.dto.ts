import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** DTO обновления пары admin access/refresh токенов */
export class RefreshAdminTokenDto {
    @ApiProperty({ description: 'Refresh token администратора' })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}
