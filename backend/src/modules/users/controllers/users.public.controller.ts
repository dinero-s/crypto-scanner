import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
} from '@nestjs/common';
import {
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ValidationErrorResponseDto } from 'src/common/response/dtos/validation-error-response.dto';
import { UsersService } from '../services/users.service';
import {
    RegisterDto,
    LoginDto,
    LoginByCodeDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    RefreshTokenDto,
    ConfirmEmailDto,
    LoginWithGoogleDto,
    LoginWithAppleDto,
} from '../dtos/auth.dto';
import { Public } from 'src/app/constants/app.public.contstant';

@ApiTags('Пользователи')
@Controller('users')
export class UsersPublicController {
    constructor(private readonly usersService: UsersService) {}

    @Post('register')
    @Public()
    @Throttle({ login: { limit: 1, ttl: 60_000 } })
    @ApiOperation({
        summary:
            'Регистрация нового пользователя',
    })
    @ApiResponse({
        status: 201,
        description: 'Коды подтверждения отправлены',
    })
    @ApiBody({
        description: 'Регистрация: email, пароль и подтверждение пароля',
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'useremail@example.com' },
                phone: { type: 'string', example: '+77012345678' },
                password: { type: 'string', example: 'SecurePass1' },
                passwordConfirm: { type: 'string', example: 'SecurePass1' },
            },
            required: ['email', 'password', 'passwordConfirm'],
        },
    })
    @ApiResponse({ status: 400, description: 'Неверные данные' })
    @ApiResponse({
        status: 409,
        description: 'Пользователь уже существует или код недавно отправлен',
    })
    @ApiResponse({
        status: 429,
        description:
            'Rate limit: 1 запрос в минуту. retryAfterSeconds — секунды до повтора',
    })
    async register(@Body() registerDto: RegisterDto) {
        return this.usersService.register(registerDto);
    }

    @Post('confirm-email')
    @Public()
    @ApiOperation({ summary: 'Подтверждение email и завершение регистрации' })
    @ApiResponse({
        status: 200,
        description:
            'Email подтвержден. Если телефон уже подтвержден или отсутствует — токен выдан',
    })
    @ApiResponse({ status: 400, description: 'Неверный код подтверждения' })
    async confirmEmail(@Body() confirmEmailDto: ConfirmEmailDto) {
        return this.usersService.confirmEmail(confirmEmailDto);
    }

    @Post('resend-email-confirmation')
    @Public()
    @Throttle({ login: { limit: 1, ttl: 60_000 } })
    @ApiOperation({ summary: 'Повторная отправка кода подтверждения email' })
    @ApiResponse({ status: 200, description: 'Код отправлен на email' })
    @ApiResponse({ status: 404, description: 'Пользователь не найден' })
    @ApiResponse({
        status: 429,
        description:
            'Rate limit: 1 запрос в минуту. retryAfterSeconds — секунды до повтора',
    })
    async resendEmailConfirmation(@Body() body: { email: string }) {
        return this.usersService.resendEmailConfirmation(body.email);
    }

    @Post('login')
    @Public()
    @Throttle({ login: { limit: 5, ttl: 60_000 } })
    @ApiOperation({ summary: 'Авторизация пользователя (email + пароль)' })
    @ApiBody({
        description: 'Вход по email и паролю',
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'useremail@example.com' },
                password: { type: 'string', example: 'SecurePass123!' },
            },
            required: ['email', 'password'],
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Успешная авторизация, токен выдан',
    })
    @ApiResponse({ status: 401, description: 'Неверный email или пароль' })
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.usersService.login(loginDto);
    }

    @Post('login-google')
    @Public()
    @Throttle({ login: { limit: 10, ttl: 60_000 } })
    @ApiOperation({ summary: 'Вход через Google Sign In (idToken с клиента)' })
    @ApiBody({
        description: 'Google ID token после Sign In with Google на устройстве',
        schema: {
            type: 'object',
            properties: {
                idToken: { type: 'string', example: 'eyJhbGciOiJSUzI1NiIs...' },
            },
            required: ['idToken'],
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Успешная авторизация, токены выданы',
    })
    @ApiResponse({ status: 401, description: 'Неверный или истёкший Google ID token' })
    @ApiResponse({ status: 409, description: 'Конфликт привязки аккаунта' })
    @HttpCode(HttpStatus.OK)
    async loginWithGoogle(@Body() loginWithGoogleDto: LoginWithGoogleDto) {
        return this.usersService.loginWithGoogle(loginWithGoogleDto);
    }

    @Post('login-apple')
    @Public()
    @Throttle({ login: { limit: 10, ttl: 60_000 } })
    @ApiOperation({ summary: 'Вход через Apple Sign In (identityToken с клиента)' })
    @ApiBody({
        description: 'Apple identity token; fullName — только при первом входе на клиенте',
        schema: {
            type: 'object',
            properties: {
                identityToken: { type: 'string', example: 'eyJhbGciOiJSUzI1NiIs...' },
                fullName: { type: 'string', example: 'Айдар Нурланов' },
            },
            required: ['identityToken'],
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Успешная авторизация, токены выданы',
    })
    @ApiResponse({ status: 401, description: 'Неверный или истёкший Apple identity token' })
    @ApiResponse({ status: 409, description: 'Конфликт привязки аккаунта' })
    @HttpCode(HttpStatus.OK)
    async loginWithApple(@Body() loginWithAppleDto: LoginWithAppleDto) {
        return this.usersService.loginWithApple(loginWithAppleDto);
    }

    @Post('login-by-code')
    @Public()
    @Throttle({ login: { limit: 1, ttl: 60_000 } })
    @ApiOperation({
        summary: 'Вход по email и коду из forgot-password (выдача JWT; смена пароля — через POST /user/users/change-password)',
    })
    @ApiBody({
        description: 'Email и 6-значный код из письма восстановления',
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string', example: 'user@example.com' },
                code: { type: 'string', example: '123456' },
            },
            required: ['email', 'code'],
        },
    })
    @ApiResponse({ status: 200, description: 'Токены выданы (далее смена пароля по JWT)' })
    @ApiResponse({ status: 401, description: 'Неверный email или код' })
    @ApiResponse({ status: 400, description: 'Ошибка валидации', type: ValidationErrorResponseDto })
    @HttpCode(HttpStatus.OK)
    async loginByCode(@Body() loginByCodeDto: LoginByCodeDto) {
        return this.usersService.loginByCode(loginByCodeDto);
    }

    @Post('refresh-token')
    @Public()
    @Throttle({ login: { limit: 5, ttl: 60_000 } })
    @ApiOperation({ summary: 'Обновление access/refresh токенов' })
    @ApiResponse({
        status: 200,
        description: 'Новые токены выданы',
    })
    @ApiResponse({ status: 401, description: 'Недействительный refresh token' })
    @HttpCode(HttpStatus.OK)
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.usersService.refreshTokens(refreshTokenDto.refreshToken);
    }

    @Post('forgot-password-email')
    @Public()
    @Throttle({ login: { limit: 1, ttl: 60_000 } })
    @ApiOperation({
        summary: 'Запрос на восстановление пароля (отправляет код на email)',
    })
    @ApiResponse({
        status: 200,
        description: 'Код восстановления отправлен на email',
    })
    async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
        return this.usersService.forgotPassword(forgotPasswordDto);
    }

    @Post('reset-password')
    @Public()
    @Throttle({ login: { limit: 5, ttl: 60_000 } })
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Алиас: установка пароля по коду (email+code+newPassword). После успеха — вход через POST /users/login',
    })
    @ApiResponse({ status: 200, description: 'Пароль установлен; войдите по email и новому паролю' })
    @ApiResponse({ status: 400, description: 'Неверный код или код истек; при невалидном body — см. ValidationErrorResponseDto', type: ValidationErrorResponseDto })
    async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.usersService.resetPassword(resetPasswordDto);
    }
}

