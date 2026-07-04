import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY, OPTIONAL_AUTH_KEY } from 'src/app/constants/app.public.contstant';
import { AppUserRole } from 'src/common/constants/app-role.constant';
import { UsersService } from 'src/modules/users/services/users.service';
import { AdminUsersService } from 'src/modules/admin-users/services/admin-users.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private reflector: Reflector,
        private configService: ConfigService,
        private usersService: UsersService,
        private adminUsersService: AdminUsersService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const accessSecret = this.configService.get<string>(
            'auth.jwt.accessToken.secretKey',
        );
        const fallbackSecret = this.configService.get<string>(
            'app.tokenSecretMobile',
        );

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const optionalAuth = this.reflector.getAllAndOverride<boolean>(OPTIONAL_AUTH_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        const request = context.switchToHttp().getRequest();

        if (isPublic && optionalAuth) {
            const token = this.extractTokenFromHeader(request);
            if (!token) return true;
            try {
                await this.attachUserFromToken(
                    request,
                    token,
                    accessSecret,
                    fallbackSecret,
                );
            } catch {
                // невалидный токен — считаем как неавторизованного
            }
            return true;
        }
        if (isPublic) {
            return true;
        }

        // Swagger не идёт через контроллеры — исключаем по пути (prefix из doc.config: /api/docs)
        if (request.path?.includes('/docs')) {
            return true;
        }

        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new UnauthorizedException();
        }
        try {
            await this.attachUserFromToken(request, token, accessSecret, fallbackSecret);
        } catch (e) {
            if (e instanceof UnauthorizedException) {
                throw e;
            }
            throw new UnauthorizedException();
        }
        return true;
    }

    private async attachUserFromToken(
        request: Record<string, unknown>,
        token: string,
        accessSecret: string,
        fallbackSecret: string,
    ): Promise<void> {
        let payload: { id?: string; [k: string]: unknown };
        try {
            payload = await this.jwtService.verifyAsync(token, {
                secret: accessSecret,
            });
        } catch {
            payload = await this.jwtService.verifyAsync(token, {
                secret: Buffer.from(fallbackSecret, 'base64'),
            });
        }

        if (payload.id) {
            const tokenType = payload.type as string | undefined;

            if (tokenType === 'admin') {
                const admin = await this.adminUsersService.findOne(payload.id as string);
                if (!admin) {
                    throw new UnauthorizedException('Администратор не найден');
                }
                request['user'] = admin;
                return;
            }

            if (tokenType === 'user') {
                const user = await this.usersService.findById(payload.id as string);
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
                request['user'] = {
                    ...payload,
                    role: user.role ?? AppUserRole.USER,
                };
                return;
            }

            try {
                const admin = await this.adminUsersService.findOne(payload.id as string);
                if (admin) {
                    request['user'] = admin;
                    return;
                }
            } catch {
                // не админ
            }
            const user = await this.usersService.findById(payload.id as string);
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
            request['user'] = {
                ...payload,
                role: user.role ?? AppUserRole.USER,
            };
            return;
        }

        request['user'] = payload;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? [];

        return type === 'Bearer' ? token : undefined;
    }
}