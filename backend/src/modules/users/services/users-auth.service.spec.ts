import {
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersAuthService } from './users-auth.service';
import { UsersRepositoryService } from './users-repository.service';
import { UsersActivityService } from './users-activity.service';
import { OAuthVerificationService } from './oauth-verification.service';
import { AppUserRole } from 'src/common/constants/app-role.constant';
import { UsersEntity } from '../entities/users.entity';

describe('UsersAuthService — social login', () => {
    let service: UsersAuthService;
    let usersRepository: jest.Mocked<
        Pick<
            UsersRepositoryService,
            | 'findByGoogleId'
            | 'findByAppleId'
            | 'findByEmail'
            | 'getModel'
            | 'findById'
        >
    >;
    let oauthVerification: jest.Mocked<
        Pick<OAuthVerificationService, 'verifyGoogleIdToken' | 'verifyAppleIdentityToken'>
    >;
    let saveMock: jest.Mock;
    let usersModelCtor: jest.Mock;

    beforeEach(() => {
        saveMock = jest.fn().mockResolvedValue(undefined);
        usersModelCtor = jest.fn().mockImplementation((data: Record<string, unknown>) => ({
            ...data,
            _id: 'new-user-id',
            save: saveMock,
        }));

        usersRepository = {
            findByGoogleId: jest.fn(),
            findByAppleId: jest.fn(),
            findByEmail: jest.fn(),
            getModel: jest.fn().mockReturnValue(usersModelCtor),
            findById: jest.fn(),
        };

        oauthVerification = {
            verifyGoogleIdToken: jest.fn(),
            verifyAppleIdentityToken: jest.fn(),
        };

        service = new UsersAuthService(
            usersRepository as unknown as UsersRepositoryService,
            {
                get: jest.fn((key: string) => {
                    if (key === 'auth.jwt.accessToken.secretKey') {
                        return 'access-secret';
                    }
                    if (key === 'auth.jwt.refreshToken.secretKey') {
                        return 'refresh-secret';
                    }
                    if (key === 'auth.jwt.accessToken.expirationTime') {
                        return '1h';
                    }
                    if (key === 'auth.jwt.refreshToken.expirationTime') {
                        return '90d';
                    }
                    return undefined;
                }),
            } as unknown as ConfigService,
            {} as MailerService,
            { recordLogin: jest.fn() } as unknown as UsersActivityService,
            oauthVerification as unknown as OAuthVerificationService,
        );
    });

    it('loginWithGoogle — создаёт пользователя при первом входе', async () => {
        oauthVerification.verifyGoogleIdToken.mockResolvedValue({
            sub: 'google-sub-1',
            provider: 'google',
            email: 'user@gmail.com',
            emailVerified: true,
            fullName: 'Test User',
        });
        usersRepository.findByGoogleId.mockResolvedValue(null);
        usersRepository.findByEmail.mockResolvedValue(null);

        const result = await service.loginWithGoogle({ idToken: 'valid-token' });

        expect(usersModelCtor).toHaveBeenCalledWith(
            expect.objectContaining({
                googleId: 'google-sub-1',
                email: 'user@gmail.com',
                isEmailConfirmed: true,
                role: AppUserRole.USER,
            }),
        );
        expect(saveMock).toHaveBeenCalled();
        expect(result.token).toBeDefined();
        expect(result.refresh_token).toBeDefined();
    });

    it('loginWithGoogle — привязывает googleId к существующему email-аккаунту', async () => {
        const existingUser = {
            _id: 'existing-id',
            email: 'user@gmail.com',
            isBlocked: false,
            isDisabled: false,
            isDeleted: false,
            save: saveMock,
        } as unknown as UsersEntity;

        oauthVerification.verifyGoogleIdToken.mockResolvedValue({
            sub: 'google-sub-2',
            provider: 'google',
            email: 'user@gmail.com',
            emailVerified: true,
        });
        usersRepository.findByGoogleId.mockResolvedValue(null);
        usersRepository.findByEmail.mockResolvedValue(existingUser);

        await service.loginWithGoogle({ idToken: 'valid-token' });

        expect(existingUser.googleId).toBe('google-sub-2');
        expect(existingUser.isEmailConfirmed).toBe(true);
        expect(saveMock).toHaveBeenCalled();
    });

    it('loginWithGoogle — не привязывает неподтверждённый email к существующему аккаунту', async () => {
        oauthVerification.verifyGoogleIdToken.mockResolvedValue({
            sub: 'google-sub-unverified',
            provider: 'google',
            email: 'user@gmail.com',
            emailVerified: false,
        });
        usersRepository.findByGoogleId.mockResolvedValue(null);

        await service.loginWithGoogle({ idToken: 'valid-token' });

        expect(usersRepository.findByEmail).not.toHaveBeenCalled();
        expect(usersModelCtor).toHaveBeenCalledWith(
            expect.objectContaining({
                googleId: 'google-sub-unverified',
                email: undefined,
                isEmailConfirmed: false,
            }),
        );
    });

    it('loginWithGoogle — отклоняет привязку email, занятого другим аккаунтом', async () => {
        const providerUser = {
            _id: 'provider-user-id',
            googleId: 'google-sub-without-email',
            isBlocked: false,
            isDisabled: false,
            isDeleted: false,
            save: saveMock,
        } as unknown as UsersEntity;
        const emailOwner = {
            _id: 'email-owner-id',
            email: 'user@gmail.com',
        } as unknown as UsersEntity;

        oauthVerification.verifyGoogleIdToken.mockResolvedValue({
            sub: 'google-sub-without-email',
            provider: 'google',
            email: 'user@gmail.com',
            emailVerified: true,
        });
        usersRepository.findByGoogleId.mockResolvedValue(providerUser);
        usersRepository.findByEmail.mockResolvedValue(emailOwner);

        await expect(
            service.loginWithGoogle({ idToken: 'valid-token' }),
        ).rejects.toThrow(ConflictException);
        expect(saveMock).not.toHaveBeenCalled();
    });

    it('loginWithGoogle — возвращает конфликт при duplicate key во время создания', async () => {
        saveMock.mockRejectedValueOnce({ code: 11000 });
        oauthVerification.verifyGoogleIdToken.mockResolvedValue({
            sub: 'google-sub-race',
            provider: 'google',
            email: 'race@gmail.com',
            emailVerified: true,
        });
        usersRepository.findByGoogleId.mockResolvedValue(null);
        usersRepository.findByEmail.mockResolvedValue(null);

        await expect(
            service.loginWithGoogle({ idToken: 'valid-token' }),
        ).rejects.toThrow(ConflictException);
    });

    it('loginWithApple — отклоняет заблокированного пользователя', async () => {
        const blockedUser = {
            _id: 'blocked-id',
            appleId: 'apple-sub-1',
            isBlocked: true,
            isDisabled: false,
            isDeleted: false,
            save: saveMock,
        } as unknown as UsersEntity;

        oauthVerification.verifyAppleIdentityToken.mockResolvedValue({
            sub: 'apple-sub-1',
            provider: 'apple',
            email: 'user@icloud.com',
            emailVerified: true,
        });
        usersRepository.findByAppleId.mockResolvedValue(blockedUser);

        await expect(
            service.loginWithApple({ identityToken: 'valid-token' }),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('loginWithApple — конфликт при другом appleId у того же аккаунта', async () => {
        const existingUser = {
            _id: 'existing-id',
            appleId: 'other-apple-sub',
            isBlocked: false,
            isDisabled: false,
            isDeleted: false,
            save: saveMock,
        } as unknown as UsersEntity;

        oauthVerification.verifyAppleIdentityToken.mockResolvedValue({
            sub: 'apple-sub-new',
            provider: 'apple',
        });
        usersRepository.findByAppleId.mockResolvedValue(existingUser);

        await expect(
            service.loginWithApple({ identityToken: 'valid-token' }),
        ).rejects.toThrow(ConflictException);
    });
});
