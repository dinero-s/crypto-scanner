import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    Length,
    Matches,
} from 'class-validator';
import { MatchProperty } from 'src/common/request/validations/request.match-property.validation';
import { IsPasswordForRegistration } from 'src/common/request/validations/request.is-password.validation';

/** DTO регистрации: email, пароль и подтверждение пароля */
export class RegisterDto {
    @ApiProperty({
        description: 'Email пользователя',
        example: 'useremail@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    @Transform(({ value }) => (value === '' ? null : value))
    email: string;

    @ApiProperty({
        description: 'Телефон в международном формате',
        example: '+77012345678',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Matches(/^\+?[1-9]\d{9,14}$/, {
        message: 'Телефон должен быть в формате +77012345678',
    })
    phone?: string;

    @ApiProperty({
        description: 'Пароль. Не менее 6 символов, включая буквы и цифры',
        example: 'SecurePass1',
        minLength: 6,
    })
    @IsString()
    @IsPasswordForRegistration()
    password: string;

    @ApiProperty({
        description: 'Подтверждение пароля',
        example: 'SecurePass1',
        minLength: 6,
    })
    @IsString()
    @IsNotEmpty()
    @MatchProperty('password', { message: 'Пароли не совпадают' })
    passwordConfirm: string;
}

/** DTO авторизации: только email и пароль */
export class LoginDto {
    @ApiProperty({
        description: 'Email пользователя',
        example: 'useremail@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'Пароль',
        example: 'SecurePass123!',
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}

/** DTO входа по коду из forgot-password (выдача JWT, затем смена пароля через change-password) */
export class LoginByCodeDto {
    @ApiProperty({ description: 'Email пользователя', example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ description: '6-значный код восстановления из email', example: '123456' })
    @IsString()
    @Length(6, 6)
    @Matches(/^\d{6}$/, { message: 'Код должен быть 6 цифр' })
    code: string;
}

export class ForgotPasswordDto {
    @ApiProperty({
        description: 'Email пользователя для восстановления пароля',
        example: 'user@example.com',
    })
    @IsEmail()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({
        description: 'Email пользователя',
        example: 'user@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: '6-значный код восстановления из email',
        example: '123456',
    })
    @IsString()
    @Length(6, 6)
    @Matches(/^\d{6}$/, { message: 'Код должен быть 6 цифр' })
    code: string;

    @ApiProperty({
        description: 'Пароль. Не менее 6 символов, включая буквы и цифры',
        example: 'SecurePass1',
        minLength: 6,
    })
    @IsString()
    @IsPasswordForRegistration()
    password: string;

    @ApiProperty({
        description: 'Подтверждение пароля',
        example: 'SecurePass1',
        minLength: 6,
    })
    @IsString()
    @IsNotEmpty()
    @MatchProperty('password', { message: 'Пароли не совпадают' })
    passwordConfirm: string;
}

export class RefreshTokenDto {
    @ApiProperty({
        description: 'Refresh token для обновления пары access/refresh',
        example: 'eyJhbGciOiJIUzI1NiIs...',
    })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

export class ConfirmEmailDto {
    @ApiProperty({
        description: 'Email пользователя',
        example: 'user@example.com',
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: '6-значный код подтверждения из email',
        example: '123456',
    })
    @IsString()
    @Length(6, 6)
    @Matches(/^\d{6}$/, { message: 'Код должен быть 6 цифр' })
    code: string;
}

/** DTO входа через Google Sign In (native SDK → idToken на сервер) */
export class LoginWithGoogleDto {
    @ApiProperty({
        description: 'Google ID token с клиента (Sign In with Google)',
        example: 'eyJhbGciOiJSUzI1NiIs...',
    })
    @IsString()
    @IsNotEmpty()
    idToken: string;
}

/** DTO входа через Apple Sign In (native SDK → identityToken на сервер) */
export class LoginWithAppleDto {
    @ApiProperty({
        description: 'Apple identity token с клиента (Sign In with Apple)',
        example: 'eyJhbGciOiJSUzI1NiIs...',
    })
    @IsString()
    @IsNotEmpty()
    identityToken: string;

    @ApiProperty({
        description: 'Имя пользователя (Apple передаёт только при первом входе на клиенте)',
        example: 'Айдар Нурланов',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Length(1, 200)
    fullName?: string;
}
