import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** DTO блокировки пользователя — причина обязательна (санкция) */
export class BlockUserDto {
    @ApiProperty({
        description: 'Причина блокировки',
        example: 'Нарушение правил клуба',
        maxLength: 500,
    })
    @IsDefined({ message: 'Причина блокировки обязательна' })
    @IsString({ message: 'Причина блокировки должна быть строкой' })
    @IsNotEmpty({ message: 'Причина блокировки обязательна' })
    @MaxLength(500, {
        message: 'Причина блокировки должна быть не длиннее 500 символов',
    })
    reason: string;
}
