import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { DatabaseModel } from 'src/common/database/decorators/database.decorator';
import { Model } from 'mongoose';
import { SellerApiClient } from '../../clients/seller-api.client';
import type { OzonPerformanceCredentials } from '../../clients/performance-api.client';
import {
    OzonConnectionAuditAction,
    OzonConnectionAuditStatus,
    OzonConnectionStatus,
} from '../../constants/ozon.enums';
import { CreateOzonConnectionDto } from '../dto/create-ozon-connection.dto';
import {
    OzonConnectionDoc,
    OzonConnectionEntity,
} from '../entities/ozon-connection.entity';
import { OzonConnectionAuditService } from './ozon-connection-audit.service';
import { OzonCredentialsCryptoService } from './ozon-credentials-crypto.service';

export interface OzonConnectionSafeView {
    id: string;
    sellerName: string;
    clientId: string;
    status: OzonConnectionStatus;
    permissions: string[];
    lastSyncAt?: Date;
    telegramChatId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/** Управление подключениями Ozon (без логинов/паролей/cookies) */
@Injectable()
export class OzonConnectionService {
    private readonly logger = new Logger(OzonConnectionService.name);

    constructor(
        @DatabaseModel(OzonConnectionEntity.name)
        private readonly connectionModel: Model<OzonConnectionDoc>,
        private readonly sellerApiClient: SellerApiClient,
        private readonly credentialsCrypto: OzonCredentialsCryptoService,
        private readonly configService: ConfigService,
        private readonly auditService: OzonConnectionAuditService,
    ) {}

    async create(
        userId: string,
        dto: CreateOzonConnectionDto,
    ): Promise<OzonConnectionSafeView> {
        await this.validateCredentials(dto.clientId, dto.apiKey, userId);

        const encryptedApiKey = this.credentialsCrypto.encrypt(dto.apiKey);
        const encryptedPerformanceClientId = dto.performanceClientId
            ? this.credentialsCrypto.encrypt(dto.performanceClientId)
            : undefined;
        const encryptedPerformanceClientSecret = dto.performanceClientSecret
            ? this.credentialsCrypto.encrypt(dto.performanceClientSecret)
            : undefined;
        const encryptedPerformanceToken = dto.performanceToken
            ? this.credentialsCrypto.encrypt(dto.performanceToken)
            : undefined;

        const connection = await this.connectionModel.create({
            userId: new Types.ObjectId(userId),
            sellerName: dto.sellerName,
            clientId: dto.clientId,
            encryptedApiKey,
            encryptedPerformanceClientId,
            encryptedPerformanceClientSecret,
            encryptedPerformanceToken,
            status: OzonConnectionStatus.ACTIVE,
            permissions: ['seller_api'],
            telegramChatId: dto.telegramChatId,
        });

        this.logger.log(
            `Ozon connection created userId=${userId} connectionId=${String(connection._id)} clientId=${dto.clientId}`,
        );

        await this.auditService.log({
            userId,
            connectionId: String(connection._id),
            action: OzonConnectionAuditAction.CONNECT,
            status: OzonConnectionAuditStatus.SUCCESS,
            summary: `Подключён магазин ${dto.sellerName}`,
        });

        return this.toSafeView(connection);
    }

    async findAllByUser(userId: string): Promise<OzonConnectionSafeView[]> {
        const connections = await this.connectionModel
            .find({
                userId: new Types.ObjectId(userId),
                deletedAt: { $exists: false },
            })
            .sort({ createdAt: -1 })
            .exec();

        return connections.map((connection) => this.toSafeView(connection));
    }

    async findAllActive(): Promise<Array<{ id: string; userId: string }>> {
        const connections: Array<{ id: string; userId: string }> = [];
        for await (const connection of this.iterateActiveConnections()) {
            connections.push(connection);
        }
        return connections;
    }

    /** Cursor-пагинация активных подключений для cron */
    async *iterateActiveConnections(
        batchSize = 100,
    ): AsyncGenerator<{ id: string; userId: string }> {
        let lastId: Types.ObjectId | undefined;

        while (true) {
            const filter: Record<string, unknown> = {
                status: OzonConnectionStatus.ACTIVE,
                deletedAt: { $exists: false },
            };

            if (lastId) {
                filter._id = { $gt: lastId };
            }

            const batch = await this.connectionModel
                .find(filter)
                .select({ _id: 1, userId: 1 })
                .sort({ _id: 1 })
                .limit(batchSize)
                .exec();

            if (batch.length === 0) {
                break;
            }

            for (const connection of batch) {
                yield {
                    id: String(connection._id),
                    userId: String(connection.userId),
                };
            }

            lastId = batch[batch.length - 1]._id as Types.ObjectId;
            if (batch.length < batchSize) {
                break;
            }
        }
    }

    async findByIdForUser(
        userId: string,
        connectionId: string,
    ): Promise<OzonConnectionDoc> {
        const connection = await this.connectionModel.findOne({
            _id: new Types.ObjectId(connectionId),
            userId: new Types.ObjectId(userId),
            deletedAt: { $exists: false },
        });

        if (!connection) {
            throw new NotFoundException('Подключение Ozon не найдено');
        }

        return connection;
    }

    /** Находит подключение по ID для admin API */
    async findByIdAdmin(connectionId: string): Promise<OzonConnectionDoc> {
        if (!Types.ObjectId.isValid(connectionId)) {
            throw new BadRequestException('Некорректный ID подключения');
        }

        const connection = await this.connectionModel.findById(connectionId);
        if (!connection || connection.deletedAt) {
            throw new NotFoundException('Подключение Ozon не найдено');
        }

        return connection;
    }

