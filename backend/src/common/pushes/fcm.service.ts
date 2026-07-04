import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

/** Мультиязычный текст пуша (совместимо с PushHistoryTranslations) */
export interface FcmMultilingualPayload {
    ru: { title: string; body: string };
    kk?: { title: string; body: string };
    en?: { title: string; body: string };
}

/** Цель отправки: FCM-токен и предпочитаемая локаль */
export interface FcmDeviceTarget {
    token: string;
    locale: 'ru' | 'kk' | 'en';
    /** Доп. поля data FCM для токена (поверх общего data в sendToTargets) */
    dataExtras?: Record<string, string>;
}

const FCM_MULTICAST_LIMIT = 500;

/** Отправка push через Firebase Cloud Messaging (мультикаст по локалям). */
@Injectable()
export class FcmService {
    private readonly logger = new Logger(FcmService.name);
    private legacyTransportEnabled = false;

    constructor(private readonly config: ConfigService) {}

    private ensureApp(): admin.app.App | null {
        const json = this.config.get<string>('firebase.serviceAccountJson');
        if (!json?.trim()) {
            this.logger.warn(
                'FCM: не задан сервисный аккаунт (FIREBASE_SERVICE_ACCOUNT_JSON или FIREBASE_SERVICE_ACCOUNT_JSON_PATH)',
            );
            return null;
        }
        if (admin.apps.length > 0) {
            return admin.app();
        }
        let cred: admin.ServiceAccount;
        try {
            cred = JSON.parse(json) as admin.ServiceAccount;
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.warn(`FCM: JSON сервисного аккаунта не парсится: ${msg}`);
            return null;
        }
        try {
            return admin.initializeApp({
                credential: admin.credential.cert(cred),
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            this.logger.warn(`FCM: ключ сервисного аккаунта отклонён Firebase SDK: ${msg}`);
            return null;
        }
    }

    private pickLocalized(
        translations: FcmMultilingualPayload,
        locale: 'ru' | 'kk' | 'en',
    ): { title: string; body: string } {
        const ru = translations.ru;
        if (locale === 'ru') {
            return ru;
        }
        if (locale === 'kk' && translations.kk) {
            return translations.kk;
        }
        if (locale === 'en' && translations.en) {
            return translations.en;
        }
        return ru;
    }

    private toDataPayload(data?: Record<string, unknown>): Record<string, string> | undefined {
        if (!data || Object.keys(data).length === 0) {
            return undefined;
        }
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(data)) {
            if (v === undefined || v === null) {
                continue;
            }
            out[k] = typeof v === 'string' ? v : JSON.stringify(v);
        }
        return out;
    }

    private mergeFcmDataStrings(
        base: Record<string, string> | undefined,
        extras: Record<string, string> | undefined,
    ): Record<string, string> | undefined {
        if (!base && !extras) {
            return undefined;
        }
        const out: Record<string, string> = { ...(base ?? {}), ...(extras ?? {}) };
        return Object.keys(out).length > 0 ? out : undefined;
    }

    private stableDataKey(data: Record<string, string> | undefined): string {
        if (!data || Object.keys(data).length === 0) {
            return '';
        }
        return Object.keys(data)
            .sort()
            .map((k) => `${k}=${data[k]}`)
            .join('&');
    }

    private async sendEachForMulticastWithTimeout(
        messaging: admin.messaging.Messaging,
        payload: admin.messaging.MulticastMessage,
        timeoutMs: number,
    ): Promise<admin.messaging.BatchResponse> {
        const sendPromise = messaging.sendEachForMulticast(payload);
        // Если выиграл таймаут, отклонение sendPromise не должно стать unhandledRejection
        void sendPromise.catch(() => undefined);

        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error(`FCM timeout after ${String(timeoutMs)}ms`));
            }, timeoutMs);
        });

        try {
            return await Promise.race([sendPromise, timeoutPromise]);
        } finally {
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }
        }
    }

    /**
     * Отправка по списку целей с учётом локали устройства.
     * Группирует токены с одинаковым title/body и шлёт sendEachForMulticast.
     */
    async sendToTargets(
        targets: FcmDeviceTarget[],
        translations: FcmMultilingualPayload,
        data?: Record<string, unknown>,
    ): Promise<{ success: boolean; successCount: number }> {
        const app = this.ensureApp();
        if (!app) {
            return { success: false, successCount: 0 };
        }
        if (targets.length === 0) {
            return { success: false, successCount: 0 };
        }

        const messaging = admin.messaging(app);
        if (!this.legacyTransportEnabled) {
            try {
                // Стабилизация локальной/dev среды: избегаем падений HTTP/2 transport в firebase-admin.
                messaging.enableLegacyHttpTransport();
                this.legacyTransportEnabled = true;
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : String(e);
                this.logger.warn(`FCM: не удалось включить legacy transport: ${msg}`);
            }
        }
        const dataPayload = this.toDataPayload(data);
        const fcmSendTimeoutMs =
            this.config.get<number>('firebase.fcmSendTimeoutMs') ?? 45000;

        const groups = new Map<
            string,
            { title: string; body: string; tokens: string[]; fcmData: Record<string, string> | undefined }
        >();
        for (const t of targets) {
            const { title, body } = this.pickLocalized(translations, t.locale);
            const mergedData = this.mergeFcmDataStrings(dataPayload, t.dataExtras);
            const key = `${title}\u0000${body}\u0000${this.stableDataKey(mergedData)}`;
            const existing = groups.get(key);
            if (existing) {
                existing.tokens.push(t.token);
            } else {
                groups.set(key, { title, body, tokens: [t.token], fcmData: mergedData });
            }
        }

        let successCount = 0;
        for (const { title, body, tokens, fcmData } of groups.values()) {
            for (let i = 0; i < tokens.length; i += FCM_MULTICAST_LIMIT) {
                const chunk = tokens.slice(i, i + FCM_MULTICAST_LIMIT);
                try {
                    const res = await this.sendEachForMulticastWithTimeout(
                        messaging,
                        {
                            tokens: chunk,
                            notification: { title, body },
                            data: fcmData,
                        },
                        fcmSendTimeoutMs,
                    );
                    successCount += res.successCount;
                    if (res.failureCount > 0) {
                        this.logger.warn(
                            `FCM: часть токенов не доставлена failureCount=${String(res.failureCount)}`,
                        );
                    }
                } catch (e: unknown) {
                    const msg = e instanceof Error ? e.message : String(e);
                    this.logger.warn(`FCM sendEachForMulticast: ${msg}`);
                }
            }
        }

        return { success: successCount > 0, successCount };
    }

    /** Одна локаль (например, автоматические пуши только на ru). */
    async sendToTokens(
        tokens: string[],
        title: string,
        body: string,
        data?: Record<string, unknown>,
    ): Promise<{ success: boolean; successCount: number }> {
        const targets: FcmDeviceTarget[] = tokens.map((token) => ({
            token,
            locale: 'ru',
        }));
        const translations: FcmMultilingualPayload = {
            ru: { title, body },
        };
        return this.sendToTargets(targets, translations, data);
    }
}
