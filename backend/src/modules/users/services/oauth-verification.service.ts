import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

/** Результат верификации OAuth identity token */
export interface OAuthVerificationResult {
    /** Уникальный идентификатор пользователя (sub из токена) */
    sub: string;
    /** Провайдер: apple | google */
    provider: 'apple' | 'google';
    /** Email из токена (если провайдер передал) */
    email?: string;
    /** Email подтверждён провайдером */
    emailVerified?: boolean;
    /** Имя из Google ID token */
    fullName?: string;
}

/** Серверная верификация identity token Apple/Google (TZ п.2) */
@Injectable()
export class OAuthVerificationService {
    private readonly logger = new Logger(OAuthVerificationService.name);

    constructor(private readonly config: ConfigService) {}

    /** Apple может вернуть email_verified строкой */
    private isProviderEmailVerified(value: unknown): boolean {
        return value === true || value === 'true';
    }

    /**
     * Верифицирует Apple identity token и возвращает sub.
     * Проверяет подпись, issuer, audience, expiration.
     */
    async verifyAppleIdentityToken(
        identityToken: string
    ): Promise<OAuthVerificationResult> {
        const clientId =
            this.config.get<string>('auth.apple.signInClientId') ??
            this.config.get<string>('auth.apple.clientId');
        if (!clientId) {
            this.logger.warn(
                'Apple OAuth не настроен: AUTH_SOCIAL_APPLE_CLIENT_ID отсутствует'
            );
            throw new UnauthorizedException(
                'Apple Sign In не настроен на сервере'
            );
        }

        try {
            const verifyAppleToken = (await import('verify-apple-id-token'))
                .default;
            const jwtClaims = await verifyAppleToken({
                idToken: identityToken,
                clientId,
            });
            const sub = jwtClaims?.sub;
            if (!sub || typeof sub !== 'string') {
                throw new UnauthorizedException(
                    'Неверный Apple identity token: отсутствует sub'
                );
            }
            const email =
                typeof jwtClaims?.email === 'string'
                    ? jwtClaims.email
                    : undefined;
            return {
                sub,
                provider: 'apple',
                email,
                emailVerified: this.isProviderEmailVerified(
                    jwtClaims?.email_verified
                ),
            };
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.warn(`Верификация Apple token: ${msg}`);
            throw new UnauthorizedException(
                'Неверный или истёкший Apple identity token'
            );
        }
    }

    /**
     * Верифицирует Google ID token и возвращает sub.
     */
    async verifyGoogleIdToken(
        idToken: string
    ): Promise<OAuthVerificationResult> {
        const webClientId = this.config.get<string>('auth.google.clientId');
        const iosClientId = this.config.get<string>('auth.google.clientIdIos');
        const androidClientId = this.config.get<string>(
            'auth.google.clientIdAndroid'
        );
        //потом убрать
        const devAndroidClientId =
            '444210566625-j67ar09ehr2o9l3iociao6cj9bdfrjk2.apps.googleusercontent.com';
        const audiences = [
            webClientId,
            iosClientId,
            androidClientId,
            devAndroidClientId,
        ].filter(Boolean) as string[];

        if (audiences.length === 0) {
            this.logger.warn(
                'Google OAuth не настроен: отсутствуют Client ID (Web/iOS/Android)'
            );
            throw new UnauthorizedException(
                'Google Sign In не настроен на сервере'
            );
        }

        try {
            const client = new OAuth2Client(webClientId ?? undefined);
            const ticket = await client.verifyIdToken({
                idToken,
                audience: audiences,
            });
            const payload = ticket.getPayload();
            const sub = payload?.sub;
            if (!sub || typeof sub !== 'string') {
                throw new UnauthorizedException(
                    'Неверный Google ID token: отсутствует sub'
                );
            }
            const email =
                typeof payload?.email === 'string' ? payload.email : undefined;
            const fullName =
                typeof payload?.name === 'string' ? payload.name : undefined;
            return {
                sub,
                provider: 'google',
                email,
                emailVerified: payload?.email_verified === true,
                fullName,
            };
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logger.warn(`Верификация Google token: ${msg}`);
            throw new UnauthorizedException(
                'Неверный или истёкший Google ID token'
            );
        }
    }
}