    async pauseConnection(connectionId: string): Promise<OzonConnectionDoc> {
        const connection = await this.findByIdAdmin(connectionId);
        connection.status = OzonConnectionStatus.PAUSED;
        await connection.save();
        return connection;
    }

    async resumeConnection(connectionId: string): Promise<OzonConnectionDoc> {
        const connection = await this.findByIdAdmin(connectionId);
        connection.status = OzonConnectionStatus.ACTIVE;
        await connection.save();
        return connection;
    }

    async softDeleteAdmin(connectionId: string): Promise<void> {
        const connection = await this.findByIdAdmin(connectionId);
        connection.status = OzonConnectionStatus.REVOKED;
        connection.deletedAt = new Date();
        await connection.save();
    }

    async healthCheckAdmin(
        connectionId: string,
    ): Promise<{ healthy: boolean; status: OzonConnectionStatus; permissions: string[] }> {
        const connection = await this.findByIdAdmin(connectionId);
        return this.healthCheck(String(connection.userId), connectionId);
    }

    async healthCheck(
        userId: string,
        connectionId: string,
    ): Promise<{ healthy: boolean; status: OzonConnectionStatus; permissions: string[] }> {
        const connection = await this.findByIdForUser(userId, connectionId);
        const apiKey = this.credentialsCrypto.decrypt(connection.encryptedApiKey);

        try {
            const roles = await this.sellerApiClient.healthCheck(
                { clientId: connection.clientId, apiKey },
                userId,
            );

            const permissions = roles.result?.map((role) => role.name) ?? [];
            connection.status = OzonConnectionStatus.ACTIVE;
            connection.permissions = permissions;
            await connection.save();

            await this.auditService.log({
                userId,
                connectionId,
                action: OzonConnectionAuditAction.HEALTH_CHECK,
                status: OzonConnectionAuditStatus.SUCCESS,
            });

            return {
                healthy: true,
                status: connection.status,
                permissions,
            };
        } catch {
            connection.status = OzonConnectionStatus.INVALID;
            await connection.save();

            await this.auditService.log({
                userId,
                connectionId,
                action: OzonConnectionAuditAction.HEALTH_CHECK,
                status: OzonConnectionAuditStatus.FAILED,
            });

            return {
                healthy: false,
                status: connection.status,
                permissions: connection.permissions,
            };
        }
    }

    async revoke(userId: string, connectionId: string): Promise<void> {
        const connection = await this.findByIdForUser(userId, connectionId);
        connection.status = OzonConnectionStatus.REVOKED;
        connection.deletedAt = new Date();
        await connection.save();

        await this.auditService.log({
            userId,
            connectionId,
            action: OzonConnectionAuditAction.DISCONNECT,
            status: OzonConnectionAuditStatus.SUCCESS,
        });

        this.logger.log(
            `Ozon connection revoked userId=${userId} connectionId=${connectionId}`,
        );
    }

    getDecryptedApiKey(connection: OzonConnectionDoc): string {
        return this.credentialsCrypto.decrypt(connection.encryptedApiKey);
    }

    getDecryptedPerformanceToken(connection: OzonConnectionDoc): string | undefined {
        if (!connection.encryptedPerformanceToken) {
            return undefined;
        }
        return this.credentialsCrypto.decrypt(connection.encryptedPerformanceToken);
    }

    getPerformanceCredentials(
        connection: OzonConnectionDoc,
    ): OzonPerformanceCredentials | undefined {
        const bearerToken = this.getDecryptedPerformanceToken(connection);
        const clientId = connection.encryptedPerformanceClientId
            ? this.credentialsCrypto.decrypt(connection.encryptedPerformanceClientId)
            : undefined;
        const clientSecret = connection.encryptedPerformanceClientSecret
            ? this.credentialsCrypto.decrypt(
                  connection.encryptedPerformanceClientSecret,
              )
            : undefined;

        if (bearerToken) {
            return { bearerToken, clientId, clientSecret };
        }

        if (clientId && clientSecret) {
            return { clientId, clientSecret };
        }

        return undefined;
    }

    async markSyncCompleted(connectionId: string): Promise<void> {
        await this.connectionModel.updateOne(
            { _id: new Types.ObjectId(connectionId) },
            { lastSyncAt: new Date() },
        );
    }

    async markError(connectionId: string): Promise<void> {
        await this.connectionModel.updateOne(
            { _id: new Types.ObjectId(connectionId) },
            { status: OzonConnectionStatus.ERROR },
        );
    }

    private async validateCredentials(
        clientId: string,
        apiKey: string,
        userId: string,
    ): Promise<void> {
        const encryptionKey = this.configService.get<string>('ozon.encryption.key');
        const encryptionIv = this.configService.get<string>('ozon.encryption.iv');

        if (!encryptionKey || !encryptionIv) {
            throw new BadRequestException(
                'OZON_ENCRYPTION_KEY и OZON_ENCRYPTION_IV должны быть заданы',
            );
        }

        try {
            await this.sellerApiClient.healthCheck({ clientId, apiKey }, userId);
        } catch {
            throw new UnauthorizedException(
                'Не удалось авторизоваться в Ozon Seller API. Проверьте Client-Id и Api-Key.',
            );
        }
    }

    private toSafeView(connection: OzonConnectionDoc): OzonConnectionSafeView {
        return {
            id: String(connection._id),
            sellerName: connection.sellerName,
            clientId: connection.clientId,
            status: connection.status,
            permissions: connection.permissions,
            lastSyncAt: connection.lastSyncAt,
            telegramChatId: connection.telegramChatId,
            createdAt: connection.get('createdAt') as Date | undefined,
            updatedAt: connection.get('updatedAt') as Date | undefined,
        };
    }
}
