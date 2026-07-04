import {
    Injectable,
    NotFoundException,
    ConflictException,
    UnauthorizedException,
    BadRequestException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { getRandomInt } from 'src/utils';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { AppUserRole } from 'src/common/constants/app-role.constant';
import { UsersEntity } from '../entities/users.entity';
import {
    RegisterDto,
    LoginDto,
    LoginByCodeDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    ConfirmEmailDto,
    LoginWithGoogleDto,
    LoginWithAppleDto,
} from '../dtos/auth.dto';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { UsersRepositoryService } from './users-repository.service';
import { UsersActivityService } from './users-activity.service';
import {
    OAuthVerificationResult,
    OAuthVerificationService,
} from './oauth-verification.service';
const RATE_LIMIT_TTL_MS = 60 * 1000;

type DuplicateKeyError = {
    code?: unknown;
};

/** Аутентификация и авторизация пользователей */
@Injectable()
export class UsersAuthService {
    private readonly logger = new Logger(UsersAuthService.name);
    constructor(
        private readonly usersRepository: UsersRepositoryService,
        private readonly configService: ConfigService,
        private readonly mailerService: MailerService,
        private readonly usersActivity: UsersActivityService,
        private readonly oauthVerification: OAuthVerificationService,
    ) {}

    /** Секунды до возможности повторной отправки кода */
    private getRetryAfterSeconds(lastCodeSentAt: Date): number {
        const elapsed = Date.now() - lastCodeSentAt.getTime();
        return Math.max(1, Math.ceil((RATE_LIMIT_TTL_MS - elapsed) / 1000));
    }


    /** HTML-шаблон письма с кодом подтверждения */
    private buildEmailConfirmationHtml(code: string): string {
        const escapedCode = String(code).replace(/[<>&"']/g, (c) => {
            const map: Record<string, string> = {
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;',
                '"': '&quot;',
                "'": '&#39;',
            };
            return map[c] ?? c;
        });
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Подтверждение email</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <div style="width:56px;height:56px;margin:0 auto 24px;background:linear-gradient(135deg,#f97316,#ea580c);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;font-weight:700;color:#fff;">Q</span>
              </div>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#1f2937;">Подтверждение email</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.5;">Ваш 6-значный код для подтверждения email:</p>
              <div style="padding:20px 32px;background:#f9fafb;border-radius:8px;border:2px dashed #e5e7eb;">
                <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1f2937;">${escapedCode}</span>
              </div>
              <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">Код действителен 15 минут. Никому не сообщайте код.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;font-size:13px;color:#9ca3af;">MyApp · <a href="mailto:noreply@example.com" style="color:#6b7280;text-decoration:none;">noreply@example.com</a></p>
              <p style="margin:8px 0 0;"><a href="#" style="font-size:12px;color:#9ca3af;text-decoration:underline;">Отписаться от рассылок</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }

    /** HTML-шаблон письма восстановления пароля */
    private buildPasswordResetHtml(code: string): string {
        const escapedCode = String(code).replace(/[<>&"']/g, (c) => {
            const map: Record<string, string> = {
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;',
                '"': '&quot;',
                "'": '&#39;',
            };
            return map[c] ?? c;
        });
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Восстановление пароля</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f5f5f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <div style="width:56px;height:56px;margin:0 auto 24px;background:linear-gradient(135deg,#f97316,#ea580c);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;font-weight:700;color:#fff;">Q</span>
              </div>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#1f2937;">Восстановление пароля</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.5;">Ваш 6-значный код для восстановления пароля:</p>
              <div style="padding:20px 32px;background:#f9fafb;border-radius:8px;border:2px dashed #e5e7eb;">
                <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1f2937;">${escapedCode}</span>
              </div>
              <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;">Код действителен 15 минут. Никому не сообщайте код.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;font-size:13px;color:#9ca3af;">MyApp · <a href="mailto:noreply@example.com" style="color:#6b7280;text-decoration:none;">noreply@example.com</a></p>
              <p style="margin:8px 0 0;"><a href="#" style="font-size:12px;color:#9ca3af;text-decoration:underline;">Отписаться от рассылок</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    }

    async confirmEmail(confirmEmailDto: ConfirmEmailDto) {
        const usersModel = this.usersRepository.getModel();
        const user = await usersModel.findOne({
            email: confirmEmailDto.email,
            emailConfirmationCode: confirmEmailDto.code,
        });

        if (!user) {
            throw new BadRequestException('Неверный код подтверждения');
        }

        user.isEmailConfirmed = true;
        user.emailConfirmationCode = null;
        await user.save();

        const token = await this.generateTokens(user);
        return {
            ...token,
            message: 'Email успешно подтвержден',
        };
    }

    async resendEmailConfirmation(email: string) {
        const usersModel = this.usersRepository.getModel();
        const user = await usersModel.findOne({ email });
        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        if (user.isEmailConfirmed) {
            throw new BadRequestException('Email уже подтвержден');
        }

        if (
            user.lastCodeSentAt &&
            user.lastCodeSentAt > new Date(Date.now() - RATE_LIMIT_TTL_MS)
        ) {
            const retryAfterSeconds = this.getRetryAfterSeconds(user.lastCodeSentAt);
            throw new ConflictException({
                message: 'Код был недавно отправлен, попробуйте через 1 минуту',
                retryAfterSeconds,
            });
        }

        const emailCode = String(getRandomInt(100000, 999999));
        user.emailConfirmationCode = emailCode;
        user.lastCodeSentAt = new Date();
        await user.save();

        try {
            await this.mailerService.sendMail({
                to: user.email,
                subject: 'Подтверждение email',
                html: this.buildEmailConfirmationHtml(emailCode),
            });
        } catch (e) {
            this.logger.error(
                'resendEmailConfirmation sendMail error',
                e?.message || e
            );
            throw new InternalServerErrorException('Ошибка отправки email');
        }

        return {
            message: 'Код подтверждения отправлен на email',
            retryAfterSeconds: Math.ceil(RATE_LIMIT_TTL_MS / 1000),
        };
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
        const usersModel = this.usersRepository.getModel();
        const user = await usersModel.findOne({
            email: forgotPasswordDto.email,
        });
        if (!user) {
            throw new ConflictException('Пользователь с таким email не найден');
        }

        if (
            user.lastCodeSentAt &&
            user.lastCodeSentAt > new Date(Date.now() - RATE_LIMIT_TTL_MS)
        ) {
            const retryAfterSeconds = this.getRetryAfterSeconds(user.lastCodeSentAt);
            throw new ConflictException({
                message: 'Код был недавно отправлен, попробуйте через 1 минуту',
                retryAfterSeconds,
            });
        }

        const resetCode = String(getRandomInt(100000, 999999));
        user.passwordResetCode = resetCode;
        user.lastCodeSentAt = new Date();
        await user.save();

        try {
            await this.mailerService.sendMail({
                to: user.email,
                subject: 'Восстановление пароля',
                html: this.buildPasswordResetHtml(resetCode),
            });
        } catch (e) {
            this.logger.error('forgotPassword sendMail error', e?.message || e);
            throw new InternalServerErrorException('Ошибка отправки email');
        }

        return {
            message: 'Код восстановления отправлен на email',
            retryAfterSeconds: Math.ceil(RATE_LIMIT_TTL_MS / 1000),
        };
    }

    async changePassword(
        userId: string,
        changePasswordDto: ChangePasswordDto,
        opts?: { resetSession?: boolean }
    ) {
        const user = await this.usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        const useResetSession = opts?.resetSession === true;
        if (!useResetSession) {
            if (!changePasswordDto.oldPassword) {
                throw new BadRequestException('Укажите текущий пароль');
            }
            const isPasswordValid = await compare(
                changePasswordDto.oldPassword,
                user.password
            );
            if (!isPasswordValid) {
                throw new BadRequestException('Неверный пароль');
            }
        }

        const hashedPassword = await hash(changePasswordDto.newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return { message: 'Пароль успешно изменен' };
    }

    /** Вход по email и коду из forgot-password: выдача JWT, код инвалидируется */
    async loginByCode(loginByCodeDto: LoginByCodeDto) {
        const usersModel = this.usersRepository.getModel();
        const user = await usersModel.findOne({
            email: loginByCodeDto.email,
            passwordResetCode: loginByCodeDto.code,
        });

        if (!user) {
            throw new UnauthorizedException('Неверный email или код');
        }

        if (user.isBlocked || user.isDisabled || user.isDeleted) {
            throw new UnauthorizedException('Пользователь заблокирован или отключен');
        }

        if (
            user.lastCodeSentAt &&
            user.lastCodeSentAt < new Date(Date.now() - 15 * 60 * 1000)
        ) {
            throw new UnauthorizedException('Код восстановления истек');
        }

        user.passwordResetCode = null;
        await user.save();

        return this.generateTokens(user, { resetSession: true });
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto) {
        const usersModel = this.usersRepository.getModel();
        if (!resetPasswordDto.email) {
            throw new BadRequestException('Не указан email');
        }

        const user = await usersModel.findOne({
            email: resetPasswordDto.email,
            passwordResetCode: resetPasswordDto.code,
        });

        if (!user) {
            throw new BadRequestException('Неверный код восстановления');
        }

        if (
            user.lastCodeSentAt &&
            user.lastCodeSentAt < new Date(Date.now() - 15 * 60 * 1000)
        ) {
            throw new BadRequestException('Код восстановления истек');
        }

        const hashedPassword = await hash(resetPasswordDto.password, 10);
        user.password = hashedPassword;
        user.passwordResetCode = null;
        await user.save();

        return { message: 'Пароль успешно изменен' };
    }

    async register(registerDto: RegisterDto) {
        const usersModel = this.usersRepository.getModel();

        const existingByEmail = await usersModel.findOne({
            email: registerDto.email,
        });
        if (existingByEmail) {
            if (existingByEmail.isBlocked) {
                throw new ConflictException(
                    'Регистрация с данным email запрещена',
                );
            }
            throw new ConflictException(
                'Пользователь с таким email уже существует',
            );
        }

        if (registerDto.phone) {
            const existingByPhone = await usersModel.findOne({
                phone: registerDto.phone,
            });
            if (existingByPhone) {
                throw new ConflictException(
                    'Пользователь с таким телефоном уже существует',
                );
            }
        }

        const recentUser = await usersModel.findOne({
            email: registerDto.email,
            lastCodeSentAt: { $gt: new Date(Date.now() - RATE_LIMIT_TTL_MS) },
        });
        if (recentUser) {
            const retryAfterSeconds = recentUser.lastCodeSentAt
                ? this.getRetryAfterSeconds(recentUser.lastCodeSentAt)
                : 60;
            throw new ConflictException({
                message: 'Код был недавно отправлен, попробуйте через 1 минуту',
                retryAfterSeconds,
            });
        }

        const hashedPassword = await hash(registerDto.password, 10);
        //! isTest чтобы не ждать отправки и тратить сообщения
        const emailConfirmationCode = String(getRandomInt(100000, 999999));

        const user = new usersModel({
            password: hashedPassword,
            email: registerDto.email,
            phone: registerDto.phone,
            clientType: 'B2C',
            role: AppUserRole.USER,
            isEmailConfirmed: false,
            emailConfirmationCode,
            lastCodeSentAt: new Date(),
            registrationDate: new Date(),
        });

        await user.save();
        //! вынести в очередь чтобы не ждать ответа от mailer
        try {
            await this.mailerService.sendMail({
                to: registerDto.email,
                subject: 'Подтверждение email',
                html: this.buildEmailConfirmationHtml(emailConfirmationCode),
            });
        } catch (e) {
            await usersModel.deleteOne({ _id: user._id });
            const message = e instanceof Error ? e.message : String(e);
            this.logger.error('register sendMail error', message);
            throw new InternalServerErrorException('Ошибка отправки email');
        }

        return {
            message: 'Код подтверждения отправлен на email',
            requiresEmailConfirmation: true,
            retryAfterSeconds: Math.ceil(RATE_LIMIT_TTL_MS / 1000),
        };
    }

    async login(loginDto: LoginDto) {
        const usersModel = this.usersRepository.getModel();

        const user = await usersModel.findOne({ email: loginDto.email });
        if (!user) {
            throw new UnauthorizedException('Неверный email или пароль');
        }

        if (user.isBlocked) {
            throw new UnauthorizedException('Пользователь заблокирован');
        }
        if (user.isDisabled) {
            throw new UnauthorizedException('Пользователь отключен');
        }
        if (user.isDeleted) {
            throw new UnauthorizedException('Пользователь был удален');
        }

        if (!user.password) {
            throw new UnauthorizedException('Неверный email или пароль');
        }

        const isPasswordValid = await compare(
            loginDto.password,
            user.password,
        );
        if (!isPasswordValid) {
            throw new UnauthorizedException('Неверный email или пароль');
        }

        if (user.email && !user.isEmailConfirmed) {
            throw new UnauthorizedException(
                'Подтвердите email кодом из письма для входа',
            );
        }

        return await this.generateTokens(user);
    }

    /** Вход через Google Sign In: верификация idToken, поиск/создание пользователя, JWT */
    async loginWithGoogle(loginWithGoogleDto: LoginWithGoogleDto) {
        const verified = await this.oauthVerification.verifyGoogleIdToken(
            loginWithGoogleDto.idToken,
        );
        return this.loginWithSocialProvider(verified);
    }

    /** Вход через Apple Sign In: верификация identityToken, поиск/создание пользователя, JWT */
    async loginWithApple(loginWithAppleDto: LoginWithAppleDto) {
        const verified = await this.oauthVerification.verifyAppleIdentityToken(
            loginWithAppleDto.identityToken,
        );
        return this.loginWithSocialProvider(verified, {
            fullName: loginWithAppleDto.fullName,
        });
    }

    /** Общая логика social login после верификации токена провайдера */
    private async loginWithSocialProvider(
        verified: OAuthVerificationResult,
        opts?: { fullName?: string },
    ) {
        const providerId = verified.sub;
        const providerField =
            verified.provider === 'google' ? 'googleId' : 'appleId';
        const verifiedEmail =
            verified.emailVerified === true ? verified.email : undefined;

        let user =
            verified.provider === 'google'
                ? await this.usersRepository.findByGoogleId(providerId)
                : await this.usersRepository.findByAppleId(providerId);

        if (!user && verifiedEmail) {
            user = await this.usersRepository.findByEmail(verifiedEmail);
        }

        if (user) {
            this.assertUserCanLogin(user);

            const existingProviderId = user[providerField];
            if (existingProviderId && existingProviderId !== providerId) {
                throw new ConflictException(
                    'Аккаунт уже привязан к другому профилю провайдера',
                );
            }

            if (!existingProviderId) {
                user[providerField] = providerId;
            }

            const resolvedFullName =
                opts?.fullName?.trim() || verified.fullName?.trim();
            if (resolvedFullName && !user.fullName) {
                user.fullName = resolvedFullName;
            }

            if (verifiedEmail && !user.email) {
                await this.assertEmailCanBeAssigned(verifiedEmail, user);
                user.email = verifiedEmail;
            }

            if (verified.emailVerified === true) {
                user.isEmailConfirmed = true;
            }

            await this.saveSocialUser(user);
            return await this.generateTokens(user);
        }

        const usersModel = this.usersRepository.getModel();
        const resolvedFullName =
            opts?.fullName?.trim() || verified.fullName?.trim() || '';

        const newUser = new usersModel({
            [providerField]: providerId,
            email: verifiedEmail,
            fullName: resolvedFullName,
            clientType: 'B2C',
            role: AppUserRole.USER,
            isEmailConfirmed: verified.emailVerified === true,
            registrationDate: new Date(),
        });

        await this.saveSocialUser(newUser);
        return await this.generateTokens(newUser);
    }

    /** Проверяет, что email не занят другим пользователем */
    private async assertEmailCanBeAssigned(
        email: string,
        user: UsersEntity,
    ): Promise<void> {
        const emailOwner = await this.usersRepository.findByEmail(email);
        if (emailOwner && String(emailOwner._id) !== String(user._id)) {
            throw new ConflictException('Email уже используется другим аккаунтом');
        }
    }

    /** Сохраняет OAuth-пользователя и нормализует конфликт уникальных индексов */
    private async saveSocialUser(user: UsersEntity): Promise<void> {
        try {
            await user.save();
        } catch (error) {
            if (this.isDuplicateKeyError(error)) {
                throw new ConflictException(
                    'Аккаунт уже привязан к другому пользователю',
                );
            }
            if (error instanceof Error) {
                throw error;
            }
            throw new InternalServerErrorException('Ошибка сохранения пользователя');
        }
    }

    /** Mongo duplicate key: email/googleId/appleId */
    private isDuplicateKeyError(error: unknown): boolean {
        if (typeof error !== 'object' || error === null || !('code' in error)) {
            return false;
        }
        const duplicateKeyError = error as DuplicateKeyError;
        return duplicateKeyError.code === 11000;
    }

    /** Проверяет, что пользователь может войти (не заблокирован/удалён) */
    private assertUserCanLogin(user: UsersEntity): void {
        if (user.isBlocked) {
            throw new UnauthorizedException('Пользователь заблокирован');
        }
        if (user.isDisabled) {
            throw new UnauthorizedException('Пользователь отключен');
        }
        if (user.isDeleted) {
            throw new UnauthorizedException('Пользователь был удален');
        }
    }

    async refreshTokens(refreshToken: string) {
        const refreshSecret = this.configService.get<string>(
            'auth.jwt.refreshToken.secretKey'
        );
        let payload: { id?: string };
        try {
            payload = jwt.verify(refreshToken, refreshSecret) as {
                id?: string;
            };
        } catch {
            throw new UnauthorizedException('Недействительный refresh token');
        }

        if (!payload?.id) {
            throw new UnauthorizedException('Недействительный refresh token');
        }

        const user = await this.usersRepository.findById(payload.id);
        if (!user) {
            throw new UnauthorizedException('Пользователь не найден');
        }
        if (user.isBlocked) {
            throw new UnauthorizedException('Пользователь заблокирован');
        }
        if (user.isDisabled) {
            throw new UnauthorizedException('Пользователь отключен');
        }
        if (user.isDeleted) {
            throw new UnauthorizedException('Пользователь удален');
        }

        return await this.generateTokens(user);
    }

    private async generateTokens(
        user: UsersEntity,
        options?: { resetSession?: boolean }
    ) {
        await this.usersActivity.recordLogin(user._id);
        const data: Record<string, unknown> = {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            clientType: user.clientType,
            role: user.role ?? AppUserRole.USER,
            type: 'user' as const,
        };
        if (options?.resetSession === true) {
            data.resetSession = true;
        }

        const accessSecret = this.configService.get<string>(
            'auth.jwt.accessToken.secretKey'
        );
        const refreshSecret = this.configService.get<string>(
            'auth.jwt.refreshToken.secretKey'
        );
        const accessExpiry = this.configService.get<string>(
            'auth.jwt.accessToken.expirationTime'
        );
        const refreshExpiry = this.configService.get<string>(
            'auth.jwt.refreshToken.expirationTime'
        );

        const token = jwt.sign(data, accessSecret, {
            expiresIn: accessExpiry ?? '1h',
        });
        const refresh_token = jwt.sign(data, refreshSecret, {
            expiresIn: refreshExpiry ?? '90d',
        });

        return {
            token,
            refresh_token,
            user: {
                id: user._id,
                email: user.email,
                fullName: user.fullName,
                phone: user.phone,
                city: user.city,
                company: user.company,
                clientType: user.clientType,
                role: user.role ?? AppUserRole.USER,
                isEmailConfirmed: user.isEmailConfirmed,
            },
        };
    }
}
