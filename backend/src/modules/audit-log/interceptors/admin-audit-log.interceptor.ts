import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap, catchError } from 'rxjs';
import { AuditLogService } from '../services/audit-log.service';
import { AuditAction } from '../enums/audit-action.enum';
import { AuditCategory } from '../enums/audit-category.enum';
import { AuditStatus } from '../enums/audit-status.enum';

type RequestWithUser = Request & {
    user?: {
        id?: string;
        _id?: string | { toString(): string };
    };
};

@Injectable()
export class AdminAuditLogInterceptor implements NestInterceptor {
    constructor(private readonly auditLogService: AuditLogService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (context.getType() !== 'http') {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest<RequestWithUser>();
        if (!this.shouldLog(request)) {
            return next.handle();
        }

        const adminId = this.extractAdminId(request);
        if (!adminId) {
            return next.handle();
        }

        const action = this.resolveActionFromPath(request.path) ?? this.resolveAction(request.method);
        if (!action) {
            return next.handle();
        }

        const entity = this.resolveEntity(request.path);
        const entityId = this.resolveEntityId(request);
        const category = this.resolveCategory(entity);
        const objectName = this.resolveObjectName(request);
        const summary = this.buildSummary(action, entity, objectName, request.path);
        const newData = this.sanitizeData(request.body);
        const reason = this.extractReason(request.body);

        return next.handle().pipe(
            tap(() => {
                void this.auditLogService
                    .create({
                        adminId,
                        action,
                        entity,
                        category,
                        objectName,
                        entityId,
                        description: `${request.method.toUpperCase()} ${request.path}`,
                        summary,
                        status: AuditStatus.SUCCESS,
                        executionResult: 'Успешно',
                        reason,
                        newData,
                        ipAddress: request.ip,
                        userAgent: request.headers['user-agent'],
                    })
                    .catch(() => undefined);
            }),
            catchError((err) => {
                void this.auditLogService
                    .create({
                        adminId,
                        action,
                        entity,
                        category,
                        objectName,
                        entityId,
                        description: `${request.method.toUpperCase()} ${request.path}`,
                        summary,
                        status: AuditStatus.ERROR,
                        executionResult: err?.message ?? 'Ошибка',
                        reason,
                        newData,
                        ipAddress: request.ip,
                        userAgent: request.headers['user-agent'],
                    })
                    .catch(() => undefined);
                throw err;
            }),
        );
    }

    private shouldLog(request: RequestWithUser): boolean {
        const method = request.method.toUpperCase();
        const isMutatingMethod = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(
            method,
        );
        if (!isMutatingMethod) {
            return false;
        }

        return request.path.includes('/admin/');
    }

    private extractAdminId(request: RequestWithUser): string | null {
        const user = request.user;
        if (!user) {
            return null;
        }

        if (typeof user.id === 'string') {
            return user.id;
        }

        if (typeof user._id === 'string') {
            return user._id;
        }

        if (user._id && typeof user._id.toString === 'function') {
            return user._id.toString();
        }

        return null;
    }

    /** Специфичные действия по пути (block, unblock, disable, enable, extend, shorten, activate) */
    private resolveActionFromPath(path: string): AuditAction | null {
        if (path.endsWith('/block')) return AuditAction.BLOCK;
        if (path.endsWith('/unblock')) return AuditAction.UNBLOCK;
        if (path.endsWith('/disable')) return AuditAction.DISABLE;
        if (path.endsWith('/enable')) return AuditAction.ENABLE;
        if (path.endsWith('/activate')) return AuditAction.ACTIVATE;
        if (path.endsWith('/extend')) return AuditAction.UPDATE;
        if (path.endsWith('/shorten')) return AuditAction.UPDATE;
        return null;
    }

    private resolveCategory(entity: string): AuditCategory {
        const map: Record<string, AuditCategory> = {
            users: AuditCategory.USER,
            'admin-users': AuditCategory.ADMIN_SETTINGS,
        };
        return map[entity] ?? AuditCategory.ADMIN_SETTINGS;
    }

    private resolveObjectName(request: Request): string | undefined {
        const body = request.body as Record<string, unknown> | undefined;
        if (!body || typeof body !== 'object') {
            return undefined;
        }
        const title = body.title as Record<string, string> | undefined;
        if (title && typeof title === 'object' && title.ru) {
            return String(title.ru).slice(0, 80);
        }
        if (body.name && typeof body.name === 'string') {
            return body.name.slice(0, 80);
        }
        if (body.email && typeof body.email === 'string') {
            return body.email.slice(0, 80);
        }
        return undefined;
    }

    private buildSummary(
        action: AuditAction,
        entity: string,
        objectName: string | undefined,
        path: string,
    ): string {
        const obj = objectName ? ` ${objectName}` : '';
        const entityLabels: Record<string, string> = {
            users: 'пользователя',
            user: 'пользователя',
            'admin-users': 'менеджера',
        };
        const label = entityLabels[entity] ?? entity;

        const actionLabels: Record<string, string> = {
            [AuditAction.CREATE]: 'Добавил',
            [AuditAction.UPDATE]: 'Обновил',
            [AuditAction.DELETE]: 'Удалил',
            [AuditAction.BLOCK]: 'Заблокировал',
            [AuditAction.UNBLOCK]: 'Разблокировал',
            [AuditAction.DISABLE]: 'Отключил',
            [AuditAction.ENABLE]: 'Включил',
            [AuditAction.ACTIVATE]: 'Активировал',
        };
        const act = actionLabels[action] ?? action;

        if (path.endsWith('/extend')) {
            return `Продлил ${label}${obj}`;
        }
        if (path.endsWith('/shorten')) {
            return `Сократил ${label}${obj}`;
        }
        if (action === AuditAction.CREATE) {
            return `${act} новый ${label}${obj}`.trim();
        }
        return `${act} ${label}${obj}`.trim();
    }

    private resolveAction(method: string): AuditAction | null {
        const normalizedMethod = method.toUpperCase();
        if (normalizedMethod === 'POST') {
            return AuditAction.CREATE;
        }
        if (normalizedMethod === 'PATCH' || normalizedMethod === 'PUT') {
            return AuditAction.UPDATE;
        }
        if (normalizedMethod === 'DELETE') {
            return AuditAction.DELETE;
        }
        return null;
    }

    private resolveEntity(path: string): string {
        const chunks = path.split('/').filter(Boolean);
        const adminIndex = chunks.findIndex((chunk) => chunk === 'admin');
        if (adminIndex >= 0 && chunks[adminIndex + 1]) {
            return chunks[adminIndex + 1];
        }
        return 'admin';
    }

    private resolveEntityId(request: Request): string | undefined {
        const params = request.params as Record<string, string> | undefined;
        if (!params) {
            return undefined;
        }

        return params.id || params.userId || params.orderId || undefined;
    }

    private extractReason(body: unknown): string | undefined {
        if (!body || typeof body !== 'object') {
            return undefined;
        }
        const source = body as Record<string, unknown>;
        const reason = source.reason;
        return typeof reason === 'string' ? reason : undefined;
    }

    private sanitizeData(body: unknown): Record<string, unknown> | undefined {
        if (!body || typeof body !== 'object') {
            return undefined;
        }

        const source = body as Record<string, unknown>;
        const hiddenFields = new Set([
            'password',
            'newPassword',
            'oldPassword',
            'token',
            'refreshToken',
        ]);
        const result: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(source)) {
            if (hiddenFields.has(key)) {
                continue;
            }
            result[key] = value;
        }

        return result;
    }
}
